import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { pinoHttp } from 'pino-http';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';
import { ResponseTransformInterceptor } from './common/interceptors/response.interceptor';
import { REQUEST_ID_HEADER, requestIdMiddleware } from './common/request-id.middleware';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  const config = app.get(ConfigService);

  app.use(requestIdMiddleware);

  app.use(
    pinoHttp({
      level: config.get<string>('logLevel') ?? 'info',
      genReqId: (req) => (req as { headers: Record<string, string> }).headers[REQUEST_ID_HEADER] as string,
    }),
  );

  app.use(helmet());
  app.enableCors({
    origin: config.get<string[]>('corsOrigins') ?? [],
    credentials: true,
  });

  app.setGlobalPrefix('v1');

  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalInterceptors(new ResponseTransformInterceptor());

  // Swagger / OpenAPI
  const swaggerConfig = new DocumentBuilder()
    .setTitle('PescaBA API')
    .setDescription('API REST de lugares de pesca — MVP Provincia de Buenos Aires (Argentina)')
    .setVersion('0.1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, document, { useGlobalPrefix: true });

  const port = config.get<number>('port') ?? 3000;
  const host = config.get<string>('host') ?? '0.0.0.0';

  await app.listen(port, host);
  Logger.log(`API PescaBA escuchando en http://${host}:${port}/v1`, 'Bootstrap');
  Logger.log(`Swagger disponible en http://${host}:${port}/v1/docs`, 'Bootstrap');
}

void bootstrap();
