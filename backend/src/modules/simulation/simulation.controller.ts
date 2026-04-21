import { Body, Controller, Get, Post } from '@nestjs/common';
import { SimulationService } from './simulation.service';
import { AddTransactionDto } from './dto/add-transaction.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { AdvanceTimeDto } from './dto/advance-time.dto';

@Controller('simulate')
export class SimulationController {
  constructor(private readonly simulationService: SimulationService) {}

  @Get('time')
  getCurrentTime() {
    return this.simulationService.getCurrentTime();
  }

  @Post('transaction')
  addTransaction(@Body() dto: AddTransactionDto) {
    return this.simulationService.addTransaction(dto);
  }

  @Post('profile-update')
  updateProfile(@Body() dto: UpdateProfileDto) {
    return this.simulationService.updateProfile(dto);
  }

  @Post('time-advance')
  advanceTime(@Body() dto: AdvanceTimeDto) {
    return this.simulationService.advanceTime(dto);
  }
}