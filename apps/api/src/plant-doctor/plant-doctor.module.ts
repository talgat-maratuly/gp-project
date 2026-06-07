import { Module } from '@nestjs/common';
import { AiAssistantModule } from '../ai-assistant/ai-assistant.module';
import { UploadsModule } from '../uploads/uploads.module';
import { PlantDoctorController } from './plant-doctor.controller';
import { PlantDoctorService } from './plant-doctor.service';

@Module({
  imports: [AiAssistantModule, UploadsModule],
  controllers: [PlantDoctorController],
  providers: [PlantDoctorService],
})
export class PlantDoctorModule {}
