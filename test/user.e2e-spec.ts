import request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppModule } from 'src/app.module';
import { postgresClient, prismaService, setupData } from './setup-e2e';
import { PrismaService } from 'src/services/prisma.service';

describe('User', () => {
  let app: INestApplication;
  let data: Awaited<ReturnType<typeof setupData>>;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(prismaService)
      .compile();

    app = module.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('[GET] /user', () => {
    beforeEach(async () => {
      data = await setupData(postgresClient, true);
    });

    it('should get a user', async () => {
      const response = await request(app.getHttpServer())
        .get('/user')
        .set('Authorization', `Bearer ${data.accessToken.normal}`)
        .send({});

      expect(response.status).toBe(200);
      expect(response.text).toBe('User found');
    });
    it('should not get a user if Authorization header is not given', async () => {
      const response = await request(app.getHttpServer()).get('/user').send({});

      expect(response.status).toBe(401);
      expect(response.body.message).toBe('Authorization header is missing');
    });
    it('should not get a user if Token is expired', async () => {
      const response = await request(app.getHttpServer())
        .get('/user')
        .set('Authorization', `Bearer ${data.accessToken.expired}`)
        .send({});

      expect(response.status).toBe(401);
      expect(response.body.message).toBe('Invalid token');
    });
    it('should not get a user if Token payload is wrong', async () => {
      const response = await request(app.getHttpServer())
        .get('/user')
        .set('Authorization', `Bearer ${data.accessToken.wrongPayload}`)
        .send({});

      expect(response.status).toBe(401);
      expect(response.body.message).toBe('Invalid token');
    });
    it('should not get a user if Token secret is wrong', async () => {
      const response = await request(app.getHttpServer())
        .get('/user')
        .set('Authorization', `Bearer ${data.accessToken.wrongSecret}`)
        .send({});

      expect(response.status).toBe(401);
      expect(response.body.message).toBe('Invalid token');
    });
    it('should not get a user if user does not exist', async () => {
      data = await setupData(postgresClient, false);
      const response = await request(app.getHttpServer())
        .get('/user')
        .set('Authorization', `Bearer ${data.accessToken.normal}`)
        .send({});

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('User does not exist');
    });
  });

  describe('[POST] /user/enroll', () => {
    it('should create a user', async () => {
      data = await setupData(postgresClient, false);
      const response = await request(app.getHttpServer())
        .get('/user/enroll')
        .set('Authorization', `Bearer ${data.accessToken.normal}`)
        .send({});

      expect(response.status).toBe(201);
      expect(response.text).toBe('User created');
    });
    it('should not create a user if Authorization header is not given', async () => {
      data = await setupData(postgresClient, false);
      const response = await request(app.getHttpServer())
        .get('/user/enroll')
        .send({});

      expect(response.status).toBe(401);
      expect(response.body.message).toBe('Authorization header is missing');
    });
    it('should not create a user if Token is expired', async () => {
      data = await setupData(postgresClient, false);
      const response = await request(app.getHttpServer())
        .get('/user/enroll')
        .set('Authorization', `Bearer ${data.accessToken.expired}`)
        .send({});

      expect(response.status).toBe(401);
      expect(response.body.message).toBe('Invalid token');
    });
    it('should not create a user if Token payload is wrong', async () => {
      data = await setupData(postgresClient, false);
      const response = await request(app.getHttpServer())
        .get('/user/enroll')
        .set('Authorization', `Bearer ${data.accessToken.wrongPayload}`)
        .send({});

      expect(response.status).toBe(401);
      expect(response.body.message).toBe('Invalid token');
    });
    it('should not create a user if Token secret is wrong', async () => {
      data = await setupData(postgresClient, false);
      const response = await request(app.getHttpServer())
        .get('/user/enroll')
        .set('Authorization', `Bearer ${data.accessToken.wrongSecret}`)
        .send({});

      expect(response.status).toBe(401);
      expect(response.body.message).toBe('Invalid token');
    });
    it('should not create a user if user already exists', async () => {
      data = await setupData(postgresClient, true);
      const response = await request(app.getHttpServer())
        .get('/user/enroll')
        .set('Authorization', `Bearer ${data.accessToken.normal}`)
        .send({});

      expect(response.status).toBe(409);
      expect(response.body.message).toBe('User already exists');
    });
  });

  describe('[DELETE] /user', () => {
    beforeEach(async () => {
      data = await setupData(postgresClient, true);
    });

    it('should delete a user', async () => {
      const response = await request(app.getHttpServer())
        .delete('/user')
        .set('Authorization', `Bearer ${data.accessToken.normal}`)
        .send({});

      expect(response.status).toBe(200);
      expect(response.text).toBe('User deleted');
    });
    it('should not delete a user if Authorization header is not given', async () => {
      const response = await request(app.getHttpServer())
        .delete('/user')
        .send({});

      expect(response.status).toBe(401);
      expect(response.body.message).toBe('Authorization header is missing');
    });
    it('should not delete a user if Token is expired', async () => {
      const response = await request(app.getHttpServer())
        .delete('/user')
        .set('Authorization', `Bearer ${data.accessToken.expired}`)
        .send({});

      expect(response.status).toBe(401);
      expect(response.body.message).toBe('Invalid token');
    });
    it('should not delete a user if Token payload is wrong', async () => {
      const response = await request(app.getHttpServer())
        .delete('/user')
        .set('Authorization', `Bearer ${data.accessToken.wrongPayload}`)
        .send({});

      expect(response.status).toBe(401);
      expect(response.body.message).toBe('Invalid token');
    });
    it('should not delete a user if Token secret is wrong', async () => {
      const response = await request(app.getHttpServer())
        .delete('/user')
        .set('Authorization', `Bearer ${data.accessToken.wrongSecret}`)
        .send({});

      expect(response.status).toBe(401);
      expect(response.body.message).toBe('Invalid token');
    });
    it('should not delete a user if user does not exist', async () => {
      data = await setupData(postgresClient, false);
      const response = await request(app.getHttpServer())
        .delete('/user')
        .set('Authorization', `Bearer ${data.accessToken.normal}`)
        .send({});

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('User does not exist');
    });
  });
});
