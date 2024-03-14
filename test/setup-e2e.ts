import {
  PostgreSqlContainer,
  StartedPostgreSqlContainer,
} from '@testcontainers/postgresql';
import { execSync } from 'child_process';
import { Client } from 'pg';
import { PrismaService } from 'src/services/prisma.service';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';

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
