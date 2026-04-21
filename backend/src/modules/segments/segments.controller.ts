import { Controller, Get, Param } from '@nestjs/common';
import { SegmentsService } from './segments.service';

@Controller('segments')
export class SegmentsController {
  constructor(private readonly segmentsService: SegmentsService) {}

  @Get()
  findAll() {
    return this.segmentsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.segmentsService.findOne(id);
  }

  @Get(':id/members')
  findMembers(@Param('id') id: string) {
    return this.segmentsService.findMembers(id);
  }

  @Get(':id/deltas')
  findDeltas(@Param('id') id: string) {
    return this.segmentsService.findDeltas(id);
  }
}