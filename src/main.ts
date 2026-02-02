import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Prefixo global da API
  app.setGlobalPrefix('api/v1');

  // Validação global
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // CORS
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3001',
    credentials: true,
  });

  // Swagger
  const config = new DocumentBuilder()
    .setTitle('Felix OS API')
    .setDescription('API do Sistema de Gestão para Oficinas Mecânicas')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('auth', 'Autenticação')
    .addTag('tenants', 'Gestão de Oficinas')
    .addTag('users', 'Usuários')
    .addTag('customers', 'Clientes')
    .addTag('vehicles', 'Veículos')
    .addTag('service-orders', 'Ordens de Serviço')
    .addTag('diagnostics', 'Diagnósticos por Voz')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3000;
  await app.listen(port);

  console.log(`
  ╔═══════════════════════════════════════════════════════════╗
  ║                                                           ║
  ║   🔧 FELIX OS - Sistema para Oficinas Mecânicas          ║
  ║                                                           ║
  ║   API rodando em: http://localhost:${port}                   ║
  ║   Swagger docs:   http://localhost:${port}/api/docs          ║
  ║                                                           ║
  ╚═══════════════════════════════════════════════════════════╝
  `);
}

bootstrap();
