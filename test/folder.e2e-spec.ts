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
  wrongUserTokenPayload,
} from './setup-e2e';
import request from 'supertest';
import { v4 as uuidv4 } from 'uuid';
import { ICreateFolderRequestBodyData } from 'src/interfaces/folder.interface';

const createTestFolder = async (userId: number) => {
  return createFolder(BigInt(1234), userId, 'test_folder', null);
};

const createFolder = async (
  folderId: bigint,
  userId: number,
  folderName: string,
  parentFolderId: bigint | null,
) => {
  const folderKey = uuidv4();
  await postgresClient.query(
    `INSERT INTO "cloud"."folders" (id, folder_key, folder_name, parent_folder_id) VALUES (${folderId}, '${folderKey}', '${folderName}', ${parentFolderId})`,
  );
  await postgresClient.query(
    `INSERT INTO "cloud"."folder_info" (folder_id, owner_id) VALUES (${folderId}, ${userId})`,
  );
  await postgresClient.query(
    `INSERT INTO "cloud"."user_role" (user_id, folder_id, role) VALUES (${userId}, ${folderId}, '{create,update,delete,read}')`,
  );
  return folderKey;
};

const createFile = async (
  userId: number,
  fileId: bigint,
  parentFolderId: bigint,
  folderName: string,
  enabled: boolean = true,
  byteSize: number = 100,
) => {
  const fileKey = uuidv4();
  await postgresClient.query(
    `INSERT INTO "cloud"."files" (id, parent_folder_id, file_name, enabled, file_key) VALUES (${fileId}, ${parentFolderId}, '${folderName}', ${enabled}, '${fileKey}')`,
  );
  await postgresClient.query(
    `INSERT INTO "cloud"."file_info" (file_id, uploader_id, byte_size) VALUES (${fileId}, ${userId}, ${byteSize})`,
  );
  return fileKey;
};

describe('Folder', () => {
  let app: INestApplication;
  let testUserId: number;

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
    const testUser = await postgresClient.query(
      `SELECT id FROM "member"."users" WHERE uuid_key = '${testUserTokenPayload.uuidKey}'`,
    );
    if (testUser.rowCount !== 1) {
      throw new Error('User does not exist');
    }
    testUserId = testUser.rows[0].id;
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

  // Read a folder success handling
  it('should read a folder', async () => {
    const baseFolderKey = await createTestFolder(testUserId);
    await createFolder(BigInt(1), testUserId, 'dummy1', BigInt(1234));
    await createFolder(BigInt(2), testUserId, 'dummy2', BigInt(1234));
    await createFile(testUserId, BigInt(1), BigInt(1234), 'dummy1');
    const response = await request(app.getHttpServer())
      .get(`/folder/${baseFolderKey}`)
      .set('Authorization', `Bearer ${testUserToken}`)
      .send({});

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('files');
    expect(response.body).toHaveProperty('folders');
    expect(response.body.folders.length).toBe(2);
    expect(response.body.files.length).toBe(1);
  });

  // Delete a folder success handling
  it('should delete a folder', async () => {
    const testFolderKey = await createTestFolder(testUserId);
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

  // Read a folder error handling
  it('should not read a folder if Authorization header is not given', async () => {
    const response = await request(app.getHttpServer())
      .get('/folder/1234')
      .send({});

    expect(response.status).toBe(400);
    expect(response.body.message).toBe('Authorization header is missing');
  });

  it('should not read a folder if Token is expired', async () => {
    const response = await request(app.getHttpServer())
      .get('/folder/1234')
      .set('Authorization', `Bearer ${expiredUserToken}`)
      .send({});

    expect(response.status).toBe(400);
    expect(response.body.message).toBe('Invalid token');
  });

  it('should not read a folder if User does not exist', async () => {
    const response = await request(app.getHttpServer())
      .get('/folder/1234')
      .set('Authorization', `Bearer ${wrongUserToken}`)
      .send({});

    expect(response.status).toBe(404);
    expect(response.body.message).toBe('User does not exist');
  });

  it('should not read a folder if folderKey is wrong', async () => {
    const response = await request(app.getHttpServer())
      .get(`/folder/${uuidv4()}`)
      .set('Authorization', `Bearer ${testUserToken}`)
      .send({});

    expect(response.status).toBe(404);
    expect(response.body.message).toBe('Folder does not exist');
  });

  it('should not read a folder if user does not have access to the folder', async () => {
    const baseFolderKey = await createTestFolder(testUserId);
    await createFolder(BigInt(1), testUserId, 'dummy1', BigInt(1234));
    await createFolder(BigInt(2), testUserId, 'dummy2', BigInt(1234));
    await createFile(testUserId, BigInt(1), BigInt(1234), 'dummy1');

    // Create a user with no access to the folder
    const payload = wrongUserTokenPayload;
    postgresClient.query(
      `INSERT INTO "member"."users" (uuid_key) VALUES ('${payload.uuidKey}')`,
    );
    const response = await request(app.getHttpServer())
      .get(`/folder/${baseFolderKey}`)
      .set('Authorization', `Bearer ${wrongUserToken}`)
      .send({});

    expect(response.status).toBe(403);
    expect(response.body.message).toBe(
      'User does not have access to the folder',
    );
  });
});
