import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class CustomersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.customer.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        transactions: {
          orderBy: {
            occurredAt: 'desc',
          },
        },
      },
    });
  }

  async findOne(id: string) {
    const customer = await this.prisma.customer.findUnique({
      where: { id },
      include: {
        transactions: {
          orderBy: {
            occurredAt: 'desc',
          },
        },
        memberships: {
          include: {
            segment: true,
          },
        },
      },
    });

    if (!customer) {
      throw new NotFoundException(`Customer with id ${id} not found`);
    }

    return customer;
  }
}