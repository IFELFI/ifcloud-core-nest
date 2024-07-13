import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppModule } from 'src/app.module';
import { PrismaService } from 'src/services/prisma.service';
import {
  createFile,
  createFolder,
  postgresClient,
  prismaService,
  setUsers,
} from './setup-e2e';
import request from 'supertest';
import { v4 as uuidv4 } from 'uuid';

const createRootFolder = async (userId: number, uuidKey: string) => {
  return createFolder(userId, uuidKey, null);
};

describe('Folder', () => {
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

  // Create a User before each test
  beforeEach(async () => {
    data = await setUsers();
  });

  describe('[POST] /folder', () => {
    describe('root folder', () => {
      it('should create a root folder', async () => {
        const response = await request(app.getHttpServer())
          .post('/folder/root')
          .set('x-gateway-secret', process.env.GATEWAY_SECRET as string)
          .set('x-uuid-key', data.user.uuid_key)
          .send();

        expect(response.status).toBe(201);
        expect(response.text).toBeDefined();
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
          .post(`/folder/${root.folder.folder_key}`)
          .set('x-gateway-secret', process.env.GATEWAY_SECRET as string)
          .set('x-uuid-key', data.user.uuid_key)
          .send({ folderName: 'test_folder' });

        expect(response.status).toBe(201);
        expect(response.text).toBeDefined();
      });
      it('should not create a sub folder if folderName is not given', async () => {
        const response = await request(app.getHttpServer())
          .post(`/folder/${root.folder.folder_key}`)
          .set('x-gateway-secret', process.env.GATEWAY_SECRET as string)
          .set('x-uuid-key', data.user.uuid_key)
          .send({});

        expect(response.status).toBe(400);
        expect(response.body.message).toBe(
          'Validation failed for $input.folderName',
        );
      });
      it('should not create a sub folder if folderName is empty', async () => {
        const response = await request(app.getHttpServer())
          .post(`/folder/${root.folder.folder_key}`)
          .set('x-gateway-secret', process.env.GATEWAY_SECRET as string)
          .set('x-uuid-key', data.user.uuid_key)
          .send({ folderName: '' });

        expect(response.status).toBe(400);
        expect(response.body.message).toBe(
          'Validation failed for $input.folderName',
        );
      });
      it('should not create a sub folder if folderName is too long', async () => {
        const response = await request(app.getHttpServer())
          .post(`/folder/${root.folder.folder_key}`)
          .set('x-gateway-secret', process.env.GATEWAY_SECRET as string)
          .set('x-uuid-key', data.user.uuid_key)
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
        await createFolder(data.user.id, 'test_folder', root.folder.id);
        const response = await request(app.getHttpServer())
          .post(`/folder/${root.folder.folder_key}`)
          .set('x-gateway-secret', process.env.GATEWAY_SECRET as string)
          .set('x-uuid-key', data.user.uuid_key)
          .send({ folderName: 'test_folder' });

        expect(response.status).toBe(409);
        expect(response.body.message).toBe('Folder already exists');
      });
      it('should not create a sub folder if user does not have role to create the folder', async () => {
        const response = await request(app.getHttpServer())
          .post(`/folder/${root.folder.folder_key}`)
          .set('x-gateway-secret', process.env.GATEWAY_SECRET as string)
          .set('x-uuid-key', data.altUser.uuid_key)
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
      subFolder = await createFolder(data.user.id, 'dummy1', root.folder.id);
      subFile = await createFile(
        data.user.id,
        BigInt(1),
        root.folder.id,
        'dummy1',
      );
    });
    it('should read a folder', async () => {
      const response = await request(app.getHttpServer())
        .get(`/folder/${root.folder.folder_key}`)
        .set('x-gateway-secret', process.env.GATEWAY_SECRET as string)
        .set('x-uuid-key', data.user.uuid_key)
        .send();

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('files');
      expect(response.body).toHaveProperty('folders');
      expect(response.body.folders).toEqual([
        {
          key: subFolder.folder.folder_key,
          name: 'dummy1',
        },
      ]);
      expect(response.body.files).toEqual([
        {
          key: subFile.file.file_key,
          name: 'dummy1',
          enabled: true,
        },
      ]);
    });
    it('should not read a folder if folderKey is wrong', async () => {
      const response = await request(app.getHttpServer())
        .get(`/folder/${uuidv4()}`)
        .set('x-gateway-secret', process.env.GATEWAY_SECRET as string)
        .set('x-uuid-key', data.user.uuid_key)
        .send();

      expect(response.body.message).toBe('Folder does not exist');
      expect(response.status).toBe(404);
    });
    it('should not read a folder if user does not have role to read the folder', async () => {
      const response = await request(app.getHttpServer())
        .get(`/folder/${root.folder.folder_key}`)
        .set('x-gateway-secret', process.env.GATEWAY_SECRET as string)
        .set('x-uuid-key', data.altUser.uuid_key)
        .send();

      expect(response.status).toBe(403);
      expect(response.body.message).toBe(
        'User does not have the required role',
      );
    });
  });

  describe('[GET] /folder/root', () => {
    let root: Awaited<ReturnType<typeof createRootFolder>>;
    let subFolder: Awaited<ReturnType<typeof createFolder>>;
    let subFile: Awaited<ReturnType<typeof createFile>>;
    beforeEach(async () => {
      if (!data.user) {
        throw new Error('User not found');
      }
      await postgresClient.query('DELETE FROM "cloud"."folders"');
      root = await createRootFolder(data.user.id, data.user.uuid_key);
      subFolder = await createFolder(data.user.id, 'dummy1', root.folder.id);
      subFile = await createFile(
        data.user.id,
        BigInt(1),
        root.folder.id,
        'dummy1',
      );
    });
    it('should read a root folder', async () => {
      const response = await request(app.getHttpServer())
        .get('/folder/root')
        .set('x-gateway-secret', process.env.GATEWAY_SECRET as string)
        .set('x-uuid-key', data.user.uuid_key)
        .send();

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('files');
      expect(response.body).toHaveProperty('folders');
      expect(response.body.folders).toEqual([
        {
          key: subFolder.folder.folder_key,
          name: 'dummy1',
        },
      ]);
      expect(response.body.files).toEqual([
        {
          key: subFile.file.file_key,
          name: 'dummy1',
          enabled: true,
        },
      ]);
    });

    describe('[GET] /folder/rootKey', () => {
      let root: Awaited<ReturnType<typeof createRootFolder>>;
      beforeEach(async () => {
        if (!data.user) {
          throw new Error('User not found');
        }
        await postgresClient.query('DELETE FROM "cloud"."folders"');
        root = await createRootFolder(data.user.id, data.user.uuid_key);
      });
      it('should get root folder key', async () => {
        const response = await request(app.getHttpServer())
          .get('/folder/rootKey')
          .set('x-gateway-secret', process.env.GATEWAY_SECRET as string)
          .set('x-uuid-key', data.user.uuid_key)
          .send();

        expect(response.status).toBe(200);
        expect(response.text).toBe(root.folder.folder_key);
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
          .set('x-gateway-secret', process.env.GATEWAY_SECRET as string)
          .set('x-uuid-key', data.user.uuid_key)
          .send();

        expect(response.status).toBe(200);
        expect(response.text).toBe('Folder deleted');
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
        subFolder1 = await createFolder(data.user.id, 'dummy1', root.folder.id);
        subFolder2 = await createFolder(data.user.id, 'dummy2', root.folder.id);
      });
      it('should move a folder', async () => {
        const response = await request(app.getHttpServer())
          .patch(`/folder/move/${subFolder1.folder.folder_key}`)
          .set('x-gateway-secret', process.env.GATEWAY_SECRET as string)
          .set('x-uuid-key', data.user.uuid_key)
          .query({ targetKey: subFolder2.folder.folder_key })
          .send();

        expect(response.status).toBe(200);
        expect(response.text).toBe('Folder moved');
      });
      it('should not move a folder if folderKey is wrong', async () => {
        const response = await request(app.getHttpServer())
          .patch(`/folder/move/${uuidv4()}`)
          .set('x-gateway-secret', process.env.GATEWAY_SECRET as string)
          .set('x-uuid-key', data.user.uuid_key)
          .query({ targetKey: subFolder2.folder.folder_key })
          .send();

        expect(response.status).toBe(404);
        expect(response.body.message).toBe('Folder does not exist');
      });
      it('should not move a folder if targetFolderKey is wrong', async () => {
        const response = await request(app.getHttpServer())
          .patch(`/folder/move/${subFolder1.folder.folder_key}`)
          .set('x-gateway-secret', process.env.GATEWAY_SECRET as string)
          .set('x-uuid-key', data.user.uuid_key)
          .query({ targetKey: uuidv4() })
          .send();

        expect(response.status).toBe(404);
        expect(response.body.message).toBe('Folder does not exist');
      });
      it('should not move a folder if user does not have role to move the folder', async () => {
        const response = await request(app.getHttpServer())
          .patch(`/folder/move/${subFolder1.folder.folder_key}`)
          .set('x-gateway-secret', process.env.GATEWAY_SECRET as string)
          .set('x-uuid-key', data.altUser.uuid_key)
          .query({ targetKey: subFolder2.folder.folder_key })
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
        subFolder = await createFolder(data.user.id, 'dummy1', root.folder.id);
      });

      it('should rename a folder', async () => {
        const response = await request(app.getHttpServer())
          .patch(`/folder/rename/${subFolder.folder.folder_key}`)
          .set('x-gateway-secret', process.env.GATEWAY_SECRET as string)
          .set('x-uuid-key', data.user.uuid_key)
          .send({ folderName: 'dummy2' });

        expect(response.status).toBe(200);
        expect(response.text).toBe('Folder renamed');
      });
      it('should not rename a folder if folderName is not given', async () => {
        const response = await request(app.getHttpServer())
          .patch(`/folder/rename/${subFolder.folder.folder_key}`)
          .set('x-gateway-secret', process.env.GATEWAY_SECRET as string)
          .set('x-uuid-key', data.user.uuid_key)
          .send({});

        expect(response.status).toBe(400);
        expect(response.body.message).toBe(
          'Validation failed for $input.folderName',
        );
      });
      it('should not rename a folder if folderName is empty', async () => {
        const response = await request(app.getHttpServer())
          .patch(`/folder/rename/${subFolder.folder.folder_key}`)
          .set('x-gateway-secret', process.env.GATEWAY_SECRET as string)
          .set('x-uuid-key', data.user.uuid_key)
          .send({ folderName: '' });

        expect(response.status).toBe(400);
        expect(response.body.message).toBe(
          'Validation failed for $input.folderName',
        );
      });
      it('should not rename a folder if folderName is too long', async () => {
        const response = await request(app.getHttpServer())
          .patch(`/folder/rename/${subFolder.folder.folder_key}`)
          .set('x-gateway-secret', process.env.GATEWAY_SECRET as string)
          .set('x-uuid-key', data.user.uuid_key)
          .send({ folderName: 'a'.repeat(300) });

        expect(response.status).toBe(400);
        expect(response.body.message).toBe(
          'Validation failed for $input.folderName',
        );
      });
      it('should not rename a folder if user does not have role to rename the folder', async () => {
        const response = await request(app.getHttpServer())
          .patch(`/folder/rename/${subFolder.folder.folder_key}`)
          .set('x-gateway-secret', process.env.GATEWAY_SECRET as string)
          .set('x-uuid-key', data.altUser.uuid_key)
          .send({ folderName: 'dummy2' });

        expect(response.status).toBe(403);
        expect(response.body.message).toBe(
          'User does not have the required role',
        );
      });
    });
  });
});
