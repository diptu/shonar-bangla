import { Controller, Get, Param, Query } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import type { Sector } from "@shonar/domain";
import { PaginationQuery, ValuesQuery } from "./dto/queries.dto";
import { IndicatorsService } from "./indicators.service";

// Faithful per-sector endpoint surface (user decision), thin wrappers over one
// shared service — the sector is the only thing each controller adds.
abstract class SectorController {
  protected abstract readonly sector: Sector;

  constructor(protected readonly indicators: IndicatorsService) {}

  @Get()
  list(@Query() query: PaginationQuery) {
    return this.indicators.list(query, this.sector);
  }

  @Get(":id/values")
  values(@Param("id") id: string, @Query() query: ValuesQuery) {
    return this.indicators.values(id, query);
  }
}

// Explicit constructors: param metadata is only emitted on decorated classes,
// so the abstract base alone gives the subclasses nothing to inject.
@ApiTags("economy")
@Controller("economy")
export class EconomyController extends SectorController {
  protected readonly sector = "economy" as const;
  constructor(indicators: IndicatorsService) {
    super(indicators);
  }
}

@ApiTags("education")
@Controller("education")
export class EducationController extends SectorController {
  protected readonly sector = "education" as const;
  constructor(indicators: IndicatorsService) {
    super(indicators);
  }
}

@ApiTags("healthcare")
@Controller("healthcare")
export class HealthcareController extends SectorController {
  protected readonly sector = "healthcare" as const;
  constructor(indicators: IndicatorsService) {
    super(indicators);
  }
}
