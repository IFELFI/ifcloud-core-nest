import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppModule } from 'src/app.module';
import { PrismaService } from 'src/services/prisma.service';
import {
  postgresClient,
  prismaService,
  testUserToken,
  testUserTokenPayload,
} from './setup-e2e';
import { v4 as uuidv4 } from 'uuid';
import request from 'supertest';
import fs from 'fs';

describe('File', () => {
  let app: INestApplication;
  let testUserId: number;
  const testFolderKey = uuidv4();
  const chunkSize = 1024 * 1024 * 2;

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

  // Create User and Folder for testing
  beforeEach(async () => {
    // Create User
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

    // Create Folder
    await postgresClient.query(
      `INSERT INTO "cloud"."folders" (id, folder_name, folder_key) VALUES (${BigInt(1234)}, 'test', '${testFolderKey}')`,
    );
    await postgresClient.query(
      `INSERT INTO "cloud"."user_role" (user_id, folder_id, role) VALUES (${testUserId}, '${BigInt(1234)}', '{create,read,update,delete}')`,
    );
    await postgresClient.query(
      `INSERT INTO "cloud".folder_info (folder_id, owner_id) VALUES (${BigInt(1234)}, ${testUserId})`,
    );
  });

  /**
   * Success handling
   */

  // Create file success handling
  it('should create a file', async () => {
    const file = fs.readFileSync(`${__dirname}/sample/sample-image1.jpg`);
    const response = await uploadFile(
      file,
      'sample-image1.jpg',
      testFolderKey,
      testUserToken,
    );
    expect(response.body.message).toBe('File uploaded');
    expect(response.status).toBe(201);
  });

  const uploadChunk = async (
    chunk: Buffer,
    chunkNumber: number,
    totalChunks: number,
    fileName: string,
    folderKey: string,
    userToken: string,
  ) => {
    const response = await request(app.getHttpServer())
      .post(`/file/upload/${folderKey}`)
      .set('Authorization', `Bearer ${userToken}`)
      .attach('file', chunk, { filename: fileName })
      .field(
        'data',
        JSON.stringify({
          data: {
            chunkNumber,
            totalChunks,
            fileName,
          },
        }),
      );
    return response;
  };

  const uploadFile = async (
    file: Buffer,
    fileName: string,
    folderKey: string,
    userToken: string,
  ) => {
    const totalChunks = Math.ceil(file.length / chunkSize);
    for (let i = 0; i < totalChunks; i++) {
      const start = i * chunkSize;
      const end = (i + 1) * chunkSize;
      const chunk = file.subarray(start, end);
      const response = await uploadChunk(
        chunk,
        i,
        totalChunks,
        fileName,
        folderKey,
        userToken,
      );
      if (response.status === 200) continue;
      else return { status: response.status, body: response.body };
    }
    return { status: 500, body: { message: 'Failed to upload file' } };
  };
});
