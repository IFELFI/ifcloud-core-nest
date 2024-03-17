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
import path from 'path';

describe('File', () => {
  let app: INestApplication;
  let testUserId: number;
  const testFolderKey = uuidv4();
  const chunkSize = 1024 * 1024 * 2;
  const baseDir = process.env.FILE_UPLOAD_DIR || 'uploads';

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

  afterAll(async () => {
    const deleteFolderRecursive = (path: string) => {
      if (fs.existsSync(path)) {
        fs.readdirSync(path).forEach((file) => {
          const curPath = `${path}/${file}`;
          if (fs.lstatSync(curPath).isDirectory()) {
            deleteFolderRecursive(curPath);
          } else {
            fs.unlinkSync(curPath);
          }
        });
        fs.rmdirSync(path);
      }
    };
    deleteFolderRecursive(baseDir);
  });

  /**
   * Success handling
   */

  // Create file success handling
  it('should upload a file', async () => {
    const file = await fs.promises.readFile(
      `${__dirname}/sample/sample-image1.jpg`,
    );
    const response = await uploadFile(
      file,
      'sample-image1.jpg',
      testFolderKey,
      'Bearer ' + testUserToken,
    );
    expect(response.status).toBe(201);
    expect(response.body.message).toBe('File uploaded');
    expect(
      fs.existsSync(path.join(baseDir, response.body.fileKey, `origin.jpg`)),
    ).toBe(true);
  });

  it('should upload a video file and create different resolutions', async () => {
    const file = await fs.promises.readFile(
      `${__dirname}/sample/sample-video1.mp4`,
    );
    const response = await uploadFile(
      file,
      'sample-video1.mp4',
      testFolderKey,
      'Bearer ' + testUserToken,
    );
    expect(response.status).toBe(201);
    expect(response.body.message).toBe('File uploaded');
    expect(response.body.fileKey).toBeDefined();
    expect(
      fs.existsSync(path.join(baseDir, response.body.fileKey, `origin.mp4`)),
    ).toBe(true);
    expect(
      fs.existsSync(path.join(baseDir, response.body.fileKey, `1080p.mp4`)),
    ).toBe(true);
    expect(
      fs.existsSync(path.join(baseDir, response.body.fileKey, `720p.mp4`)),
    ).toBe(true);
    expect(
      fs.existsSync(path.join(baseDir, response.body.fileKey, `480p.mp4`)),
    ).toBe(true);
    expect(
      fs.existsSync(path.join(baseDir, response.body.fileKey, `360p.mp4`)),
    ).toBe(true);
    expect(
      fs.existsSync(path.join(baseDir, response.body.fileKey, `240p.mp4`)),
    ).toBe(true);
    expect(
      fs.existsSync(path.join(baseDir, response.body.fileKey, `144p.mp4`)),
    ).toBe(true);
  }, 30000);

  // Download file success handling
  it('should download a file', async () => {
    const fileKey = await createFile('sample-image1.jpg');
    const response = await request(app.getHttpServer())
      .get(`/file/download/${testFolderKey}/${fileKey}`)
      .set('Authorization', `Bearer ${testUserToken}`);

    expect(response.status).toBe(200);
  });

  // Stream file success handling
  it('should stream a file', async () => {
    const fileKey = await createFile('sample-video1.mp4');
    const response = await request(app.getHttpServer())
      .get(`/file/stream/${testFolderKey}/${fileKey}`)
      .query({ resolution: '1080p' })
      .set('Authorization', `Bearer ${testUserToken}`)
      .set('range', 'bytes=0-1024');

    expect(response.status).toBe(206);
  });

  /**
   * Failure handling
   */

  // Create file failure handling
  it('should not create a file if Authorization header is not given', async () => {
    const file = await fs.promises.readFile(
      `${__dirname}/sample/sample-image2.jpg`,
    );
    const response = await uploadFile(
      file,
      'sample-image2.jpg',
      testFolderKey,
      '',
    );
    expect(response.status).toBe(401);
    expect(response.body.message).toBe('Authorization header is missing');
  });

  /**
   * Functions for testing
   */

  const createFile = async (fileName: string): Promise<string> => {
    const file = await fs.promises.readFile(`${__dirname}/sample/${fileName}`);
    const extName = path.extname(fileName);

    const fileKey = uuidv4();
    await postgresClient.query(
      `INSERT INTO "cloud"."files" (file_name, file_key, parent_folder_id) VALUES ('${fileName}', '${fileKey}', ${BigInt(1234)})`,
    );
    await postgresClient.query(
      `INSERT INTO "cloud".file_info (file_id, uploader_id, byte_size) VALUES ((SELECT id FROM "cloud"."files" WHERE file_key = '${fileKey}'), ${testUserId}, ${file.length})`,
    );

    if (!fs.existsSync(baseDir)) {
      fs.mkdirSync(baseDir);
    }
    fs.mkdirSync(`${baseDir}/${fileKey}`);
    await fs.promises.writeFile(`${baseDir}/${fileKey}/origin${extName}`, file);
    if (!extName.match(/mp4|webm|mov/)) {
      return fileKey;
    }
    await fs.promises.writeFile(`${baseDir}/${fileKey}/1080p${extName}`, file);
    await fs.promises.writeFile(`${baseDir}/${fileKey}/720p${extName}`, file);
    await fs.promises.writeFile(`${baseDir}/${fileKey}/480p${extName}`, file);
    await fs.promises.writeFile(`${baseDir}/${fileKey}/360p${extName}`, file);
    await fs.promises.writeFile(`${baseDir}/${fileKey}/240p${extName}`, file);
    await fs.promises.writeFile(`${baseDir}/${fileKey}/144p${extName}`, file);

    return fileKey;
  };

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
      .set('Authorization', `${userToken}`)
      .attach('file', chunk, { filename: fileName })
      .field('chunkNumber', chunkNumber)
      .field('totalChunks', totalChunks)
      .field('fileName', fileName);
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
      if (response.status === 206) continue;
      else return { status: response.status, body: response.body };
    }
    return { status: 572, body: { message: 'Failed to upload file' } };
  };
});
