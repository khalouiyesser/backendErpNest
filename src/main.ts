import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // CORS - autorise localhost ET l'IP réseau
  app.enableCors({
    origin: [
      'http://localhost:3000',
      'http://192.168.1.176:3000',
    ],
    credentials: true,
  });

  app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
  );

  const config = new DocumentBuilder()
      .setTitle('ERP System API')
      .setDescription('API documentation for ERP System MVP')
      .setVersion('1.0')
      .addBearerAuth()
      .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3001;
  await app.listen(port, '0.0.0.0'); // 👈 écoute sur toutes les interfaces réseau
  console.log(`🚀 ERP Backend running on: http://localhost:${port}`);
  console.log(`🌐 Network access: http://192.168.1.176:${port}`);
  console.log(`📚 Swagger docs: http://localhost:${port}/api/docs`);
}
bootstrap();