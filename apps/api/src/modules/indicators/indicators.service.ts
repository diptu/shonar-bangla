import { Injectable, NotFoundException } from "@nestjs/common";
import type { Sector } from "@shonar/domain";
import { PrismaService } from "../../prisma/prisma.service";
import type { ListIndicatorsQuery, ValuesQuery } from "./dto/queries.dto";

@Injectable()
export class IndicatorsService {
  constructor(private readonly prisma: PrismaService) {}

  list(query: ListIndicatorsQuery, sector?: Sector) {
    const effectiveSector = sector ?? query.sector;
    return this.prisma.indicator.findMany({
      ...(effectiveSector ? { where: { sector: effectiveSector } } : {}),
      orderBy: { id: "asc" },
      take: query.limit,
      skip: query.offset,
    });
  }

  async byId(id: string) {
    const indicator = await this.prisma.indicator.findUnique({ where: { id } });
    if (!indicator) throw new NotFoundException(`Unknown indicator: ${id}`);
    return indicator;
  }

  async values(indicatorId: string, query: ValuesQuery) {
    await this.byId(indicatorId); // 404 before returning an empty list for a typo'd id
    return this.prisma.indicatorValue.findMany({
      where: {
        indicatorId,
        ...(query.geoCode ? { geoCode: query.geoCode.toUpperCase() } : {}),
        ...(query.from ?? query.to
          ? { year: { ...(query.from ? { gte: query.from } : {}), ...(query.to ? { lte: query.to } : {}) } }
          : {}),
      },
      orderBy: [{ geoCode: "asc" }, { year: "asc" }],
      take: query.limit,
      skip: query.offset,
    });
  }
}
