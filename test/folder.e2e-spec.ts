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
import request from 'supertest';
import { v4 as uuidv4 } from 'uuid';
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
          .set('Authorization', `Bearer ${data.accessToken.expired}`)
          .send();

        expect(response.status).toBe(401);
        expect(response.body.message).toBe('Invalid token');
      });
      it('should not create a root folder if Token payload is wrong', async () => {
        const response = await request(app.getHttpServer())
          .post('/folder/create')
          .set('Authorization', `Bearer ${data.accessToken.wrongPayload}`)
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
          .set('Authorization', `Bearer ${data.accessToken.expired}`)
          .send({ folderName: 'test_folder' });

        expect(response.status).toBe(401);
        expect(response.body.message).toBe('Invalid token');
      });
      it('should not create a sub folder if Token payload is wrong', async () => {
        const response = await request(app.getHttpServer())
          .post(`/folder/create/${root.folder.folder_key}`)
          .set('Authorization', `Bearer ${data.accessToken.wrongPayload}`)
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
      expect(response.body.folders).toEqual([
        {
          folderKey: subFolder.folder.folder_key,
          folderName: 'dummy1',
        },
      ]);
      expect(response.body.files).toEqual([
        {
          fileKey: subFile.file.file_key,
          fileName: 'dummy1',
          enabled: true,
        },
      ]);
    });
    it('should not read a folder if Authorization header is not given', async () => {
      const response = await request(app.getHttpServer())
        .get(`/folder/${root.folder.folder_key}`)
        .send();

      expect(response.status).toBe(401);
      expect(response.body.message).toBe('Authorization header is missing');
    });
    it('should not read a folder if Token is expired', async () => {
      const response = await request(app.getHttpServer())
        .get(`/folder/${root.folder.folder_key}`)
        .set('Authorization', `Bearer ${data.accessToken.expired}`)
        .send();

      expect(response.status).toBe(401);
      expect(response.body.message).toBe('Invalid token');
    });
    it('should not read a folder if Token payload is wrong', async () => {
      const response = await request(app.getHttpServer())
        .get(`/folder/${root.folder.folder_key}`)
        .set('Authorization', `Bearer ${data.accessToken.wrongPayload}`)
        .send();

      expect(response.status).toBe(401);
      expect(response.body.message).toBe('Invalid token');
    });
    it('should not read a folder if Token secret is wrong', async () => {
      const response = await request(app.getHttpServer())
        .get(`/folder/${root.folder.folder_key}`)
        .set('Authorization', `Bearer ${data.accessToken.wrongSecret}`)
        .send();

      expect(response.status).toBe(401);
      expect(response.body.message).toBe('Invalid token');
    });
    it('should not read a folder if user does not exist', async () => {
      data = await setupData(postgresClient, false);
      const response = await request(app.getHttpServer())
        .get(`/folder/${root.folder.folder_key}`)
        .set('Authorization', `Bearer ${data.accessToken.normal}`)
        .send();

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('User does not exist');
    });
    it('should not read a folder if folderKey is wrong', async () => {
      const response = await request(app.getHttpServer())
        .get(`/folder/${uuidv4()}`)
        .set('Authorization', `Bearer ${data.accessToken.normal}`)
        .send();

      expect(response.body.message).toBe('Folder does not exist');
      expect(response.status).toBe(404);
    });
    it('should not read a folder if user does not have role to read the folder', async () => {
      const altUser = await data.createTestUser(uuidv4());
      const payload: TokenPayloadData = {
        uuidKey: altUser.uuid_key,
        email: 'test2@ifelfi.com',
        nickname: 'test2',
        imageUrl: null,
      };
      const accessToken = data.createToken(payload);
      const response = await request(app.getHttpServer())
        .get(`/folder/${root.folder.folder_key}`)
        .set('Authorization', `Bearer ${accessToken.normal}`)
        .send();

      expect(response.status).toBe(403);
      expect(response.body.message).toBe(
        'User does not have the required role',
      );
    });
  });

  describe('[DELETE] /folder/:folderKey', () => {
    let root: Awaited<ReturnType<typeof createRootFolder>>;
    beforeEach(async () => {
      if (!data.user) {
        throw new Error('User not found');
      }
      root = await createRootFolder(data.user.id, data.user.uuid_key);
    });
    it('should delete a folder', async () => {
      const response = await request(app.getHttpServer())
        .delete(`/folder/${root.folder.folder_key}`)
        .set('Authorization', `Bearer ${data.accessToken.normal}`)
        .send();

      expect(response.status).toBe(200);
      expect(response.text).toBe('Folder deleted');
    });
    it('should not delete a folder if Authorization header is not given', async () => {
      const response = await request(app.getHttpServer())
        .delete(`/folder/${root.folder.folder_key}`)
        .send();

      expect(response.status).toBe(401);
      expect(response.body.message).toBe('Authorization header is missing');
    });
    it('should not delete a folder if Token is expired', async () => {
      const response = await request(app.getHttpServer())
        .delete(`/folder/${root.folder.folder_key}`)
        .set('Authorization', `Bearer ${data.accessToken.expired}`)
        .send();

      expect(response.status).toBe(401);
      expect(response.body.message).toBe('Invalid token');
    });
    it('should not delete a folder if Token payload is wrong', async () => {
      const response = await request(app.getHttpServer())
        .delete(`/folder/${root.folder.folder_key}`)
        .set('Authorization', `Bearer ${data.accessToken.wrongPayload}`)
        .send();

      expect(response.status).toBe(401);
      expect(response.body.message).toBe('Invalid token');
    });
    it('should not delete a folder if Token secret is wrong', async () => {
      const response = await request(app.getHttpServer())
        .delete(`/folder/${root.folder.folder_key}`)
        .set('Authorization', `Bearer ${data.accessToken.wrongSecret}`)
        .send();

      expect(response.status).toBe(401);
      expect(response.body.message).toBe('Invalid token');
    });
    it('should not delete a folder if user does not exist', async () => {
      data = await setupData(postgresClient, false);
      const response = await request(app.getHttpServer())
        .delete(`/folder/${root.folder.folder_key}`)
        .set('Authorization', `Bearer ${data.accessToken.normal}`)
        .send();

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('User does not exist');
    });
  });

  describe('[PATCH] /folder/move/:folderKey', () => {
    let root: Awaited<ReturnType<typeof createRootFolder>>;
    let subFolder1: Awaited<ReturnType<typeof createFolder>>;
    let subFolder2: Awaited<ReturnType<typeof createFolder>>;
    beforeEach(async () => {
      if (!data.user) {
        throw new Error('User not found');
      }
      root = await createRootFolder(data.user.id, data.user.uuid_key);
      subFolder1 = await createFolder(
        BigInt(1),
        data.user.id,
        'dummy1',
        root.folder.id,
      );
      subFolder2 = await createFolder(
        BigInt(2),
        data.user.id,
        'dummy2',
        root.folder.id,
      );
    });
    it('should move a folder', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/folder/move/${subFolder1.folder.folder_key}`)
        .query({ targetKey: subFolder2.folder.folder_key })
        .set('Authorization', `Bearer ${data.accessToken.normal}`)
        .send();

      expect(response.status).toBe(200);
      expect(response.text).toBe('Folder moved');
    });
    it('should not move a folder if Authorization header is not given', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/folder/move/${subFolder1.folder.folder_key}`)
        .query({ targetKey: subFolder2.folder.folder_key })
        .send();

      expect(response.status).toBe(401);
      expect(response.body.message).toBe('Authorization header is missing');
    });
    it('should not move a folder if Token is expired', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/folder/move/${subFolder1.folder.folder_key}`)
        .query({ targetKey: subFolder2.folder.folder_key })
        .set('Authorization', `Bearer ${data.accessToken.expired}`)
        .send();

      expect(response.status).toBe(401);
      expect(response.body.message).toBe('Invalid token');
    });
    it('should not move a folder if Token payload is wrong', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/folder/move/${subFolder1.folder.folder_key}`)
        .query({ targetKey: subFolder2.folder.folder_key })
        .set('Authorization', `Bearer ${data.accessToken.wrongPayload}`)
        .send();

      expect(response.status).toBe(401);
      expect(response.body.message).toBe('Invalid token');
    });
    it('should not move a folder if Token secret is wrong', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/folder/move/${subFolder1.folder.folder_key}`)
        .query({ targetKey: subFolder2.folder.folder_key })
        .set('Authorization', `Bearer ${data.accessToken.wrongSecret}`)
        .send();

      expect(response.status).toBe(401);
      expect(response.body.message).toBe('Invalid token');
    });
    it('should not move a folder if user does not exist', async () => {
      data = await setupData(postgresClient, false);
      const response = await request(app.getHttpServer())
        .patch(`/folder/move/${subFolder1.folder.folder_key}`)
        .query({ targetKey: subFolder2.folder.folder_key })
        .set('Authorization', `Bearer ${data.accessToken.normal}`)
        .send();

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('User does not exist');
    });
    it('should not move a folder if folderKey is wrong', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/folder/move/${uuidv4()}`)
        .query({ targetKey: subFolder2.folder.folder_key })
        .set('Authorization', `Bearer ${data.accessToken.normal}`)
        .send();

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Folder does not exist');
    });
    it('should not move a folder if targetFolderKey is wrong', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/folder/move/${subFolder1.folder.folder_key}`)
        .query({ targetKey: uuidv4() })
        .set('Authorization', `Bearer ${data.accessToken.normal}`)
        .send();

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Folder does not exist');
    });
    it('should not move a folder if user does not have role to move the folder', async () => {
      const altUser = await data.createTestUser(uuidv4());
      const payload: TokenPayloadData = {
        uuidKey: altUser.uuid_key,
        email: 'test2@ifelfi.com',
        nickname: 'test2',
        imageUrl: null,
      };
      const accessToken = data.createToken(payload);
      const response = await request(app.getHttpServer())
        .patch(`/folder/move/${subFolder1.folder.folder_key}`)
        .query({ targetKey: subFolder2.folder.folder_key })
        .set('Authorization', `Bearer ${accessToken.normal}`)
        .send();

      expect(response.status).toBe(403);
      expect(response.body.message).toBe(
        'User does not have the required role',
      );
    });
  });

  describe('[PATCH] /folder/rename/:folderKey', () => {
    let root: Awaited<ReturnType<typeof createRootFolder>>;
    let subFolder: Awaited<ReturnType<typeof createFolder>>;

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
    });

    it('should rename a folder', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/folder/rename/${subFolder.folder.folder_key}`)
        .set('Authorization', `Bearer ${data.accessToken.normal}`)
        .send({ folderName: 'dummy2' });

      expect(response.status).toBe(200);
      expect(response.text).toBe('Folder renamed');
    });
    it('should not rename a folder if Authorization header is not given', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/folder/rename/${subFolder.folder.folder_key}`)
        .send({ folderName: 'dummy2' });

      expect(response.status).toBe(401);
      expect(response.body.message).toBe('Authorization header is missing');
    });
    it('should not rename a folder if Token is expired', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/folder/rename/${subFolder.folder.folder_key}`)
        .set('Authorization', `Bearer ${data.accessToken.expired}`)
        .send({ folderName: 'dummy2' });

      expect(response.status).toBe(401);
      expect(response.body.message).toBe('Invalid token');
    });
    it('should not rename a folder if Token payload is wrong', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/folder/rename/${subFolder.folder.folder_key}`)
        .set('Authorization', `Bearer ${data.accessToken.wrongPayload}`)
        .send({ folderName: 'dummy2' });

      expect(response.status).toBe(401);
      expect(response.body.message).toBe('Invalid token');
    });
    it('should not rename a folder if Token secret is wrong', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/folder/rename/${subFolder.folder.folder_key}`)
        .set('Authorization', `Bearer ${data.accessToken.wrongSecret}`)
        .send({ folderName: 'dummy2' });

      expect(response.status).toBe(401);
      expect(response.body.message).toBe('Invalid token');
    });
    it('should not rename a folder if user does not exist', async () => {
      data = await setupData(postgresClient, false);
      const response = await request(app.getHttpServer())
        .patch(`/folder/rename/${subFolder.folder.folder_key}`)
        .set('Authorization', `Bearer ${data.accessToken.normal}`)
        .send({ folderName: 'dummy2' });

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('User does not exist');
    });
    it('should not rename a folder if folderKey is wrong', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/folder/rename/${uuidv4()}`)
        .set('Authorization', `Bearer ${data.accessToken.normal}`)
        .send({ folderName: 'dummy2' });

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Folder does not exist');
    });
    it('should not rename a folder if folderName is not given', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/folder/rename/${subFolder.folder.folder_key}`)
        .set('Authorization', `Bearer ${data.accessToken.normal}`)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.message).toBe(
        'Validation failed for $input.folderName',
      );
    });
    it('should not rename a folder if folderName is empty', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/folder/rename/${subFolder.folder.folder_key}`)
        .set('Authorization', `Bearer ${data.accessToken.normal}`)
        .send({ folderName: '' });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe(
        'Validation failed for $input.folderName',
      );
    });
    it('should not rename a folder if folderName is too long', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/folder/rename/${subFolder.folder.folder_key}`)
        .set('Authorization', `Bearer ${data.accessToken.normal}`)
        .send({ folderName: 'a'.repeat(300) });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe(
        'Validation failed for $input.folderName',
      );
    });
    it('should not rename a folder if user does not have role to rename the folder', async () => {
      const altUser = await data.createTestUser(uuidv4());
      const payload: TokenPayloadData = {
        uuidKey: altUser.uuid_key,
        email: 'test2@ifelfi.com',
        nickname: 'test2',
        imageUrl: null,
      };
      const accessToken = data.createToken(payload);
      const response = await request(app.getHttpServer())
        .patch(`/folder/rename/${subFolder.folder.folder_key}`)
        .set('Authorization', `Bearer ${accessToken.normal}`)
        .send({ folderName: 'dummy2' });

      expect(response.status).toBe(403);
      expect(response.body.message).toBe(
        'User does not have the required role',
      );
    });
  });
});
