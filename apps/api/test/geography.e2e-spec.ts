import type { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import * as request from "supertest";
import { AppModule } from "../src/app.module";
import { configureApp } from "../src/app.setup";

// Runs against the seeded docker-compose Postgres (docker compose up -d && migrate && seed).
describe("API (e2e)", () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = configureApp(moduleRef.createNestApplication());
    await app.init();
  });

  afterAll(() => app.close());

  const http = () => request(app.getHttpServer());

  describe("geography", () => {
    it("GET /v1/health/ready → DB reachable", () =>
      http().get("/v1/health/ready").expect(200).expect({ status: "ready" }));

    it("GET /v1/geography/divisions → 8 divisions, districts nested", async () => {
      const res = await http().get("/v1/geography/divisions").expect(200);
      expect(res.body).toHaveLength(8);
      expect(res.body.flatMap((d: { districts: unknown[] }) => d.districts)).toHaveLength(64);
    });

    it("GET /v1/geography/divisions/bd-c → Dhaka, case-insensitive", async () => {
      const res = await http().get("/v1/geography/divisions/bd-c").expect(200);
      expect(res.body.name).toBe("Dhaka");
      expect(res.body.districts).toHaveLength(13);
    });

    it("GET /v1/geography/divisions/BD-Z → 404", () =>
      http().get("/v1/geography/divisions/BD-Z").expect(404));

    it("GET /v1/geography/districts → 64 flat", async () => {
      const res = await http().get("/v1/geography/districts").expect(200);
      expect(res.body).toHaveLength(64);
    });
  });

  describe("indicators", () => {
    it("GET /v1/statistics → seeded indicators", async () => {
      const res = await http().get("/v1/statistics").expect(200);
      const ids = res.body.map((i: { id: string }) => i.id);
      expect(ids).toEqual(expect.arrayContaining(["gdp-growth", "population"]));
    });

    it("GET /v1/statistics?sector=economy → filtered", async () => {
      const res = await http().get("/v1/statistics?sector=economy").expect(200);
      expect(res.body.every((i: { sector: string }) => i.sector === "economy")).toBe(true);
    });

    it("GET /v1/statistics/gdp-growth/values?from=2020 → bounded series", async () => {
      const res = await http().get("/v1/statistics/gdp-growth/values?from=2020").expect(200);
      expect(res.body.length).toBeGreaterThanOrEqual(5);
      expect(res.body.every((v: { year: number }) => v.year >= 2020)).toBe(true);
    });

    it("GET /v1/economy → same rows as statistics?sector=economy", async () => {
      const res = await http().get("/v1/economy").expect(200);
      expect(res.body.map((i: { id: string }) => i.id)).toEqual(
        expect.arrayContaining(["gdp-growth", "population"]),
      );
    });

    it("GET /v1/statistics?limit=999 → 400 (validation cap)", () =>
      http().get("/v1/statistics?limit=999").expect(400));

    it("GET /v1/statistics/nope/values → 404", () =>
      http().get("/v1/statistics/nope/values").expect(404));
  });
});
