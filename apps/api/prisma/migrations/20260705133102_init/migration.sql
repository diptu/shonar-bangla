-- CreateTable
CREATE TABLE "Division" (
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Division_pkey" PRIMARY KEY ("code")
);

-- CreateTable
CREATE TABLE "District" (
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "divisionCode" TEXT NOT NULL,

    CONSTRAINT "District_pkey" PRIMARY KEY ("code")
);

-- CreateTable
CREATE TABLE "Indicator" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sector" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "geoLevel" TEXT NOT NULL,

    CONSTRAINT "Indicator_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IndicatorValue" (
    "id" SERIAL NOT NULL,
    "indicatorId" TEXT NOT NULL,
    "geoCode" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "IndicatorValue_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "IndicatorValue_indicatorId_geoCode_year_key" ON "IndicatorValue"("indicatorId", "geoCode", "year");

-- AddForeignKey
ALTER TABLE "District" ADD CONSTRAINT "District_divisionCode_fkey" FOREIGN KEY ("divisionCode") REFERENCES "Division"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IndicatorValue" ADD CONSTRAINT "IndicatorValue_indicatorId_fkey" FOREIGN KEY ("indicatorId") REFERENCES "Indicator"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
