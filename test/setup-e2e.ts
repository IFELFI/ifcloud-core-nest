import {
  PostgreSqlContainer,
  StartedPostgreSqlContainer,
} from '@testcontainers/postgresql';
import { execSync } from 'child_process';
import { Client } from 'pg';
import { PrismaService } from 'src/services/prisma.service';
import { v4 as uuidv4 } from 'uuid';
import {
  file_info,
  files,
  folder_info,
  folders,
  user_role,
  users,
} from '@prisma/client';
import path from 'path';
import fs from 'fs';

export interface TestTokenPayload {
  uuidKey: string;
  email: string;
  nickname: string;
  imageUrl: string;
}

export const baseDir = process.env.BASE_STORAGE_PATH || 'testStorage';

let postgresContainer: StartedPostgreSqlContainer;
let postgresClient: Client;
let prismaService: PrismaService;

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
  execSync(`npx prisma migrate dev --name 0_init`, {
    env: { ...process.env, DATABASE_URL: databaseUrl },
  });
  prismaService = new PrismaService({
    datasources: {
      db: {
        url: databaseUrl,
      },
    },
  });
});

afterAll(async () => {
  await prismaService.$disconnect();
  await postgresClient.end();
  await postgresContainer.stop();
  await fs.promises.rm(baseDir, { recursive: true });
});

afterEach(async () => {
  await postgresClient.query('DELETE FROM "cloud"."folders"');
  await postgresClient.query('DELETE FROM "cloud"."files"');
  await postgresClient.query('DELETE FROM "temp"."temp_files"');
  await postgresClient.query('DELETE FROM "member"."users"');
});

jest.setTimeout(10000);
export { prismaService, postgresClient, postgresContainer };

export const setUsers = async () => {
  const createTestUser = async (uuidKey: string) => {
    const user = await postgresClient.query<users, users[]>(
      `INSERT INTO "member"."users" (uuid_key) VALUES ('${uuidKey}') RETURNING *`,
    );
    return user.rows[0];
  };

  let user: users | null = null;
  let altUser: users | null = null;

  user = await createTestUser(uuidv4());
  altUser = await createTestUser(uuidv4());

  if (!user || !altUser) {
    throw new Error('User not created');
  }

  return {
    user,
    altUser,
  };
};

export const createFolder = async (
  userId: number,
  folderName: string,
  parentFolderId: bigint | null,
) => {
  const folderKey = uuidv4();
  const folder = await postgresClient.query<folders, folders[]>(
    `INSERT INTO "cloud"."folders" (folder_key, folder_name, parent_folder_id) VALUES ('${folderKey}', '${folderName}', ${parentFolderId}) RETURNING *`,
  );
  const folderInfo = await postgresClient.query<folder_info, folder_info[]>(
    `INSERT INTO "cloud"."folder_info" (folder_id, owner_id) VALUES (${folder.rows[0].id}, ${userId}) RETURNING *`,
  );
  const userRole = await postgresClient.query<user_role, user_role[]>(
    `INSERT INTO "cloud"."user_role" (user_id, folder_id, role) VALUES (${userId}, ${folder.rows[0].id}, '{create,read,update,delete}') RETURNING *`,
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
  fileBuffer: Buffer | null = null,
) => {
  const fileKey = uuidv4();
  const file = await postgresClient.query<files, files[]>(
    `INSERT INTO "cloud"."files" (id, parent_folder_id, file_name, enabled, file_key) VALUES (${fileId}, ${parentFolderId}, '${fileName}', ${enabled}, '${fileKey}') RETURNING *`,
  );
  const fileInfo = await postgresClient.query<file_info, file_info[]>(
    `INSERT INTO "cloud"."file_info" (file_id, uploader_id, byte_size) VALUES (${fileId}, ${userId}, ${byteSize}) RETURNING *`,
  );
  if (fileBuffer) {
    const extName = path.extname(fileName);
    if (!fs.existsSync(baseDir)) {
      fs.mkdirSync(baseDir);
    }
    fs.mkdirSync(`${baseDir}/${fileKey}`);
    await fs.promises.writeFile(
      `${baseDir}/origin/${fileKey}${extName}`,
      fileBuffer,
    );
  }
  if (!file.rows[0] || !fileInfo.rows[0]) {
    throw new Error('File not created');
  }
  return {
    file: file.rows[0],
    fileInfo: fileInfo.rows[0],
  };
};

export const createStreamVideoFile = async (
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
  const baseDir = process.env.BASE_STORAGE_PATH || 'storage';
  if (!fs.existsSync(baseDir)) {
    fs.mkdirSync(baseDir);
  }
  fs.cpSync(`${__dirname}/sample/video`, `${baseDir}/video/${fileKey}`, {
    recursive: true,
  });
  return {
    file: file.rows[0],
    fileInfo: fileInfo.rows[0],
    path: `${baseDir}/video/${fileKey}`,
  };
};

export const gatewayKeyName = process.env.GATEWAY_KEY_NAME as string;
export const uuidKeyName = process.env.UUID_KEY_NAME as string;
