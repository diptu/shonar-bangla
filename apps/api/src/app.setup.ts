import { ValidationPipe, type INestApplication } from "@nestjs/common";

/** Shared between main.ts and the e2e tests so both run the same app shape. */
export function configureApp(app: INestApplication) {
  app.setGlobalPrefix("v1");
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
  );
  return app;
}
