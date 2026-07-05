import { Module } from "@nestjs/common";
import { HealthController } from "./health.controller";
import { GeographyModule } from "./modules/geography/geography.module";
import { IndicatorsModule } from "./modules/indicators/indicators.module";
import { PrismaModule } from "./prisma/prisma.module";

@Module({
  imports: [PrismaModule, GeographyModule, IndicatorsModule],
  controllers: [HealthController],
})
export class AppModule {}
