import request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppModule } from 'src/app.module';
import { prismaService, setUsers } from './setup-e2e';
import { PrismaService } from 'src/services/prisma.service';
import { v4 as uuidV4 } from 'uuid';

describe('User', () => {
  let app: INestApplication;
  let data: Awaited<ReturnType<typeof setUsers>>;

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
      data = await setUsers();
    });

    it('should get a user', async () => {
      const response = await request(app.getHttpServer())
        .get('/user')
        .set('x-gateway-secret', process.env.GATEWAY_SECRET as string)
        .set('x-uuid-key', data.user.uuid_key)
        .send({});

      expect(response.status).toBe(200);
      expect(response.text).toBe('User found');
    });
    it('should not get a user if user does not exist', async () => {
      const response = await request(app.getHttpServer())
        .get('/user')
        .set('x-gateway-secret', process.env.GATEWAY_SECRET as string)
        .set('x-uuid-key', uuidV4())
        .send({});

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('User does not exist');
    });
  });

  describe('[POST] /user/enroll', () => {
    it('should create a user', async () => {
      const response = await request(app.getHttpServer())
        .get('/user/enroll')
        .set('x-gateway-secret', process.env.GATEWAY_SECRET as string)
        .set('x-uuid-key', uuidV4())
        .send({});

      expect(response.status).toBe(201);
      expect(response.text).toBe('User created');
    });
    it('should not create a user if user already exists', async () => {
      data = await setUsers();
      const response = await request(app.getHttpServer())
        .get('/user/enroll')
        .set('x-gateway-secret', process.env.GATEWAY_SECRET as string)
        .set('x-uuid-key', data.user.uuid_key)
        .send({});

      expect(response.status).toBe(409);
      expect(response.body.message).toBe('User already exists');
    });
  });

  describe('[DELETE] /user', () => {
    it('should delete a user', async () => {
      data = await setUsers();
      const response = await request(app.getHttpServer())
        .delete('/user')
        .set('x-gateway-secret', process.env.GATEWAY_SECRET as string)
        .set('x-uuid-key', data.user.uuid_key)
        .send({});

      expect(response.status).toBe(200);
      expect(response.text).toBe('User deleted');
    });
    it('should not delete a user if user does not exist', async () => {
      const response = await request(app.getHttpServer())
        .delete('/user')
        .set('x-gateway-secret', process.env.GATEWAY_SECRET as string)
        .set('x-uuid-key', uuidV4())
        .send({});

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('User does not exist');
    });
  });
});
