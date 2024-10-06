import { DeepMockProxy, mockDeep } from 'jest-mock-extended';
import { FileCreateService } from './create.service';
import {
  file,
  file_info,
  file_type,
  PrismaClient,
  temp_file,
} from '@prisma/client';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma.service';
import { TokenService } from '../storage/token.service';
import { RedisService } from '../storage/redis.service';
import { ConfigService } from '@nestjs/config';

describe('FileWriteService', () => {
  let service: FileCreateService;
  let prisma: DeepMockProxy<PrismaClient>;

  const memberId = 1;
  const parent: file = {
    id: BigInt(1),
    file_key: '123e4567-e89b-12d3-a456-426614174000',
    type: file_type.container,
    file_name: 'folder',
    owner_id: 1,
  };
  const file: file = {
    id: BigInt(2),
    file_key: '123e4567-e89b-12d3-a456-426614174001',
    type: file_type.block,
    file_name: 'file.txt',
    owner_id: 1,
  };
  const fileInfo: file_info = {
    file_id: file.id,
    create_date: new Date(),
    update_date: new Date(),
    byte_size: 1000,
  };
  const tempFile: temp_file = {
    id: BigInt(1),
    file_key: file.file_key,
    file_name: file.file_name,
    parent_id: parent.id,
    owner_id: memberId,
    byte_size: fileInfo.byte_size,
    create_date: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FileCreateService,
        TokenService,
        ConfigService,
        PrismaService,
        {
          provide: RedisService,
          useValue: mockDeep(RedisService),
        },
      ],
    })
      .overrideProvider(PrismaService)
      .useValue(mockDeep(PrismaClient))
      .compile();

    service = module.get<FileCreateService>(FileCreateService);
    prisma = module.get<DeepMockProxy<PrismaClient>>(PrismaService);
    prisma.$transaction.mockImplementation((cb) => cb(prisma));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('issueWriteToken', () => {
    it('should issue a write token', async () => {
      prisma.file.findUniqueOrThrow.mockResolvedValue(parent);
      prisma.temp_file.create.mockResolvedValue(tempFile);

      const result = await service.issueWriteToken(
        memberId,
        parent.file_key,
        file.file_key,
        tempFile.byte_size,
      );

      expect(result).toBeDefined();
    });
  });

  describe('createContainer', () => {
    it('should create a container file', async () => {
      prisma.file.create.mockResolvedValue(file);
      prisma.file_info.create.mockResolvedValue(fileInfo);
      prisma.file.findUniqueOrThrow.mockResolvedValue(parent);
      prisma.file_closure.create.mockResolvedValue({
        parent_id: parent.id,
        child_id: file.id,
      });

      const result = await service.createContainer(
        memberId,
        parent.file_key,
        file.file_name,
      );

      expect(result).toEqual(file);
    });
  });
});
