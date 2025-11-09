import { Module } from '@nestjs/common';
import { TemporalService } from './temporal.service';
import { WorkflowController } from './workflow.controller';

@Module({
  providers: [TemporalService],
  controllers: [WorkflowController],
  exports: [TemporalService],
})
export class TemporalModule {}