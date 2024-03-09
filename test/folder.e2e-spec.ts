import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppModule } from 'src/app.module';
import { PrismaService } from 'src/services/prisma.service';
import {
  expiredUserToken,
  postgresClient,
  prismaService,
  testUserToken,
  testUserTokenPayload,
  wrongUserToken,
} from './setup-e2e';
import request from 'supertest';
import { v4 as uuidv4 } from 'uuid';
import { ICreateFolderRequestBodyData } from 'src/interfaces/folder.interface';

const createTestFolder = async (userId: number) => {
  const testFolderKey = uuidv4();
  await postgresClient.query(
    `INSERT INTO "cloud"."folders" (id, folder_key, folder_name, parent_folder_id) VALUES (1, '${testFolderKey}', 'test_folder', null)`,
  );
  await postgresClient.query(
    `INSERT INTO "cloud"."folder_info" (folder_id, owner_id) VALUES (1, ${userId})`,
  );
  await postgresClient.query(
    `INSERT INTO "cloud"."user_role" (user_id, folder_id, role) VALUES (${userId}, 1, '{create,update,delete}')`,
  );
  return testFolderKey;
};

describe('Folder', () => {
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

  // Create a User before each test
  beforeEach(async () => {
    const payload = testUserTokenPayload;
    await postgresClient.query(
      `INSERT INTO "member"."users" (uuid_key) VALUES ('${payload.uuidKey}')`,
    );
  });

  /**
   * Success handling
   */

  // Create folder success handling
  it('should create a folder', async () => {
    const response = await request(app.getHttpServer())
      .post('/folder/create')
      .set('Authorization', `Bearer ${testUserToken}`)
      .send({ data: { folderName: 'test_folder' } });

    expect(response.status).toBe(201);
    expect(response.text).toBe('Folder created');
  });

  // Delete a folder success handling
  it('should delete a folder', async () => {
    const payload = testUserTokenPayload;
    const result = await postgresClient.query(
      `SELECT id FROM "member"."users" WHERE uuid_key = '${payload.uuidKey}'`,
    );
    if (result.rowCount !== 1) {
      throw new Error('User does not exist');
    }
    const testFolderKey = await createTestFolder(result.rows[0].id);
    const response = await request(app.getHttpServer())
      .delete(`/folder/${testFolderKey}`)
      .set('Authorization', `Bearer ${testUserToken}`)
      .send({});

    expect(response.status).toBe(200);
    expect(response.text).toBe('Folder deleted');
  });

  /**
   * Error handling
   */

  // Create folder error handling
  it('should not create a folder if Authorization header is not given', async () => {
    const response = await request(app.getHttpServer())
      .post('/folder/create')
      .send({ data: { folderName: 'test_folder' } });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe('Authorization header is missing');
  });

  it('should not create a folder if Token is expired', async () => {
    const response = await request(app.getHttpServer())
      .post('/folder/create')
      .set('Authorization', `Bearer ${expiredUserToken}`)
      .send({ data: { folderName: 'test_folder' } });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe('Invalid token');
  });

  it('should not create a folder if User does not exist', async () => {
    const response = await request(app.getHttpServer())
      .post('/folder/create')
      .set('Authorization', `Bearer ${wrongUserToken}`)
      .send({ data: { folderName: 'test_folder' } });

    expect(response.status).toBe(404);
    expect(response.body.message).toBe('User does not exist');
  });

  it('should not create a folder if folderName is not given', async () => {
    const response = await request(app.getHttpServer())
      .post('/folder/create')
      .set('Authorization', `Bearer ${testUserToken}`)
      .send({ data: {} });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe(
      'Validation failed for $input.data.folderName',
    );
  });

  it('should not create a folder if folderName is empty', async () => {
    const response = await request(app.getHttpServer())
      .post('/folder/create')
      .set('Authorization', `Bearer ${testUserToken}`)
      .send({ data: { folderName: '' } });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe(
      'Validation failed for $input.data.folderName',
    );
  });

  it('should not create a folder if folderName is too long', async () => {
    const response = await request(app.getHttpServer())
      .post('/folder/create')
      .set('Authorization', `Bearer ${testUserToken}`)
      .send({ data: { folderName: 'a'.repeat(256) } });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe(
      'Validation failed for $input.data.folderName',
    );
  });

  it('should not create a folder if folderName is not unique', async () => {
    const baseFolderKey = uuidv4();
    const baseFolderId = BigInt(123);
    const test =
      'INSERT INTO "cloud"."folders" (id, folder_key, folder_name, parent_folder_id) VALUES ($1, $2, $3, $4) RETURNING id';
    const values = [baseFolderId, baseFolderKey, 'base_folder', null];
    const result = await postgresClient.query(test, values);

    if (result.rowCount !== 1) {
      throw new Error('Failed to create a base folder');
    }

    const createFolderRequestBodyData: ICreateFolderRequestBodyData = {
      folderName: 'test_folder',
      parentFolderKey: baseFolderKey,
    };

    // Create a folder first
    await request(app.getHttpServer())
      .post('/folder/create')
      .set('Authorization', `Bearer ${testUserToken}`)
      .send({
        data: createFolderRequestBodyData,
      });

    // Try to create the same folder again
    const response = await request(app.getHttpServer())
      .post('/folder/create')
      .set('Authorization', `Bearer ${testUserToken}`)
      .send({
        data: createFolderRequestBodyData,
      });

    expect(response.status).toBe(409);
    expect(response.body.message).toBe('Folder already exists');
  });
});
