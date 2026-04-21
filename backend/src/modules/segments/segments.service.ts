import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class SegmentsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    const segments = await this.prisma.segment.findMany({
      orderBy: {
        createdAt: 'asc',
      },
      include: {
        memberships: true,
        dependencies: {
          include: {
            dependsOnSegment: true,
          },
        },
        usedBy: {
          include: {
            segment: true,
          },
        },
        deltas: {
          orderBy: {
            createdAt: 'desc',
          },
          take: 1,
        },
      },
    });

    return segments.map((segment) => ({
      id: segment.id,
      name: segment.name,
      type: segment.type,
      ruleJson: segment.ruleJson,
      lastEvaluatedAt: segment.lastEvaluatedAt,
      lastSnapshotVersion: segment.lastSnapshotVersion,
      memberCount: segment.memberships.length,
      latestDelta: segment.deltas[0] ?? null,
      dependencies: segment.dependencies.map((d) => ({
        id: d.dependsOnSegment.id,
        name: d.dependsOnSegment.name,
        type: d.dependsOnSegment.type,
      })),
      usedBy: segment.usedBy.map((u) => ({
        id: u.segment.id,
        name: u.segment.name,
        type: u.segment.type,
      })),
    }));
  }

  async findOne(id: string) {
    const segment = await this.prisma.segment.findUnique({
      where: { id },
      include: {
        dependencies: {
          include: {
            dependsOnSegment: true,
          },
        },
        usedBy: {
          include: {
            segment: true,
          },
        },
      },
    });

    if (!segment) {
      throw new NotFoundException(`Segment with id ${id} not found`);
    }

    const memberCount = await this.prisma.segmentMembershipCurrent.count({
      where: {
        segmentId: id,
      },
    });

    return {
      ...segment,
      memberCount,
      dependencies: segment.dependencies.map((d) => ({
        id: d.dependsOnSegment.id,
        name: d.dependsOnSegment.name,
        type: d.dependsOnSegment.type,
      })),
      usedBy: segment.usedBy.map((u) => ({
        id: u.segment.id,
        name: u.segment.name,
        type: u.segment.type,
      })),
    };
  }

  async findMembers(segmentId: string) {
    const segment = await this.prisma.segment.findUnique({
      where: { id: segmentId },
    });

    if (!segment) {
      throw new NotFoundException(`Segment with id ${segmentId} not found`);
    }

    return this.prisma.segmentMembershipCurrent.findMany({
      where: {
        segmentId,
      },
      include: {
        customer: {
          include: {
            transactions: {
              orderBy: {
                occurredAt: 'desc',
              },
              take: 5,
            },
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });
  }

  async findDeltas(segmentId: string) {
    const segment = await this.prisma.segment.findUnique({
      where: { id: segmentId },
    });

    if (!segment) {
      throw new NotFoundException(`Segment with id ${segmentId} not found`);
    }

    return this.prisma.segmentDelta.findMany({
      where: {
        segmentId,
      },
      include: {
        items: {
          include: {
            customer: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }
}