import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class GeographyService {
  constructor(private readonly prisma: PrismaService) {}

  findAllDivisions() {
    return this.prisma.division.findMany({
      include: { districts: { orderBy: { code: "asc" } } },
      orderBy: { code: "asc" },
    });
  }

  findDivision(code: string) {
    return this.prisma.division.findUnique({
      where: { code: code.toUpperCase() },
      include: { districts: { orderBy: { code: "asc" } } },
    });
  }

  findAllDistricts() {
    return this.prisma.district.findMany({ orderBy: { code: "asc" } });
  }
}
