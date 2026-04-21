import { Injectable, NotFoundException } from '@nestjs/common';
import { DeltaChangeType, EvaluationTriggerType, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

type FieldRuleCondition = {
  field: string;
  operator: string;
  value: any;
};

type SegmentRefRuleCondition = {
  type: 'segment_ref';
  segmentId?: string;
  segmentName?: string;
};

type RuleCondition = FieldRuleCondition | SegmentRefRuleCondition;

type RuleGroup = {
  op: 'and' | 'or';
  conditions: RuleCondition[];
};

type CustomerWithTransactions = {
  id: string;
  city: string | null;
  transactions: {
    id: string;
    amount: Prisma.Decimal;
    occurredAt: Date;
  }[];
};

@Injectable()
export class SegmentEvaluatorService {
  constructor(private readonly prisma: PrismaService) {}

  async recomputeSegment(segmentId: string, triggerTypeRaw: string) {
    const segment = await this.prisma.segment.findUnique({
      where: { id: segmentId },
    });

    if (!segment) {
      throw new NotFoundException(`Segment with id ${segmentId} not found`);
    }

    const triggerType = this.normalizeTriggerType(triggerTypeRaw);

    const oldMemberships = await this.prisma.segmentMembershipCurrent.findMany({
      where: { segmentId },
      select: { customerId: true },
    });

    const oldCustomerIds = oldMemberships.map((m) => m.customerId);
    const newCustomerIds = await this.evaluateSegmentMembers(segment.id);

    const oldSet = new Set(oldCustomerIds);
    const newSet = new Set(newCustomerIds);

    const added = newCustomerIds.filter((id) => !oldSet.has(id));
    const removed = oldCustomerIds.filter((id) => !newSet.has(id));

    const nextVersion = segment.lastSnapshotVersion + 1;

    await this.prisma.$transaction(async (tx) => {
      await tx.segmentMembershipCurrent.deleteMany({
        where: { segmentId },
      });

      if (newCustomerIds.length > 0) {
        await tx.segmentMembershipCurrent.createMany({
          data: newCustomerIds.map((customerId) => ({
            segmentId,
            customerId,
          })),
          skipDuplicates: true,
        });
      }

      const delta = await tx.segmentDelta.create({
        data: {
          segmentId,
          fromVersion: segment.lastSnapshotVersion,
          toVersion: nextVersion,
          addedCount: added.length,
          removedCount: removed.length,
          triggerType,
        },
      });

      const deltaItems = [
        ...added.map((customerId) => ({
          deltaId: delta.id,
          customerId,
          changeType: DeltaChangeType.ADDED,
        })),
        ...removed.map((customerId) => ({
          deltaId: delta.id,
          customerId,
          changeType: DeltaChangeType.REMOVED,
        })),
      ];

      if (deltaItems.length > 0) {
        await tx.segmentDeltaItem.createMany({
          data: deltaItems,
        });
      }

      await tx.segment.update({
        where: { id: segmentId },
        data: {
          lastSnapshotVersion: nextVersion,
          lastEvaluatedAt: new Date(),
        },
      });
    });

    return {
      segmentId: segment.id,
      segmentName: segment.name,
      triggerType,
      previousVersion: segment.lastSnapshotVersion,
      nextVersion,
      oldCount: oldCustomerIds.length,
      newCount: newCustomerIds.length,
      addedCount: added.length,
      removedCount: removed.length,
      added,
      removed,
    };
  }

  private normalizeTriggerType(value: string): EvaluationTriggerType {
    const allowed = Object.values(EvaluationTriggerType);

    if (allowed.includes(value as EvaluationTriggerType)) {
      return value as EvaluationTriggerType;
    }

    return EvaluationTriggerType.MANUAL_REFRESH;
  }

  async evaluateSegmentMembers(segmentId: string): Promise<string[]> {
    const segment = await this.prisma.segment.findUnique({
      where: { id: segmentId },
    });

    if (!segment) {
      throw new NotFoundException(`Segment with id ${segmentId} not found`);
    }

    const rule = segment.ruleJson as unknown as RuleGroup;

    if (!rule || !rule.conditions || !Array.isArray(rule.conditions)) {
      return [];
    }

    const customers = await this.prisma.customer.findMany({
      include: {
        transactions: {
          orderBy: {
            occurredAt: 'desc',
          },
        },
      },
    });

    const matchedIds: string[] = [];

    for (const customer of customers) {
      const isMatch = await this.evaluateRuleGroup(
        rule,
        customer as CustomerWithTransactions,
      );

      if (isMatch) {
        matchedIds.push(customer.id);
      }
    }

    return matchedIds;
  }

  private async evaluateRuleGroup(
    rule: RuleGroup,
    customer: CustomerWithTransactions,
  ): Promise<boolean> {
    const results: boolean[] = [];

    for (const condition of rule.conditions) {
      if (this.isSegmentRefCondition(condition)) {
        const result = await this.evaluateSegmentRef(condition, customer.id);
        results.push(result);
      } else {
        const result = this.evaluateFieldCondition(condition, customer);
        results.push(result);
      }
    }

    if (rule.op === 'or') {
      return results.some(Boolean);
    }

    return results.every(Boolean);
  }

  private isSegmentRefCondition(
    condition: RuleCondition,
  ): condition is SegmentRefRuleCondition {
    return 'type' in condition && condition.type === 'segment_ref';
  }

  private async evaluateSegmentRef(
    condition: SegmentRefRuleCondition,
    customerId: string,
  ): Promise<boolean> {
    let referencedSegmentId = condition.segmentId;

    if (!referencedSegmentId && condition.segmentName) {
      const segment = await this.prisma.segment.findUnique({
        where: {
          name: condition.segmentName,
        },
      });

      referencedSegmentId = segment?.id;
    }

    if (!referencedSegmentId) {
      return false;
    }

    const membership = await this.prisma.segmentMembershipCurrent.findUnique({
      where: {
        segmentId_customerId: {
          segmentId: referencedSegmentId,
          customerId,
        },
      },
    });

    return !!membership;
  }

  private evaluateFieldCondition(
    condition: FieldRuleCondition,
    customer: CustomerWithTransactions,
  ): boolean {
    const now = new Date();

    switch (condition.field) {
      case 'transactions_count_30d': {
        const count = customer.transactions.filter((tx) =>
          this.isWithinDays(tx.occurredAt, 30, now),
        ).length;

        return this.compare(count, condition.operator, condition.value);
      }

      case 'spend_sum_60d': {
        const sum = customer.transactions
          .filter((tx) => this.isWithinDays(tx.occurredAt, 60, now))
          .reduce((acc, tx) => acc + Number(tx.amount), 0);

        return this.compare(sum, condition.operator, condition.value);
      }

      case 'days_since_last_transaction': {
        if (customer.transactions.length === 0) {
          return false;
        }

        const latest = customer.transactions[0];
        const days = this.diffInDays(latest.occurredAt, now);

        return this.compare(days, condition.operator, condition.value);
      }

      case 'had_any_transaction_before': {
        const hasAny = customer.transactions.length > 0;
        return this.compare(hasAny, condition.operator, condition.value);
      }

      case 'city': {
        if (condition.operator === 'in' && Array.isArray(condition.value)) {
          return condition.value.includes(customer.city);
        }

        return this.compare(customer.city, condition.operator, condition.value);
      }

      default:
        return false;
    }
  }

  private isWithinDays(date: Date, days: number, now: Date): boolean {
    const diffMs = now.getTime() - date.getTime();
    const diffDays = diffMs / (1000 * 60 * 60 * 24);
    return diffDays <= days;
  }

  private diffInDays(date: Date, now: Date): number {
    const diffMs = now.getTime() - date.getTime();
    return Math.floor(diffMs / (1000 * 60 * 60 * 24));
  }

  private compare(left: any, operator: string, right: any): boolean {
    switch (operator) {
      case '>':
        return left > right;
      case '>=':
        return left >= right;
      case '<':
        return left < right;
      case '<=':
        return left <= right;
      case '=':
      case '==':
        return left === right;
      case '!=':
        return left !== right;
      default:
        return false;
    }
  }
}