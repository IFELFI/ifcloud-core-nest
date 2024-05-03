import { TokenPayloadData } from './../src/interfaces/token.interface';
import {
  PostgreSqlContainer,
  StartedPostgreSqlContainer,
} from '@testcontainers/postgresql';
import { execSync } from 'child_process';
import { Client } from 'pg';
import { PrismaService } from 'src/services/prisma.service';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import {
  file_info,
  files,
  folder_info,
  folders,
  user_role,
  users,
} from '@prisma/client';

export interface TestTokenPayload {
  uuidKey: string;
  email: string;
  nickname: string;
  imageUrl: string;
}

let postgresContainer: StartedPostgreSqlContainer;
let postgresClient: Client;
let prismaService: PrismaService;
let testUserToken: string;
let expiredUserToken: string;
let testUserTokenPayload: TestTokenPayload;
let wrongUserTokenPayload: TestTokenPayload;
let wrongUserToken: string;

beforeAll(async () => {
  // Start a PostgreSQL container
  postgresContainer = await new PostgreSqlContainer().start();
  postgresClient = new Client({
    host: postgresContainer.getHost(),
    port: postgresContainer.getPort(),
    database: postgresContainer.getDatabase(),
    user: postgresContainer.getUsername(),
    password: postgresContainer.getPassword(),
  });
  await postgresClient.connect();
  const databaseUrl = `postgresql://${postgresClient.user}:${postgresClient.password}@${postgresClient.host}:${postgresClient.port}/${postgresClient.database}`;
  execSync(`npx prisma migrate dev`, {
    env: { ...process.env, DATABASE_URL: databaseUrl },
  });
  prismaService = new PrismaService({
    datasources: {
      db: {
        url: databaseUrl,
      },
    },
  });
  // Create a test user token
  if (!process.env.TOKEN_SECRET) {
    throw new Error('TOKEN_SECRET not set');
  }

  testUserTokenPayload = {
    uuidKey: uuidv4(),
    email: 'test@test.email',
    nickname: 'test',
    imageUrl: '',
  };

  testUserToken = jwt.sign(testUserTokenPayload, process.env.TOKEN_SECRET);
  expiredUserToken = jwt.sign(
    {
      uuidKey: uuidv4(),
      email: 'test@test.email',
      nickname: 'test',
      imageUrl: '',
    },
    process.env.TOKEN_SECRET,
    { expiresIn: '0s' },
  );
  wrongUserTokenPayload = {
    uuidKey: uuidv4(),
    email: 'test@test.email',
    nickname: 'test',
    imageUrl: '',
  };
  wrongUserToken = jwt.sign(wrongUserTokenPayload, process.env.TOKEN_SECRET);
});

afterAll(async () => {
  await prismaService.$disconnect();
  await postgresClient.end();
  await postgresContainer.stop();
});

afterEach(async () => {
  await postgresClient.query('DELETE FROM "cloud"."folders"');
  await postgresClient.query('DELETE FROM "cloud"."files"');
  await postgresClient.query('DELETE FROM "temp"."temp_files"');
  await postgresClient.query('DELETE FROM "member"."users"');
});

jest.setTimeout(10000);
export {
  testUserToken,
  testUserTokenPayload,
  expiredUserToken,
  wrongUserToken,
  wrongUserTokenPayload,
  prismaService,
  postgresClient,
  postgresContainer,
};

export const setupData = async (
  postgresClient: Client,
  createUser: boolean = true,
) => {
  const createTestUser = async (uuidKey: string) => {
    const user = await postgresClient.query<users, users[]>(
      `INSERT INTO "member"."users" (uuid_key) VALUES ('${uuidKey}') RETURNING *`,
    );
    return user.rows[0];
  };

  const uuidKey = uuidv4();

  let user: users | null = null;
  if (createUser) {
    user = await createTestUser(uuidKey);
  }

  const payload: TokenPayloadData = {
    uuidKey: uuidKey,
    email: 'test@ifelfi.com',
    nickname: 'test',
    imageUrl: null,
  };

  const createToken = (payload: TokenPayloadData) => {
    if (!process.env.TOKEN_SECRET) {
      throw new Error('TOKEN_SECRET not set');
    }
    return {
      normal: jwt.sign(payload, process.env.TOKEN_SECRET, {
        expiresIn: '1h',
        issuer: 'ifelfi.com',
      }),
      expired: jwt.sign(payload, process.env.TOKEN_SECRET, {
        expiresIn: '0s',
        issuer: 'ifelfi.com',
      }),
      wrongPayload: jwt.sign({ wrong: 'payload' }, process.env.TOKEN_SECRET, {
        expiresIn: '1h',
        issuer: 'ifelfi.com',
      }),
      wrongSecret: jwt.sign(payload, 'wrong secret', {
        expiresIn: '1h',
        issuer: 'ifelfi.com',
      }),
    };
  };

  const accessToken = createToken(payload);

  return {
    user,
    accessToken,
    createTestUser,
    createToken,
  };
};

export const createFolder = async (
  folderId: bigint,
  userId: number,
  folderName: string,
  parentFolderId: bigint | null,
) => {
  const folderKey = uuidv4();
  const folder = await postgresClient.query<folders, folders[]>(
    `INSERT INTO "cloud"."folders" (id, folder_key, folder_name, parent_folder_id) VALUES (${folderId}, '${folderKey}', '${folderName}', ${parentFolderId}) RETURNING *`,
  );
  const folderInfo = await postgresClient.query<folder_info, folder_info[]>(
    `INSERT INTO "cloud"."folder_info" (folder_id, owner_id) VALUES (${folderId}, ${userId}) RETURNING *`,
  );
  const userRole = await postgresClient.query<user_role, user_role[]>(
    `INSERT INTO "cloud"."user_role" (user_id, folder_id, role) VALUES (${userId}, ${folderId}, '{create,read,update,delete}') RETURNING *`,
  );
  return {
    folder: folder.rows[0],
    folderInfo: folderInfo.rows[0],
    userRole: userRole.rows[0],
  };
};

export const createFile = async (
  userId: number,
  fileId: bigint,
  parentFolderId: bigint,
  fileName: string,
  enabled: boolean = true,
  byteSize: number = 100,
) => {
  const fileKey = uuidv4();
  const file = await postgresClient.query<files, files[]>(
    `INSERT INTO "cloud"."files" (id, parent_folder_id, file_name, enabled, file_key) VALUES (${fileId}, ${parentFolderId}, '${fileName}', ${enabled}, '${fileKey}') RETURNING *`,
  );
  const fileInfo = await postgresClient.query<file_info, file_info[]>(
    `INSERT INTO "cloud"."file_info" (file_id, uploader_id, byte_size) VALUES (${fileId}, ${userId}, ${byteSize}) RETURNING *`,
  );
  return {
    file: file.rows[0],
    fileInfo: fileInfo.rows[0],
  };
};
