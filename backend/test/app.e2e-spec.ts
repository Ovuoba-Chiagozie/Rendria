import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/ (GET) reports the API identity', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect(({ body }) => {
        expect(body).toMatchObject({
          message: 'Rendria API is running',
          version: '1.0.0',
        });
      });
  });

  it('requires a session for app routes', async () => {
    await request(app.getHttpServer())
      .get('/app/templates')
      .expect(401)
      .expect(({ body }: { body: { message: string } }) =>
        expect(body.message).toBe('Not authorized'),
      );
    await request(app.getHttpServer()).get('/app/renders').expect(401);
  });

  it('requires an API key for the public render API', async () => {
    await request(app.getHttpServer())
      .post('/v1/render')
      .send({ templateId: 'example' })
      .expect(401)
      .expect(({ body }: { body: { message: string } }) =>
        expect(body.message).toBe('API key missing'),
      );
  });

  it('rejects invalid signup input before database access', async () => {
    await request(app.getHttpServer())
      .post('/app/auth/signup')
      .send({ email: 'invalid', password: 'weak' })
      .expect(400);
  });

  afterEach(async () => {
    await app.close();
  });
});
