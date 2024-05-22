import { TokenPayloadData } from 'src/interfaces/token.interface';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppModule } from 'src/app.module';
import { PrismaService } from 'src/services/prisma.service';
import {
  createFile,
  createFolder,
  postgresClient,
  prismaService,
  setupData,
} from './setup-e2e';
import { v4 as uuidv4 } from 'uuid';
import request from 'supertest';
import fs from 'fs';
import { File } from 'buffer';
import path from 'path';

describe('File', () => {
  let app: INestApplication;
  let data: Awaited<ReturnType<typeof setupData>>;
  let folderData: Awaited<ReturnType<typeof createFolder>>;
  let uploadedFile: Awaited<ReturnType<typeof createFile>>;
  let altUser: Awaited<ReturnType<typeof data.createTestUser>>;
  let altUserToken: Awaited<ReturnType<typeof data.createToken>>;
  const baseDir = process.env.STORAGE_PATH || 'testStorage';
  const originDir = path.join(baseDir, 'origin');

  const sampleImageName = 'uploaded-image.jpg';
  const sampleVideoName = 'uploaded-video.mp4';
  const sampleImage = fs.readFileSync(`${__dirname}/sample/sample-image.jpg`);
  const sampleVideo = fs.readFileSync(`${__dirname}/sample/sample-video.mp4`);
  let testBuffer: Buffer;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(prismaService)
      .compile();

    app = module.createNestApplication();
    await app.init();
    testBuffer = Buffer.from(await new File(['test'], 'test').arrayBuffer());
  });

  afterAll(async () => {
    await app.close();
  });

  // Create User and Folder for testing
  beforeEach(async () => {
    // Create Data for testing
    data = await setupData(postgresClient, true);
    // Create Second User
    altUser = await data.createTestUser(uuidv4());
    const altUserTokenPayload: TokenPayloadData = {
      uuidKey: altUser.uuid_key,
      email: 'test2@iflefi.com',
      nickname: 'test2',
      imageUrl: null,
    };
    altUserToken = data.createToken(altUserTokenPayload);

    // Create Folder
    if (!data.user) {
      throw new Error('User not found');
    }
    // Root Folder
    folderData = await createFolder(
      BigInt(1),
      data.user.id,
      data.user.uuid_key,
      null,
    );
  });

  afterAll(async () => {
    await fs.promises.rm(baseDir, { recursive: true });
  });

  describe('[POST] /file/upload/:folderKey', () => {
    it('should upload a image file', async () => {
      const response = await uploadFile(
        sampleImage,
        sampleImageName,
        folderData.folder.folder_key,
        'Bearer ' + data.accessToken.normal,
      );
      expect(response.status).toBe(201);
      expect(response.body.message).toBe('File uploaded');
    });
    it('should upload a video file', async () => {
      const response = await uploadFile(
        sampleVideo,
        sampleVideoName,
        folderData.folder.folder_key,
        'Bearer ' + data.accessToken.normal,
      );
      expect(response.status).toBe(201);
      expect(response.body.message).toBe('File uploaded');
    });
    it('should not upload a file if Authorization header is not given', async () => {
      const response = await uploadFile(
        testBuffer,
        'test',
        folderData.folder.folder_key,
        '',
      );
      expect(response.status).toBe(401);
      expect(response.body.message).toBe('Authorization header is missing');
    });
    it('should not upload a file if Token is expired', async () => {
      const response = await uploadFile(
        testBuffer,
        'test',
        folderData.folder.folder_key,
        'Bearer ' + data.accessToken.expired,
      );
      expect(response.status).toBe(401);
      expect(response.body.message).toBe('Invalid token');
    });
    it('should not upload a file if user does not have create role', async () => {
      const response = await uploadFile(
        testBuffer,
        'test',
        folderData.folder.folder_key,
        'Bearer ' + altUserToken.normal,
      );
      expect(response.status).toBe(403);
      expect(response.body.message).toBe(
        'User does not have the required role',
      );
    });
    it('should not upload a file if file name is not given', async () => {
      const response = await uploadFile(
        testBuffer,
        '',
        folderData.folder.folder_key,
        'Bearer ' + data.accessToken.normal,
      );
      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Invalid file');
    });
    it('should not upload a file if file name is invalid', async () => {
      const response = await uploadFile(
        testBuffer,
        'a'.repeat(257),
        folderData.folder.folder_key,
        'Bearer ' + data.accessToken.normal,
      );
      expect(response.status).toBe(400);
      expect(response.body.message).toBe(
        'Validation failed for $input.fileName',
      );
    });
    it('should not upload a file if file is not given', async () => {
      const response = await request(app.getHttpServer())
        .post(`/file/upload/${folderData.folder.folder_key}`)
        .set('Authorization', `Bearer ${data.accessToken.normal}`)
        .field('fileName', 'test');
      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Invalid file');
    });
    it('should not upload a file if chunkNumber is not given', async () => {
      const response = await request(app.getHttpServer())
        .post(`/file/upload/${folderData.folder.folder_key}`)
        .set('Authorization', `Bearer ${data.accessToken.normal}`)
        .attach('file', testBuffer, { filename: 'test' })
        .field('totalChunks', 1)
        .field('fileName', 'test');
      expect(response.status).toBe(400);
      expect(response.body.message).toBe(
        'Validation failed for $input.chunkNumber',
      );
    });
    it('should not upload a file if totalChunks is not given', async () => {
      const response = await request(app.getHttpServer())
        .post(`/file/upload/${folderData.folder.folder_key}`)
        .set('Authorization', `Bearer ${data.accessToken.normal}`)
        .attach('file', testBuffer, { filename: 'test' })
        .field('chunkNumber', 0)
        .field('fileName', 'test');
      expect(response.status).toBe(400);
      expect(response.body.message).toBe(
        'Validation failed for $input.totalChunks',
      );
    });
    it('should not upload a file if chunkNumber is invalid', async () => {
      const response = await uploadChunk(
        testBuffer,
        -1,
        1,
        'test',
        folderData.folder.folder_key,
        'Bearer ' + data.accessToken.normal,
      );
      expect(response.status).toBe(400);
      expect(response.body.message).toBe(
        'Validation failed for $input.chunkNumber',
      );
    });
    it('should not upload a file if totalChunks is invalid', async () => {
      const response = await uploadChunk(
        testBuffer,
        0,
        -1,
        'test',
        folderData.folder.folder_key,
        'Bearer ' + data.accessToken.normal,
      );
      expect(response.status).toBe(400);
      expect(response.body.message).toBe(
        'Validation failed for $input.totalChunks',
      );
    });
    it('should not upload a file if file is already uploaded', async () => {
      await uploadFile(
        testBuffer,
        'test',
        folderData.folder.folder_key,
        'Bearer ' + data.accessToken.normal,
      );
      const response = await uploadFile(
        testBuffer,
        'test',
        folderData.folder.folder_key,
        'Bearer ' + data.accessToken.normal,
      );
      expect(response.status).toBe(409);
      expect(response.body.message).toBe('File already exists');
    });
  });

  describe('[GET] /file/download/:folderKey/:fileKey', () => {
    beforeEach(async () => {
      if (!data.user) {
        throw new Error('User not found');
      }
      uploadedFile = await createFile(
        data.user.id,
        BigInt(1),
        folderData.folder.id,
        'test.jpg',
      );
      fs.mkdirSync(originDir, { recursive: true });
      fs.writeFileSync(
        `${originDir}/${uploadedFile.file.file_key}`,
        testBuffer,
      );
    });

    afterEach(async () => {
      await fs.promises.rm(originDir, { recursive: true });
    });

    it('should download a file', async () => {
      const response = await request(app.getHttpServer())
        .get(
          `/file/download/${folderData.folder.folder_key}/${uploadedFile.file.file_key}`,
        )
        .set('Authorization', `Bearer ${data.accessToken.normal}`);
      expect(response.status).toBe(200);
    });
    it('should not download a file if Authorization header is not given', async () => {
      const response = await request(app.getHttpServer()).get(
        `/file/download/${folderData.folder.folder_key}/${uploadedFile.file.file_key}`,
      );
      expect(response.status).toBe(401);
      expect(response.body.message).toBe('Authorization header is missing');
    });
    it('should not download a file if Token is expired', async () => {
      const response = await request(app.getHttpServer())
        .get(
          `/file/download/${folderData.folder.folder_key}/${uploadedFile.file.file_key}`,
        )
        .set('Authorization', `Bearer ${data.accessToken.expired}`);
      expect(response.status).toBe(401);
      expect(response.body.message).toBe('Invalid token');
    });
    it('should not download a file if user does not have read role', async () => {
      const response = await request(app.getHttpServer())
        .get(
          `/file/download/${folderData.folder.folder_key}/${uploadedFile.file.file_key}`,
        )
        .set('Authorization', `Bearer ${altUserToken.normal}`);
      expect(response.status).toBe(403);
      expect(response.body.message).toBe(
        'User does not have the required role',
      );
    });
    it('should not download a file if file does not exist', async () => {
      const response = await request(app.getHttpServer())
        .get(`/file/download/${folderData.folder.folder_key}/${uuidv4()}`)
        .set('Authorization', `Bearer ${data.accessToken.normal}`);
      expect(response.status).toBe(404);
      expect(response.body.message).toBe('File does not exist');
    });
    it('should not download a file if file does not exist in storage', async () => {
      await fs.promises.rm(`${originDir}/${uploadedFile.file.file_key}`);
      const response = await request(app.getHttpServer())
        .get(
          `/file/download/${folderData.folder.folder_key}/${uploadedFile.file.file_key}`,
        )
        .set('Authorization', `Bearer ${data.accessToken.normal}`);
      expect(response.status).toBe(500);
      expect(response.body.message).toBe('File does not exist in storage');
    });
  });

  describe('[DELETE] /file/:folderKey/:fileKey', () => {
    beforeEach(async () => {
      if (!data.user) {
        throw new Error('User not found');
      }
      uploadedFile = await createFile(
        data.user.id,
        BigInt(1),
        folderData.folder.id,
        'test.jpg',
      );
      fs.mkdirSync(originDir, { recursive: true });
      fs.writeFileSync(
        `${originDir}/${uploadedFile.file.file_key}`,
        testBuffer,
      );
    });

    afterEach(async () => {
      await fs.promises.rm(originDir, { recursive: true });
    });

    it('should delete a file', async () => {
      const response = await request(app.getHttpServer())
        .delete(
          `/file/${folderData.folder.folder_key}/${uploadedFile.file.file_key}`,
        )
        .set('Authorization', `Bearer ${data.accessToken.normal}`);
      expect(response.status).toBe(200);
      expect(response.text).toBe('File deleted');
    });
    it('should not delete a file if Authorization header is not given', async () => {
      const response = await request(app.getHttpServer()).delete(
        `/file/${folderData.folder.folder_key}/${uploadedFile.file.file_key}`,
      );
      expect(response.status).toBe(401);
      expect(response.body.message).toBe('Authorization header is missing');
    });
    it('should not delete a file if Token is expired', async () => {
      const response = await request(app.getHttpServer())
        .delete(
          `/file/${folderData.folder.folder_key}/${uploadedFile.file.file_key}`,
        )
        .set('Authorization', `Bearer ${data.accessToken.expired}`);
      expect(response.status).toBe(401);
      expect(response.body.message).toBe('Invalid token');
    });
    it('should not delete a file if user does not have delete role', async () => {
      const response = await request(app.getHttpServer())
        .delete(
          `/file/${folderData.folder.folder_key}/${uploadedFile.file.file_key}`,
        )
        .set('Authorization', `Bearer ${altUserToken.normal}`);
      expect(response.status).toBe(403);
      expect(response.body.message).toBe(
        'User does not have the required role',
      );
    });
    it('should not delete a file if file does not exist', async () => {
      const response = await request(app.getHttpServer())
        .delete(`/file/${folderData.folder.folder_key}/${uuidv4()}`)
        .set('Authorization', `Bearer ${data.accessToken.normal}`);
      expect(response.status).toBe(404);
      expect(response.body.message).toBe('File does not exist');
    });
  });

  describe('[PATCH] /file/rename/:folderKey/:fileKey', () => {
    beforeEach(async () => {
      if (!data.user) {
        throw new Error('User not found');
      }
      uploadedFile = await createFile(
        data.user.id,
        BigInt(1),
        folderData.folder.id,
        'test.jpg',
      );
      fs.mkdirSync(originDir, { recursive: true });
      fs.writeFileSync(
        `${originDir}/${uploadedFile.file.file_key}`,
        testBuffer,
      );
    });

    afterEach(async () => {
      await fs.promises.rm(originDir, { recursive: true });
    });

    it('should rename a file', async () => {
      const response = await request(app.getHttpServer())
        .patch(
          `/file/rename/${folderData.folder.folder_key}/${uploadedFile.file.file_key}`,
        )
        .set('Authorization', `Bearer ${data.accessToken.normal}`)
        .send({ fileName: 'test2.jpg' });
      expect(response.status).toBe(200);
      expect(response.text).toBe('File renamed');
    });
    it('should not rename a file if Authorization header is not given', async () => {
      const response = await request(app.getHttpServer())
        .patch(
          `/file/rename/${folderData.folder.folder_key}/${uploadedFile.file.file_key}`,
        )
        .send({ fileName: 'test2.jpg' });
      expect(response.status).toBe(401);
      expect(response.body.message).toBe('Authorization header is missing');
    });
    it('should not rename a file if Token is expired', async () => {
      const response = await request(app.getHttpServer())
        .patch(
          `/file/rename/${folderData.folder.folder_key}/${uploadedFile.file.file_key}`,
        )
        .set('Authorization', `Bearer ${data.accessToken.expired}`)
        .send({ fileName: 'test2.jpg' });
      expect(response.status).toBe(401);
      expect(response.body.message).toBe('Invalid token');
    });
    it('should not rename a file if user does not have update role', async () => {
      const response = await request(app.getHttpServer())
        .patch(
          `/file/rename/${folderData.folder.folder_key}/${uploadedFile.file.file_key}`,
        )
        .set('Authorization', `Bearer ${altUserToken.normal}`)
        .send({ fileName: 'test2.jpg' });
      expect(response.status).toBe(403);
      expect(response.body.message).toBe(
        'User does not have the required role',
      );
    });
    it('should not rename a file if file does not exist', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/file/rename/${folderData.folder.folder_key}/${uuidv4()}`)
        .set('Authorization', `Bearer ${data.accessToken.normal}`)
        .send({ fileName: 'test2.jpg' });
      expect(response.status).toBe(404);
      expect(response.body.message).toBe('File does not exist');
    });
    it('should not rename a file if file name is not given', async () => {
      const response = await request(app.getHttpServer())
        .patch(
          `/file/rename/${folderData.folder.folder_key}/${uploadedFile.file.file_key}`,
        )
        .set('Authorization', `Bearer ${data.accessToken.normal}`)
        .send({ fileName: '' });
      expect(response.status).toBe(400);
      expect(response.body.message).toBe(
        'Validation failed for $input.fileName',
      );
    });
    it('should not rename a file if file name is invalid', async () => {
      const response = await request(app.getHttpServer())
        .patch(
          `/file/rename/${folderData.folder.folder_key}/${uploadedFile.file.file_key}`,
        )
        .set('Authorization', `Bearer ${data.accessToken.normal}`)
        .send({ fileName: 'a'.repeat(257) });
      expect(response.status).toBe(400);
      expect(response.body.message).toBe(
        'Validation failed for $input.fileName',
      );
    });
    it('should not rename a file if file name is already exists', async () => {
      if (!data.user) {
        throw new Error('User not found');
      }
      await createFile(
        data.user.id,
        BigInt(2),
        folderData.folder.id,
        'test2.jpg',
      );
      const response = await request(app.getHttpServer())
        .patch(
          `/file/rename/${folderData.folder.folder_key}/${uploadedFile.file.file_key}`,
        )
        .set('Authorization', `Bearer ${data.accessToken.normal}`)
        .send({ fileName: 'test2.jpg' });
      expect(response.status).toBe(409);
      expect(response.body.message).toBe('File already exists');
    });
  });

  describe('[PATCH] /file/move/:folderKey/:fileKey', () => {
    let targetFolderData: Awaited<ReturnType<typeof createFolder>>;
    beforeEach(async () => {
      if (!data.user) {
        throw new Error('User not found');
      }
      uploadedFile = await createFile(
        data.user.id,
        BigInt(1),
        folderData.folder.id,
        'test.jpg',
      );
      fs.mkdirSync(originDir, { recursive: true });
      fs.writeFileSync(
        `${originDir}/${uploadedFile.file.file_key}`,
        testBuffer,
      );
      targetFolderData = await createFolder(
        BigInt(2),
        data.user.id,
        data.user.uuid_key,
        null,
      );
    });

    afterEach(async () => {
      await fs.promises.rm(originDir, { recursive: true });
    });

    it('should move a file', async () => {
      const response = await request(app.getHttpServer())
        .patch(
          `/file/move/${folderData.folder.folder_key}/${uploadedFile.file.file_key}`,
        )
        .set('Authorization', `Bearer ${data.accessToken.normal}`)
        .query({ targetKey: targetFolderData.folder.folder_key });
      expect(response.status).toBe(200);
      expect(response.text).toBe('File moved');
    });
    it('should not move a file if Authorization header is not given', async () => {
      const response = await request(app.getHttpServer())
        .patch(
          `/file/move/${folderData.folder.folder_key}/${uploadedFile.file.file_key}`,
        )
        .query({ targetKey: targetFolderData.folder.folder_key });
      expect(response.status).toBe(401);
      expect(response.body.message).toBe('Authorization header is missing');
    });
    it('should not move a file if Token is expired', async () => {
      const response = await request(app.getHttpServer())
        .patch(
          `/file/move/${folderData.folder.folder_key}/${uploadedFile.file.file_key}`,
        )
        .set('Authorization', `Bearer ${data.accessToken.expired}`)
        .query({ targetKey: targetFolderData.folder.folder_key });
      expect(response.status).toBe(401);
      expect(response.body.message).toBe('Invalid token');
    });
    it('should not move a file if user does not have update role', async () => {
      const response = await request(app.getHttpServer())
        .patch(
          `/file/move/${folderData.folder.folder_key}/${uploadedFile.file.file_key}`,
        )
        .set('Authorization', `Bearer ${altUserToken.normal}`)
        .query({ targetKey: targetFolderData.folder.folder_key });
      expect(response.status).toBe(403);
      expect(response.body.message).toBe(
        'User does not have the required role',
      );
    });
    it('should not move a file if file does not exist', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/file/move/${folderData.folder.folder_key}/${uuidv4()}`)
        .set('Authorization', `Bearer ${data.accessToken.normal}`)
        .query({ targetKey: targetFolderData.folder.folder_key });
      expect(response.status).toBe(404);
      expect(response.body.message).toBe('File does not exist');
    });
    it('should not move a file if target folder does not exist', async () => {
      const response = await request(app.getHttpServer())
        .patch(
          `/file/move/${folderData.folder.folder_key}/${uploadedFile.file.file_key}`,
        )
        .set('Authorization', `Bearer ${data.accessToken.normal}`)
        .query({ targetKey: uuidv4() });
      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Folder does not exist');
    });
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
    chunkSize: number = 1024 * 1024,
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
    return { status: 500, body: { message: 'upload does not completed' } };
  };
});
