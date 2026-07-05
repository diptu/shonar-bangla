// Seeds geography from @shonar/domain — single source of truth for the 8/64 split.
const { PrismaClient } = require("@prisma/client");
const { divisions } = require("@shonar/domain");

const prisma = new PrismaClient();

async function main() {
  for (const division of divisions) {
    await prisma.division.upsert({
      where: { code: division.code },
      update: { name: division.name },
      create: { code: division.code, name: division.name },
    });
    for (const district of division.districts) {
      await prisma.district.upsert({
        where: { code: district.code },
        update: { name: district.name, divisionCode: division.code },
        create: { code: district.code, name: district.name, divisionCode: division.code },
      });
    }
  }
  // Real indicator data — the API layer (Phase 6) is meaningless over empty tables.
  const indicators = [
    {
      id: "population",
      name: "Population",
      sector: "economy",
      unit: "persons",
      source: "BBS Census 2022",
      geoLevel: "division",
      values: [
        ["BD-A", 2022, 9100102],
        ["BD-B", 2022, 33202326],
        ["BD-C", 2022, 44215107],
        ["BD-D", 2022, 17416645],
        ["BD-E", 2022, 20353119],
        ["BD-F", 2022, 17610956],
        ["BD-G", 2022, 11034863],
        ["BD-H", 2022, 12225498],
      ],
    },
    {
      id: "gdp-growth",
      name: "GDP growth rate",
      sector: "economy",
      unit: "%",
      source: "World Bank WDI",
      geoLevel: "country",
      values: [
        ["BD", 2015, 6.6],
        ["BD", 2016, 7.1],
        ["BD", 2017, 6.6],
        ["BD", 2018, 7.3],
        ["BD", 2019, 7.9],
        ["BD", 2020, 3.4],
        ["BD", 2021, 6.9],
        ["BD", 2022, 7.1],
        ["BD", 2023, 5.8],
        ["BD", 2024, 4.2],
      ],
    },
  ];

  for (const { values, ...indicator } of indicators) {
    await prisma.indicator.upsert({
      where: { id: indicator.id },
      update: indicator,
      create: indicator,
    });
    for (const [geoCode, year, value] of values) {
      await prisma.indicatorValue.upsert({
        where: { indicatorId_geoCode_year: { indicatorId: indicator.id, geoCode, year } },
        update: { value },
        create: { indicatorId: indicator.id, geoCode, year, value },
      });
    }
  }

  const [divCount, distCount, indCount, valCount] = await Promise.all([
    prisma.division.count(),
    prisma.district.count(),
    prisma.indicator.count(),
    prisma.indicatorValue.count(),
  ]);
  console.log(
    `Seeded ${divCount} divisions, ${distCount} districts, ${indCount} indicators, ${valCount} values`,
  );
  if (divCount !== 8 || distCount !== 64 || indCount < 2 || valCount < 18)
    throw new Error("Seed count mismatch");
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
