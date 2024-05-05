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

describe('File', () => {
  let app: INestApplication;
  let data: Awaited<ReturnType<typeof setupData>>;
  let folderData: Awaited<ReturnType<typeof createFolder>>;
  let uploadedImage: Awaited<ReturnType<typeof createFile>>;
  let uploadedVideo: Awaited<ReturnType<typeof createFile>>;
  let altUser: Awaited<ReturnType<typeof data.createTestUser>>;
  let altUserToken: Awaited<ReturnType<typeof data.createToken>>;
  const baseDir = process.env.FILE_UPLOAD_DIR || 'uploads';

  const sampleImageName = 'uploaded-image.jpg';
  const sampleVideoName = 'uploaded-video.mp4';
  const sampleImage = fs.readFileSync(`${__dirname}/sample/sample-image.jpg`);
  const sampleVideo = fs.readFileSync(`${__dirname}/sample/sample-video.mp4`);

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
  });

  // /**
  //  * Success handling
  //  */

  // // Create file success handling
  // it('should upload a file', async () => {
  //   const response = await uploadFile(
  //     sampleImage,
  //     'sample-image1.jpg',
  //     testFolderKey,
  //     'Bearer ' + testUserToken,
  //   );
  //   expect(response.status).toBe(201);
  //   expect(response.body.message).toBe('File uploaded');
  //   expect(
  //     fs.existsSync(path.join(baseDir, response.body.fileKey, `origin.jpg`)),
  //   ).toBe(true);
  // });

  // it('should upload a video file and create different resolutions', async () => {
  //   const response = await uploadFile(
  //     sampleVideo,
  //     'sample-video.mp4',
  //     testFolderKey,
  //     'Bearer ' + testUserToken,
  //   );
  //   expect(response.body.message).toBe('File uploaded');
  //   expect(response.status).toBe(201);
  //   expect(response.body.message).toBe('File uploaded');
  //   expect(response.body.fileKey).toBeDefined();
  //   expect(
  //     fs.existsSync(path.join(baseDir, response.body.fileKey, `origin.mp4`)),
  //   ).toBe(true);
  //   expect(
  //     fs.existsSync(path.join(baseDir, response.body.fileKey, `1080p.mp4`)),
  //   ).toBe(true);
  //   expect(
  //     fs.existsSync(path.join(baseDir, response.body.fileKey, `720p.mp4`)),
  //   ).toBe(true);
  //   expect(
  //     fs.existsSync(path.join(baseDir, response.body.fileKey, `480p.mp4`)),
  //   ).toBe(true);
  //   expect(
  //     fs.existsSync(path.join(baseDir, response.body.fileKey, `360p.mp4`)),
  //   ).toBe(true);
  //   expect(
  //     fs.existsSync(path.join(baseDir, response.body.fileKey, `240p.mp4`)),
  //   ).toBe(true);
  //   expect(
  //     fs.existsSync(path.join(baseDir, response.body.fileKey, `144p.mp4`)),
  //   ).toBe(true);
  // }, 30000);

  // // Download file success handling
  // it('should download a file', async () => {
  //   const response = await request(app.getHttpServer())
  //     .get(`/file/download/${testFolderKey}/${uploadedImageKey}`)
  //     .set('Authorization', `Bearer ${testUserToken}`);

  //   expect(response.status).toBe(200);
  // });

  // // Stream file success handling
  // it('should stream a file', async () => {
  //   const response = await request(app.getHttpServer())
  //     .get(`/file/stream/${testFolderKey}/${uploadedVideoKey}`)
  //     .query({ resolution: '1080p' })
  //     .set('Authorization', `Bearer ${testUserToken}`)
  //     .set('range', 'bytes=0-1024');

  //   expect(response.status).toBe(206);
  // });

  // // Delete file success handling
  // it('should delete a file', async () => {
  //   const response = await request(app.getHttpServer())
  //     .delete(`/file/${testFolderKey}/${uploadedImageKey}`)
  //     .set('Authorization', `Bearer ${testUserToken}`);

  //   expect(response.status).toBe(200);
  //   expect(response.text).toBe('File deleted');
  // });

  // // Rename file success handling
  // it('should rename a file', async () => {
  //   const response = await request(app.getHttpServer())
  //     .patch(`/file/rename/${testFolderKey}/${uploadedImageKey}`)
  //     .set('Authorization', `Bearer ${testUserToken}`)
  //     .send({ fileName: 'sample-image1-renamed.jpg' });

  //   expect(response.status).toBe(200);
  //   expect(response.text).toBe('File renamed');
  // });

  // // Move file success handling
  // it('should move a file', async () => {
  //   const targetFolderKey = uuidv4();
  //   await postgresClient.query(
  //     `INSERT INTO "cloud"."folders" (id, folder_name, folder_key) VALUES (${BigInt(1235)}, 'test', '${targetFolderKey}')`,
  //   );
  //   await postgresClient.query(
  //     `INSERT INTO "cloud"."user_role" (user_id, folder_id, role) VALUES (${testUserId}, '${BigInt(1235)}', '{create,read,update,delete}')`,
  //   );
  //   await postgresClient.query(
  //     `INSERT INTO "cloud".folder_info (folder_id, owner_id) VALUES (${BigInt(1235)}, ${testUserId})`,
  //   );
  //   const response = await request(app.getHttpServer())
  //     .patch(`/file/move/${testFolderKey}/${uploadedImageKey}`)
  //     .set('Authorization', `Bearer ${testUserToken}`)
  //     .query({ targetKey: targetFolderKey });

  //   expect(response.status).toBe(200);
  //   expect(response.text).toBe('File moved');
  // });

  // /**
  //  * Failure handling
  //  */

  // // Create file failure handling
  // it('should not create a file if Authorization header is not given', async () => {
  //   const response = await uploadFile(
  //     sampleImage,
  //     'sample-image.jpg',
  //     testFolderKey,
  //     '',
  //   );
  //   expect(response.status).toBe(401);
  //   expect(response.body.message).toBe('Authorization header is missing');
  // });

  // it('should not create a file if Token is expired', async () => {
  //   const response = await uploadFile(
  //     sampleImage,
  //     'sample-image.jpg',
  //     testFolderKey,
  //     'Bearer ' + expiredUserToken,
  //   );
  //   expect(response.status).toBe(401);
  //   expect(response.body.message).toBe('Invalid token');
  // });

  // it('should not create a file if user does not have create role', async () => {
  //   const response = await uploadFile(
  //     sampleImage,
  //     'sample-image.jpg',
  //     testFolderKey,
  //     'Bearer ' + wrongUserToken,
  //   );
  //   expect(response.status).toBe(403);
  //   expect(response.body.message).toBe('User does not have the required role');
  // });

  // it('should not create a file if file name is not given', async () => {
  //   const response = await request(app.getHttpServer())
  //     .post(`/file/upload/${testFolderKey}`)
  //     .set('Authorization', `Bearer ${testUserToken}`)
  //     .attach('file', sampleImage, { filename: 'sample-image.jpg' })
  //     .field('chunkNumber', 0)
  //     .field('totalChunks', 1);

  //   expect(response.status).toBe(400);
  //   expect(response.body.message).toBe('Validation failed for $input.fileName');
  // });

  // it('should not create a file if file name is invalid', async () => {
  //   const response = await uploadFile(
  //     sampleImage,
  //     'sample-image',
  //     testFolderKey,
  //     'Bearer ' + testUserToken,
  //   );
  //   expect(response.status).toBe(400);
  //   expect(response.body.message).toBe('Validation failed for $input.fileName');
  // });

  // it('should not create a file if file is not given', async () => {
  //   const response = await request(app.getHttpServer())
  //     .post(`/file/upload/${testFolderKey}`)
  //     .set('Authorization', `Bearer ${testUserToken}`)
  //     .field('fileName', 'sample-image.jpg')
  //     .field('chunkNumber', 0)
  //     .field('totalChunks', 1);
  //   expect(response.status).toBe(400);
  //   expect(response.body.message).toBe('Invalid file');
  // });

  // it('should not create a file if chunkNumber is not given', async () => {
  //   const response = await request(app.getHttpServer())
  //     .post(`/file/upload/${testFolderKey}`)
  //     .set('Authorization', `Bearer ${testUserToken}`)
  //     .attach('file', sampleImage, { filename: 'sample-image.jpg' })
  //     .field('totalChunks', 1)
  //     .field('fileName', 'sample-image.jpg');
  //   expect(response.status).toBe(400);
  //   expect(response.body.message).toBe(
  //     'Validation failed for $input.chunkNumber',
  //   );
  // });

  // it('should not create a file if totalChunks is not given', async () => {
  //   const response = await request(app.getHttpServer())
  //     .post(`/file/upload/${testFolderKey}`)
  //     .set('Authorization', `Bearer ${testUserToken}`)
  //     .attach('file', sampleImage, { filename: 'sample-image.jpg' })
  //     .field('chunkNumber', 0)
  //     .field('fileName', 'sample-image.jpg');
  //   expect(response.status).toBe(400);
  //   expect(response.body.message).toBe(
  //     'Validation failed for $input.totalChunks',
  //   );
  // });

  // it('should not create a file if chunkNumber is invalid', async () => {
  //   const response = await uploadChunk(
  //     sampleImage,
  //     -1,
  //     1,
  //     'sample-image.jpg',
  //     testFolderKey,
  //     'Bearer ' + testUserToken,
  //   );
  //   expect(response.status).toBe(400);
  //   expect(response.body.message).toBe(
  //     'Validation failed for $input.chunkNumber',
  //   );
  // });

  // it('should not create a file if totalChunks is invalid', async () => {
  //   const response = await uploadChunk(
  //     sampleImage,
  //     0,
  //     -1,
  //     'sample-image.jpg',
  //     testFolderKey,
  //     'Bearer ' + testUserToken,
  //   );
  //   expect(response.status).toBe(400);
  //   expect(response.body.message).toBe(
  //     'Validation failed for $input.totalChunks',
  //   );
  // });

  // it('should not create a file if file is already uploaded', async () => {
  //   await uploadFile(
  //     sampleImage,
  //     'sample-image.jpg',
  //     testFolderKey,
  //     'Bearer ' + testUserToken,
  //   );
  //   const response = await uploadFile(
  //     sampleImage,
  //     'sample-image.jpg',
  //     testFolderKey,
  //     'Bearer ' + testUserToken,
  //   );
  //   expect(response.status).toBe(409);
  //   expect(response.body.message).toBe('File already exists');
  // });

  // /**
  //  * Functions for testing
  //  */

  // const createFile = async (
  //   fileName: string,
  //   file: Buffer,
  // ): Promise<string> => {
  //   const extName = path.extname(fileName);

  //   const fileKey = uuidv4();

  //   if (!fs.existsSync(baseDir)) {
  //     fs.mkdirSync(baseDir);
  //   }
  //   fs.mkdirSync(`${baseDir}/${fileKey}`);
  //   await fs.promises.writeFile(`${baseDir}/${fileKey}/origin${extName}`, file);
  //   if (!extName.match(/mp4|webm|mov/)) {
  //     return fileKey;
  //   }
  //   await fs.promises.writeFile(`${baseDir}/${fileKey}/1080p${extName}`, file);
  //   await fs.promises.writeFile(`${baseDir}/${fileKey}/720p${extName}`, file);
  //   await fs.promises.writeFile(`${baseDir}/${fileKey}/480p${extName}`, file);
  //   await fs.promises.writeFile(`${baseDir}/${fileKey}/360p${extName}`, file);
  //   await fs.promises.writeFile(`${baseDir}/${fileKey}/240p${extName}`, file);
  //   await fs.promises.writeFile(`${baseDir}/${fileKey}/144p${extName}`, file);

  //   return fileKey;
  // };

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
    return { status: 400, body: { message: 'Failed to upload file' } };
  };
});
