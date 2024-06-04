import { INestApplication } from '@nestjs/common';
import {
  createFolder,
  createStreamVideoFile,
  postgresClient,
  prismaService,
  setupData,
} from './setup-e2e';
import { Test } from '@nestjs/testing';
import { PrismaService } from 'src/services/prisma.service';
import { AppModule } from 'src/app.module';
import { v4 as uuidv4 } from 'uuid';
import { TokenPayloadData } from 'src/interfaces/token.interface';
import request from 'supertest';

describe('Video', () => {
  let app: INestApplication;
  let data: Awaited<ReturnType<typeof setupData>>;
  let folderData: Awaited<ReturnType<typeof createFolder>>;
  let videoData: Awaited<ReturnType<typeof createStreamVideoFile>>;
  let altUser: Awaited<ReturnType<typeof data.createTestUser>>;
  let altUserToken: Awaited<ReturnType<typeof data.createToken>>;

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

  // Create Streaming Video for testing
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

    // Create Folder to upload video
    if (!data.user) {
      throw new Error('User not found');
    }
    folderData = await createFolder(
      BigInt(1),
      data.user.id,
      data.user.uuid_key,
      null,
    );

    // Create Streaming Video
    videoData = await createStreamVideoFile(
      data.user.id,
      BigInt(1),
      folderData.folder.id,
      'video.mp4',
    );
  });

  describe('[GET] /video/stream/:folderKey/:fileKey/master.m3u8', () => {
    it('should return master playlist', async () => {
      const response = await request(app.getHttpServer())
        .get(
          `/videos/stream/${folderData.folder.folder_key}/${videoData.file.file_key}/master.m3u8`,
        )
        .set('Authorization', `Bearer ${data.accessToken.normal}`);

      expect(response.status).toBe(200);
    });
    it('should return 401 if no token', async () => {
      const response = await request(app.getHttpServer()).get(
        `/videos/stream/${folderData.folder.folder_key}/${videoData.file.file_key}/master.m3u8`,
      );

      expect(response.status).toBe(401);
    });
    it('should return 403 if not owner', async () => {
      const response = await request(app.getHttpServer())
        .get(
          `/videos/stream/${folderData.folder.folder_key}/${videoData.file.file_key}/master.m3u8`,
        )
        .set('Authorization', `Bearer ${altUserToken.normal}`);

      expect(response.status).toBe(403);
    });
  });
});
