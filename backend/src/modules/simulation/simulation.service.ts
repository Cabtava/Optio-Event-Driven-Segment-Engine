import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AddTransactionDto } from './dto/add-transaction.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { AdvanceTimeDto } from './dto/advance-time.dto';

@Injectable()
export class SimulationService {
  constructor(private readonly prisma: PrismaService) {}

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
      throw new NotFoundException(`Customer with id ${dto.customerId} not found`);
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

    return {
      message: 'Transaction added successfully',
      transaction,
    };
  }

  async updateProfile(dto: UpdateProfileDto) {
    const customer = await this.prisma.customer.findUnique({
      where: { id: dto.customerId },
    });

    if (!customer) {
      throw new NotFoundException(`Customer with id ${dto.customerId} not found`);
    }

    const updatedCustomer = await this.prisma.customer.update({
      where: { id: dto.customerId },
      data: {
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.city !== undefined ? { city: dto.city } : {}),
        ...(dto.status !== undefined ? { status: dto.status } : {}),
      },
    });

    return {
      message: 'Customer profile updated successfully',
      customer: updatedCustomer,
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

    return {
      message: 'Simulation time advanced successfully',
      previousTime: state.currentTime,
      currentTime: updated.currentTime,
      advancedByDays: dto.days,
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