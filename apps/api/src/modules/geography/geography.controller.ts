import { Controller, Get, NotFoundException, Param } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { GeographyService } from "./geography.service";

@ApiTags("geography")
@Controller("geography")
export class GeographyController {
  constructor(private readonly geography: GeographyService) {}

  @Get("divisions")
  divisions() {
    return this.geography.findAllDivisions();
  }

  @Get("divisions/:code")
  async division(@Param("code") code: string) {
    const division = await this.geography.findDivision(code);
    if (!division) throw new NotFoundException(`Unknown division code: ${code}`);
    return division;
  }

  @Get("districts")
  districts() {
    return this.geography.findAllDistricts();
  }
}
