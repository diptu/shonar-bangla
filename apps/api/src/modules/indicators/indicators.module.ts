import { Module } from "@nestjs/common";
import { IndicatorsService } from "./indicators.service";
import {
  EconomyController,
  EducationController,
  HealthcareController,
} from "./sector.controllers";
import { StatisticsController } from "./statistics.controller";

@Module({
  controllers: [
    StatisticsController,
    EconomyController,
    EducationController,
    HealthcareController,
  ],
  providers: [IndicatorsService],
})
export class IndicatorsModule {}
