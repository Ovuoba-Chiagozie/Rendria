import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import cookieParser from 'cookie-parser';
import { json, raw, Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import { assertRuntimeConfig, env } from './config';
import { AppModule } from './app.module';

async function bootstrap() {
  assertRuntimeConfig();
  const app = await NestFactory.create(AppModule, { bodyParser: false });
  app.use(
    '/app/webhooks/lemon',
    raw({ type: '*/*', limit: '2mb' }),
    (
      req: Request & { rawBody?: Buffer },
      _res: Response,
      next: NextFunction,
    ) => {
      req.rawBody = req.body as Buffer;
      next();
    },
  );
  app.use(json({ limit: '8mb' }));
  app.use(cookieParser());
  app.use(
    '/app/auth',
    rateLimit({
      windowMs: 15 * 60_000,
      limit: 10,
      standardHeaders: true,
      legacyHeaders: false,
      message: {
        message: 'Too many requests from this IP, please try again later.',
      },
    }),
  );
  app.use((req: Request, res: Response, next: NextFunction) => {
    const origin = req.headers.origin;
    if (req.path.startsWith('/v1/')) {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
      res.setHeader(
        'Access-Control-Allow-Headers',
        'Authorization,Content-Type,X-API-Key',
      );
      if (req.method === 'OPTIONS') return res.status(204).end();
      return next();
    }
    if (!origin || env.corsOrigins.includes(origin)) {
      if (origin) {
        res.setHeader('Access-Control-Allow-Origin', origin);
        res.setHeader('Vary', 'Origin');
        res.setHeader('Access-Control-Allow-Credentials', 'true');
        res.setHeader(
          'Access-Control-Allow-Methods',
          'GET,POST,PUT,DELETE,OPTIONS',
        );
        res.setHeader(
          'Access-Control-Allow-Headers',
          'Authorization,Content-Type',
        );
      }
      if (req.method === 'OPTIONS') return res.status(204).end();
      return next();
    }
    return res.status(403).json({ message: 'Not allowed by CORS' });
  });
  await app.listen(env.port, '0.0.0.0');
  Logger.log(`Rendria API listening on ${env.port}`);
}
void bootstrap();
