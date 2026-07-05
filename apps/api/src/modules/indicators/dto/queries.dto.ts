import { SECTORS, type Sector } from "@shonar/domain";
import { Type } from "class-transformer";
import { IsIn, IsInt, IsOptional, IsString, Max, Min } from "class-validator";

export class PaginationQuery {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(200)
  limit = 50;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset = 0;
}

export class ListIndicatorsQuery extends PaginationQuery {
  @IsOptional()
  @IsIn(SECTORS)
  sector?: Sector;
}

export class ValuesQuery extends PaginationQuery {
  @IsOptional()
  @IsString()
  geoCode?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  from?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  to?: number;
}
