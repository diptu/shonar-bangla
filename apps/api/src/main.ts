import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { AppModule } from "./app.module";
import { configureApp } from "./app.setup";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  configureApp(app);
  app.enableCors({ origin: ["http://localhost:3000"] });
  app.enableShutdownHooks();

  const config = new DocumentBuilder()
    .setTitle("Shonar Bangla API")
    .setDescription("Geography and indicator data for the dashboard")
    .setVersion("0.1")
    .build();
  SwaggerModule.setup("docs", app, SwaggerModule.createDocument(app, config));

  await app.listen(process.env.PORT ?? 3001);
}
void bootstrap();
