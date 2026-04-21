import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AddTransactionDto } from './dto/add-transaction.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { AdvanceTimeDto } from './dto/advance-time.dto';
import { ChangeAggregationService } from '../change-aggregation/change-aggregation.service';

@Injectable()
export class SimulationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly changeAggregationService: ChangeAggregationService,
  ) {}

  async getCurrentTime() {
    const state = await this.ensureSimulationState();

    return {
      currentTime: state.currentTime,
    };
  }

  async addTransaction(dto: AddTransactionDto) {
    const customer = await this.prisma.customer.findUnique({
      where: { id: dto.customerId },
    });

    if (!customer) {
      throw new NotFoundException(
        `Customer with id ${dto.customerId} not found`,
      );
    }

    const simulationState = await this.ensureSimulationState();

    const occurredAt = dto.occurredAt
      ? new Date(dto.occurredAt)
      : simulationState.currentTime;

    const transaction = await this.prisma.transaction.create({
      data: {
        customerId: dto.customerId,
        amount: dto.amount,
        occurredAt,
      },
    });

    const impactedSegments = await this.prisma.segment.findMany({
      where: {
        type: 'DYNAMIC',
      },
      select: {
        id: true,
        name: true,
      },
    });

    for (const segment of impactedSegments) {
      await this.changeAggregationService.registerSegmentImpact({
        segmentId: segment.id,
        triggerType: 'TRANSACTION',
        customerIds: [dto.customerId],
      });
    }

    return {
      message: 'Transaction added successfully',
      transaction,
      impactedSegments: impactedSegments.map((segment) => segment.name),
      debounced: true,
    };
  }

  async updateProfile(dto: UpdateProfileDto) {
    const customer = await this.prisma.customer.findUnique({
      where: { id: dto.customerId },
    });

    if (!customer) {
      throw new NotFoundException(
        `Customer with id ${dto.customerId} not found`,
      );
    }

    const updatedCustomer = await this.prisma.customer.update({
      where: { id: dto.customerId },
      data: {
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.city !== undefined ? { city: dto.city } : {}),
        ...(dto.status !== undefined ? { status: dto.status } : {}),
      },
    });

    const impactedSegments = await this.prisma.segment.findMany({
      where: {
        type: 'DYNAMIC',
      },
      select: {
        id: true,
        name: true,
      },
    });

    for (const segment of impactedSegments) {
      await this.changeAggregationService.registerSegmentImpact({
        segmentId: segment.id,
        triggerType: 'PROFILE_UPDATE',
        customerIds: [dto.customerId],
      });
    }

    return {
      message: 'Customer profile updated successfully',
      customer: updatedCustomer,
      impactedSegments: impactedSegments.map((segment) => segment.name),
      debounced: true,
    };
  }

  async advanceTime(dto: AdvanceTimeDto) {
    const state = await this.ensureSimulationState();

    const nextTime = new Date(state.currentTime);
    nextTime.setDate(nextTime.getDate() + dto.days);

    const updated = await this.prisma.simulationState.update({
      where: { id: 'global' },
      data: {
        currentTime: nextTime,
      },
    });

    const impactedSegments = await this.prisma.segment.findMany({
      where: {
        type: 'DYNAMIC',
      },
      select: {
        id: true,
        name: true,
      },
    });

    for (const segment of impactedSegments) {
      await this.changeAggregationService.registerSegmentImpact({
        segmentId: segment.id,
        triggerType: 'TIME_ADVANCE',
      });
    }

    return {
      message: 'Simulation time advanced successfully',
      previousTime: state.currentTime,
      currentTime: updated.currentTime,
      advancedByDays: dto.days,
      impactedSegments: impactedSegments.map((segment) => segment.name),
      debounced: true,
    };
  }

  private async ensureSimulationState() {
    return this.prisma.simulationState.upsert({
      where: { id: 'global' },
      update: {},
      create: {
        id: 'global',
        currentTime: new Date(),
      },
    });
  }
}