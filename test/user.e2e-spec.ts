import request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppModule } from 'src/app.module';
import { expiredUserToken, prismaService, testUserToken } from './setup-e2e';
import { PrismaService } from 'src/services/prisma.service';

describe('User', () => {
  let app: INestApplication;

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

  /**
   * Success handling
   */
  it('should create a user', async () => {
    const response = await request(app.getHttpServer())
      .post('/user/enroll')
      .set('Authorization', `Bearer ${testUserToken}`)
      .send({});

    expect(response.status).toBe(201);
    expect(response.text).toBe('User created');
  });

  /**
   * Error handling
   */
  it('should not create a user if Authorization header is not given', async () => {
    const response = await request(app.getHttpServer())
      .post('/user/enroll')
      .send({});

    expect(response.status).toBe(400);
    expect(response.body.message).toBe('Authorization header is missing');
  });

  it('should not create a user if Token is expired', async () => {
    const response = await request(app.getHttpServer())
      .post('/user/enroll')
      .set('Authorization', `Bearer ${expiredUserToken}`)
      .send({});

    expect(response.status).toBe(400);
    expect(response.body.message).toBe('Invalid token');
  });
});
