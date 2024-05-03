import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppModule } from 'src/app.module';
import { PrismaService } from 'src/services/prisma.service';
import {
  createFile,
  createFolder,
  expiredUserToken,
  postgresClient,
  prismaService,
  setupData,
  testUserToken,
  testUserTokenPayload,
  wrongUserToken,
  wrongUserTokenPayload,
} from './setup-e2e';
import request from 'supertest';
import { v4 as uuidv4 } from 'uuid';
import { ICreateFolderRequestBody } from 'src/interfaces/folder.interface';
import { TokenPayloadData } from 'src/interfaces/token.interface';

const createRootFolder = async (userId: number, uuidKey: string) => {
  return createFolder(BigInt(1234), userId, uuidKey, null);
};

describe('Folder', () => {
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

  // Create a User before each test
  beforeEach(async () => {
    data = await setupData(postgresClient, true);
  });

  describe('[POST] /folder/create', () => {
    describe('root folder', () => {
      it('should create a root folder', async () => {
        const response = await request(app.getHttpServer())
          .post('/folder/create')
          .set('Authorization', `Bearer ${data.accessToken.normal}`)
          .send();

        expect(response.status).toBe(201);
        expect(response.text).toBe('Root folder created');
      });
      it('should not create a root folder if Authorization header is not given', async () => {
        const response = await request(app.getHttpServer())
          .post('/folder/create')
          .send();

        expect(response.status).toBe(401);
        expect(response.body.message).toBe('Authorization header is missing');
      });
      it('should not create a root folder if Token is expired', async () => {
        const response = await request(app.getHttpServer())
          .post('/folder/create')
          .set('Authorization', `Bearer ${expiredUserToken}`)
          .send();

        expect(response.status).toBe(401);
        expect(response.body.message).toBe('Invalid token');
      });
      it('should not create a root folder if Token payload is wrong', async () => {
        const response = await request(app.getHttpServer())
          .post('/folder/create')
          .set('Authorization', `Bearer ${wrongUserToken}`)
          .send();

        expect(response.status).toBe(401);
        expect(response.body.message).toBe('Invalid token');
      });
      it('should not create a root folder if Token secret is wrong', async () => {
        const response = await request(app.getHttpServer())
          .post('/folder/create')
          .set('Authorization', `Bearer ${data.accessToken.wrongSecret}`)
          .send();

        expect(response.status).toBe(401);
        expect(response.body.message).toBe('Invalid token');
      });
      it('should not create a root folder if user does not exist', async () => {
        data = await setupData(postgresClient, false);
        const response = await request(app.getHttpServer())
          .post('/folder/create')
          .set('Authorization', `Bearer ${data.accessToken.normal}`)
          .send();

        expect(response.status).toBe(404);
        expect(response.body.message).toBe('User does not exist');
      });
    });
    describe('sub folder', () => {
      let root: Awaited<ReturnType<typeof createRootFolder>>;
      beforeEach(async () => {
        if (!data.user) {
          throw new Error('User not found');
        }
        root = await createRootFolder(data.user.id, data.user.uuid_key);
      });
      it('should create a sub folder', async () => {
        const response = await request(app.getHttpServer())
          .post(`/folder/create/${root.folder.folder_key}`)
          .set('Authorization', `Bearer ${data.accessToken.normal}`)
          .send({ folderName: 'test_folder' });

        expect(response.status).toBe(201);
        expect(response.text).toBe('Folder created');
      });
      it('should not create a sub folder if Authorization header is not given', async () => {
        const response = await request(app.getHttpServer())
          .post(`/folder/create/${root.folder.folder_key}`)
          .send({ folderName: 'test_folder' });

        expect(response.status).toBe(401);
        expect(response.body.message).toBe('Authorization header is missing');
      });
      it('should not create a sub folder if Token is expired', async () => {
        const response = await request(app.getHttpServer())
          .post(`/folder/create/${root.folder.folder_key}`)
          .set('Authorization', `Bearer ${expiredUserToken}`)
          .send({ folderName: 'test_folder' });

        expect(response.status).toBe(401);
        expect(response.body.message).toBe('Invalid token');
      });
      it('should not create a sub folder if Token payload is wrong', async () => {
        const response = await request(app.getHttpServer())
          .post(`/folder/create/${root.folder.folder_key}`)
          .set('Authorization', `Bearer ${wrongUserToken}`)
          .send({ folderName: 'test_folder' });

        expect(response.status).toBe(401);
        expect(response.body.message).toBe('Invalid token');
      });
      it('should not create a sub folder if Token secret is wrong', async () => {
        const response = await request(app.getHttpServer())
          .post(`/folder/create/${root.folder.folder_key}`)
          .set('Authorization', `Bearer ${data.accessToken.wrongSecret}`)
          .send({ folderName: 'test_folder' });

        expect(response.status).toBe(401);
        expect(response.body.message).toBe('Invalid token');
      });
      it('should not create a sub folder if user does not exist', async () => {
        data = await setupData(postgresClient, false);
        const response = await request(app.getHttpServer())
          .post(`/folder/create/${root.folder.folder_key}`)
          .set('Authorization', `Bearer ${data.accessToken.normal}`)
          .send({ folderName: 'test_folder' });

        expect(response.status).toBe(404);
        expect(response.body.message).toBe('User does not exist');
      });
      it('should not create a sub folder if folderName is not given', async () => {
        const response = await request(app.getHttpServer())
          .post(`/folder/create/${root.folder.folder_key}`)
          .set('Authorization', `Bearer ${data.accessToken.normal}`)
          .send({});

        expect(response.status).toBe(400);
        expect(response.body.message).toBe(
          'Validation failed for $input.folderName',
        );
      });
      it('should not create a sub folder if folderName is empty', async () => {
        const response = await request(app.getHttpServer())
          .post(`/folder/create/${root.folder.folder_key}`)
          .set('Authorization', `Bearer ${data.accessToken.normal}`)
          .send({ folderName: '' });

        expect(response.status).toBe(400);
        expect(response.body.message).toBe(
          'Validation failed for $input.folderName',
        );
      });
      it('should not create a sub folder if folderName is too long', async () => {
        const response = await request(app.getHttpServer())
          .post(`/folder/create/${root.folder.folder_key}`)
          .set('Authorization', `Bearer ${data.accessToken.normal}`)
          .send({ folderName: 'a'.repeat(256) });

        expect(response.status).toBe(400);
        expect(response.body.message).toBe(
          'Validation failed for $input.folderName',
        );
      });
      it('should not create a sub folder if folderName is not unique', async () => {
        if (!data.user) {
          throw new Error('User not found');
        }
        await createFolder(
          BigInt(111),
          data.user.id,
          'test_folder',
          root.folder.id,
        );
        const response = await request(app.getHttpServer())
          .post(`/folder/create/${root.folder.folder_key}`)
          .set('Authorization', `Bearer ${data.accessToken.normal}`)
          .send({ folderName: 'test_folder' });

        expect(response.body.message).toBe('Folder already exists');
        expect(response.status).toBe(409);
        expect(response.body.message).toBe('Folder already exists');
      });
      it('should not create a sub folder if user does not have role to create the folder', async () => {
        const altUser = await data.createTestUser(uuidv4());
        const payload: TokenPayloadData = {
          uuidKey: altUser.uuid_key,
          email: 'test2@ifelfi.com',
          nickname: 'test2',
          imageUrl: null,
        };
        const accessToken = data.createToken(payload);
        const response = await request(app.getHttpServer())
          .post(`/folder/create/${root.folder.folder_key}`)
          .set('Authorization', `Bearer ${accessToken.normal}`)
          .send({ folderName: 'test_folder' });

        expect(response.status).toBe(403);
        expect(response.body.message).toBe(
          'User does not have the required role',
        );
      });
    });
  });
  describe('[GET] /folder/:folderKey', () => {
    let root: Awaited<ReturnType<typeof createRootFolder>>;
    let subFolder: Awaited<ReturnType<typeof createFolder>>;
    let subFile: Awaited<ReturnType<typeof createFile>>;
    beforeEach(async () => {
      if (!data.user) {
        throw new Error('User not found');
      }
      root = await createRootFolder(data.user.id, data.user.uuid_key);
      subFolder = await createFolder(
        BigInt(1),
        data.user.id,
        'dummy1',
        root.folder.id,
      );
      subFile = await createFile(
        data.user.id,
        BigInt(1),
        BigInt(1234),
        'dummy1',
      );
    });
    it('should read a folder', async () => {
      const response = await request(app.getHttpServer())
        .get(`/folder/${root.folder.folder_key}`)
        .set('Authorization', `Bearer ${data.accessToken.normal}`)
        .send();

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('files');
      expect(response.body).toHaveProperty('folders');
    });
  });

  // // deprecated
  // /**
  //  * Success handling
  //  */

  // // Create root folder success handling
  // it('should create a root folder', async () => {
  //   const response = await request(app.getHttpServer())
  //     .post('/folder/create')
  //     .set('Authorization', `Bearer ${testUserToken}`)
  //     .send({ folderName: 'test_folder' });

  //   expect(response.status).toBe(201);
  //   expect(response.text).toBe('Root folder created');
  // });

  // // Read a folder success handling
  // it('should read a folder', async () => {
  //   const baseFolderKey = await createTestFolder(testUserId);
  //   await createFolder(BigInt(1), testUserId, 'dummy1', BigInt(1234));
  //   await createFolder(BigInt(2), testUserId, 'dummy2', BigInt(1234));
  //   await createFile(testUserId, BigInt(1), BigInt(1234), 'dummy1');
  //   const response = await request(app.getHttpServer())
  //     .get(`/folder/${baseFolderKey}`)
  //     .set('Authorization', `Bearer ${testUserToken}`)
  //     .send({});

  //   expect(response.status).toBe(200);
  //   expect(response.body).toHaveProperty('files');
  //   expect(response.body).toHaveProperty('folders');
  //   expect(response.body.folders.length).toBe(2);
  //   expect(response.body.files.length).toBe(1);
  // });

  // // Delete a folder success handling
  // it('should delete a folder', async () => {
  //   const testFolderKey = await createTestFolder(testUserId);
  //   const response = await request(app.getHttpServer())
  //     .delete(`/folder/${testFolderKey}`)
  //     .set('Authorization', `Bearer ${testUserToken}`)
  //     .send({});

  //   expect(response.status).toBe(200);
  //   expect(response.text).toBe('Folder deleted');
  // });

  // /**
  //  * Error handling
  //  */

  // // Create folder error handling
  // it('should not create a folder if Authorization header is not given', async () => {
  //   const response = await request(app.getHttpServer())
  //     .post('/folder/create')
  //     .send({ folderName: 'test_folder' });

  //   expect(response.status).toBe(401);
  //   expect(response.body.message).toBe('Authorization header is missing');
  // });

  // it('should not create a folder if Token is expired', async () => {
  //   const response = await request(app.getHttpServer())
  //     .post('/folder/create')
  //     .set('Authorization', `Bearer ${expiredUserToken}`)
  //     .send({ folderName: 'test_folder' });

  //   expect(response.status).toBe(401);
  //   expect(response.body.message).toBe('Invalid token');
  // });

  // it('should not create a folder if User does not exist', async () => {
  //   const response = await request(app.getHttpServer())
  //     .post('/folder/create')
  //     .set('Authorization', `Bearer ${wrongUserToken}`)
  //     .send({ folderName: 'test_folder' });

  //   expect(response.status).toBe(404);
  //   expect(response.body.message).toBe('User does not exist');
  // });

  // it('should not create a folder if folderName is not given', async () => {
  //   const response = await request(app.getHttpServer())
  //     .post('/folder/create')
  //     .set('Authorization', `Bearer ${testUserToken}`)
  //     .send({});

  //   expect(response.status).toBe(400);
  //   expect(response.body.message).toBe(
  //     'Validation failed for $input.folderName',
  //   );
  // });

  // it('should not create a folder if folderName is empty', async () => {
  //   const response = await request(app.getHttpServer())
  //     .post('/folder/create')
  //     .set('Authorization', `Bearer ${testUserToken}`)
  //     .send({ folderName: '' });

  //   expect(response.status).toBe(400);
  //   expect(response.body.message).toBe(
  //     'Validation failed for $input.folderName',
  //   );
  // });

  // it('should not create a folder if folderName is too long', async () => {
  //   const response = await request(app.getHttpServer())
  //     .post('/folder/create')
  //     .set('Authorization', `Bearer ${testUserToken}`)
  //     .send({ folderName: 'a'.repeat(256) });

  //   expect(response.status).toBe(400);
  //   expect(response.body.message).toBe(
  //     'Validation failed for $input.folderName',
  //   );
  // });

  // it('should not create a folder if folderName is not unique', async () => {
  //   const baseFolderKey = await createTestFolder(testUserId);
  //   await createFolder(BigInt(111), testUserId, 'test_folder', BigInt(1234));

  //   const createFolderRequestBody: ICreateFolderRequestBody = {
  //     folderName: 'test_folder',
  //   };

  //   // Create a folder first
  //   await request(app.getHttpServer())
  //     .post(`/folder/create/${baseFolderKey}`)
  //     .set('Authorization', `Bearer ${testUserToken}`)
  //     .send(createFolderRequestBody);

  //   // Try to create the same folder again
  //   const response = await request(app.getHttpServer())
  //     .post(`/folder/create/${baseFolderKey}`)
  //     .set('Authorization', `Bearer ${testUserToken}`)
  //     .send(createFolderRequestBody);

  //   expect(response.status).toBe(409);
  //   expect(response.body.message).toBe('Folder already exists');
  // });

  // it('should not create a folder if user does not have role to create the folder', async () => {
  //   const baseFolderKey = await createTestFolder(testUserId);

  //   // Create a user with no access to the folder
  //   const payload = wrongUserTokenPayload;
  //   postgresClient.query(
  //     `INSERT INTO "member"."users" (uuid_key) VALUES ('${payload.uuidKey}')`,
  //   );
  //   const response = await request(app.getHttpServer())
  //     .post(`/folder/create/${baseFolderKey}`)
  //     .set('Authorization', `Bearer ${wrongUserToken}`)
  //     .send({
  //       folderName: 'test_folder',
  //     });

  //   expect(response.status).toBe(403);
  //   expect(response.body.message).toBe('User does not have the required role');
  // });

  // // Read a folder error handling
  // it('should not read a folder if Authorization header is not given', async () => {
  //   const response = await request(app.getHttpServer())
  //     .get('/folder/1234')
  //     .send({});

  //   expect(response.status).toBe(401);
  //   expect(response.body.message).toBe('Authorization header is missing');
  // });

  // it('should not read a folder if Token is expired', async () => {
  //   const response = await request(app.getHttpServer())
  //     .get('/folder/1234')
  //     .set('Authorization', `Bearer ${expiredUserToken}`)
  //     .send({});

  //   expect(response.status).toBe(401);
  //   expect(response.body.message).toBe('Invalid token');
  // });

  // it('should not read a folder if User does not exist', async () => {
  //   const response = await request(app.getHttpServer())
  //     .get('/folder/1234')
  //     .set('Authorization', `Bearer ${wrongUserToken}`)
  //     .send({});

  //   expect(response.status).toBe(404);
  //   expect(response.body.message).toBe('User does not exist');
  // });

  // it('should not read a folder if folderKey is wrong', async () => {
  //   const response = await request(app.getHttpServer())
  //     .get(`/folder/${uuidv4()}`)
  //     .set('Authorization', `Bearer ${testUserToken}`)
  //     .send({});

  //   expect(response.body.message).toBe('Folder does not exist');
  //   expect(response.status).toBe(404);
  // });

  // it('should not read a folder if user does not have role to read the folder', async () => {
  //   const baseFolderKey = await createTestFolder(testUserId);
  //   await createFolder(BigInt(1), testUserId, 'dummy1', BigInt(1234));
  //   await createFolder(BigInt(2), testUserId, 'dummy2', BigInt(1234));
  //   await createFile(testUserId, BigInt(1), BigInt(1234), 'dummy1');

  //   // Create a user with no access to the folder
  //   const payload = wrongUserTokenPayload;
  //   postgresClient.query(
  //     `INSERT INTO "member"."users" (uuid_key) VALUES ('${payload.uuidKey}')`,
  //   );
  //   const response = await request(app.getHttpServer())
  //     .get(`/folder/${baseFolderKey}`)
  //     .set('Authorization', `Bearer ${wrongUserToken}`)
  //     .send({});

  //   expect(response.status).toBe(403);
  //   expect(response.body.message).toBe('User does not have the required role');
  // });
});
