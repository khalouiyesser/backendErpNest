import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { AppModule } from './app.module';

async function bootstrap() {
    const app = await NestFactory.create<NestFastifyApplication>(
        AppModule,
        new FastifyAdapter({ logger: false }),
    );

    // ✅ CORS via @fastify/cors (pas enableCors — incompatible avec Fastify)
    await app.register(require('@fastify/cors'), {
        origin: true, // autorise toutes les origines (dev uniquement)
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

    // ✅ Cast as any pour éviter le conflit de types Swagger + Fastify
    const document = SwaggerModule.createDocument(app as any, config);
    SwaggerModule.setup('api/docs', app as any, document);

    const port = process.env.PORT || 3001;
    await app.listen(port, '0.0.0.0');
    console.log(`🚀 Server running on http://0.0.0.0:${port}`);
}

bootstrap();