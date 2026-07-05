import { Controller, Get, Param, Query } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { ListIndicatorsQuery, ValuesQuery } from "./dto/queries.dto";
import { IndicatorsService } from "./indicators.service";

@ApiTags("statistics")
@Controller("statistics")
export class StatisticsController {
  constructor(private readonly indicators: IndicatorsService) {}

  @Get()
  list(@Query() query: ListIndicatorsQuery) {
    return this.indicators.list(query);
  }

  @Get(":id")
  byId(@Param("id") id: string) {
    return this.indicators.byId(id);
  }

  @Get(":id/values")
  values(@Param("id") id: string, @Query() query: ValuesQuery) {
    return this.indicators.values(id, query);
  }
}
