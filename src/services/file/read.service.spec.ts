import { DeepMockProxy, mockDeep } from 'jest-mock-extended';
import { FileReadService } from './read.service';
import {
  file,
  file_closure,
  file_info,
  file_type,
  PrismaClient,
} from '@prisma/client';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma.service';
import { SpecialContainerNameSchema } from '../../../src/schemas/file.schema';
import { ConfigService } from '@nestjs/config';

describe('ReadService', () => {
  let service: FileReadService;
  let prisma: DeepMockProxy<PrismaClient>;

  const memberId = 1;
  const file: file = {
    id: BigInt(1),
    owner_id: memberId,
    file_key: '123e4567-e89b-12d3-a456-426614174000',
    file_name: 'file.txt',
    type: file_type.container,
  };
  const fileInfo: file_info = {
    file_id: file.id,
    create_date: new Date(),
    update_date: new Date(),
    byte_size: 100,
  };
  const fileClosure: file_closure = {
    ancestor_id: file.id,
    descendant_id: file.id,
    depth: 0,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FileReadService, PrismaService, ConfigService],
    })
      .overrideProvider(PrismaService)
      .useValue(mockDeep(PrismaClient))
      .compile();

    service = module.get<FileReadService>(FileReadService);
    prisma = module.get<DeepMockProxy<PrismaClient>>(PrismaService);
    prisma.$transaction.mockImplementation((cb) => cb(prisma));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getFile', () => {
    it('should return a file', async () => {
      prisma.file.findUniqueOrThrow.mockResolvedValue(file);

      expect(await service.getFile(file.file_key)).toBe(file);
      expect(prisma.file.findUniqueOrThrow).toHaveBeenCalledWith({
        where: {
          file_key: file.file_key,
        },
      });
    });
  });

  describe('getFileInfo', () => {
    it('should return a file info', async () => {
      prisma.file_info.findUniqueOrThrow.mockResolvedValue(fileInfo);

      expect(await service.getFileInfo(file.id)).toBe(fileInfo);
      expect(prisma.file_info.findUniqueOrThrow).toHaveBeenCalledWith({
        where: {
          file_id: file.id,
        },
      });
    });
  });

  describe('getFiles', () => {
    it('should return files', async () => {
      prisma.file.findMany.mockResolvedValue([file]);

      expect(await service.getFiles(memberId)).toEqual([file]);
      expect(prisma.file.findMany).toHaveBeenCalledWith({
        where: {
          owner_id: memberId,
        },
      });
    });
  });

  describe('getFilesByType', () => {
    it('should return files by type', async () => {
      prisma.file.findMany.mockResolvedValue([file]);

      expect(await service.getFilesByType(memberId, file.type)).toEqual([file]);
      expect(prisma.file.findMany).toHaveBeenCalledWith({
        where: {
          owner_id: memberId,
          type: file.type,
        },
      });
    });
  });

  describe('getRootFile', () => {
    it('should return a root file', async () => {
      prisma.file.findMany.mockResolvedValue([file]);

      expect(await service.getRootFile(memberId)).toBe(file);
      expect(prisma.file.findMany).toHaveBeenCalledWith({
        where: {
          owner_id: memberId,
          file_name: SpecialContainerNameSchema.enum.root,
        },
      });
    });
  });
});
