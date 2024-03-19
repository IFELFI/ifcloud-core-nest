import request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppModule } from 'src/app.module';
import {
  expiredUserToken,
  postgresClient,
  prismaService,
  testUserToken,
  testUserTokenPayload,
} from './setup-e2e';
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

  // Create user success handling
  it('should create a user', async () => {
    const response = await request(app.getHttpServer())
      .post('/user/enroll')
      .set('Authorization', `Bearer ${testUserToken}`)
      .send({});

    expect(response.status).toBe(201);
    expect(response.text).toBe('User created');
  });

  // Delete user success handling
  it('should delete a user', async () => {
    await createUser();
    const response = await request(app.getHttpServer())
      .delete('/user')
      .set('Authorization', `Bearer ${testUserToken}`)
      .send({});

    expect(response.status).toBe(200);
    expect(response.text).toBe('User deleted');
  });

  /**
   * Error handling
   */

  // Create user failure handling
  it('should not create a user if Authorization header is not given', async () => {
    const response = await request(app.getHttpServer())
      .post('/user/enroll')
      .send({});

    expect(response.status).toBe(401);
    expect(response.body.message).toBe('Authorization header is missing');
  });

  it('should not create a user if Token is expired', async () => {
    const response = await request(app.getHttpServer())
      .post('/user/enroll')
      .set('Authorization', `Bearer ${expiredUserToken}`)
      .send({});

    expect(response.status).toBe(401);
    expect(response.body.message).toBe('Invalid token');
  });

  // Delete user failure handling
  it('should not delete a user if Authorization header is not given', async () => {
    await createUser();
    const response = await request(app.getHttpServer())
      .delete('/user')
      .send({});

    expect(response.status).toBe(401);
    expect(response.body.message).toBe('Authorization header is missing');
  });

  it('should not delete a user if Token is expired', async () => {
    await createUser();
    const response = await request(app.getHttpServer())
      .delete('/user')
      .set('Authorization', `Bearer ${expiredUserToken}`)
      .send({});

    expect(response.status).toBe(401);
    expect(response.body.message).toBe('Invalid token');
  });

  it('should not delete a user if user does not exist', async () => {
    const response = await request(app.getHttpServer())
      .delete('/user')
      .set('Authorization', `Bearer ${testUserToken}`)
      .send({});

    expect(response.status).toBe(404);
    expect(response.body.message).toBe('User does not exist');
  });

  /**
   * Functions for testing
   */
  const createUser = async () => {
    const payload = testUserTokenPayload;
    await postgresClient.query(
      `INSERT INTO "member"."users" (uuid_key) VALUES ('${payload.uuidKey}')`,
    );
    const testUser = await postgresClient.query(
      `SELECT id FROM "member"."users" WHERE uuid_key = '${testUserTokenPayload.uuidKey}'`,
    );
    if (testUser.rowCount !== 1) {
      throw new Error('User does not exist');
    }
    const testUserId = testUser.rows[0].id;
    return testUserId;
  };
});
