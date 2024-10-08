import { DeepMockProxy, mockDeep } from 'jest-mock-extended';
import { FileReadService } from './read.service';
import { file_type, PrismaClient } from '@prisma/client';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { SpecialContainerNameSchema } from '../../schemas/file.schema';
import mockValues from '../../../test/mockValues';

describe('FileReadService', () => {
  let service: FileReadService;
  let prisma: DeepMockProxy<PrismaClient>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FileReadService, PrismaService],
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
      prisma.file.findUniqueOrThrow.mockResolvedValue(mockValues.block);

      expect(await service.getFile(mockValues.block.file_key)).toBe(
        mockValues.block,
      );
      expect(prisma.file.findUniqueOrThrow).toHaveBeenCalledWith({
        where: {
          file_key: mockValues.block.file_key,
        },
      });
    });
  });

  describe('getFileInfo', () => {
    it('should return a file info', async () => {
      prisma.file_info.findUniqueOrThrow.mockResolvedValue(mockValues.fileInfo);

      expect(await service.getFileInfo(mockValues.block.id)).toBe(
        mockValues.fileInfo,
      );
      expect(prisma.file_info.findUniqueOrThrow).toHaveBeenCalledWith({
        where: {
          file_id: mockValues.block.id,
        },
      });
    });
  });

  describe('getFiles', () => {
    it('should return files', async () => {
      prisma.file.findMany.mockResolvedValue([
        mockValues.block,
        mockValues.container,
      ]);

      expect(await service.getFiles(mockValues.member.id)).toEqual([
        mockValues.block,
        mockValues.container,
      ]);
      expect(prisma.file.findMany).toHaveBeenCalledWith({
        where: {
          owner_id: mockValues.member.id,
        },
      });
    });
  });

  describe('getFilesByType', () => {
    it('should return files by type', async () => {
      prisma.file.findMany.mockResolvedValue([mockValues.block]);

      expect(
        await service.getFilesByType(mockValues.member.id, file_type.block),
      ).toEqual([mockValues.block]);
      expect(prisma.file.findMany).toHaveBeenCalledWith({
        where: {
          owner_id: mockValues.member.id,
          type: file_type.block,
        },
      });
    });
  });

  describe('getRootContainer', () => {
    it('should return a root file', async () => {
      prisma.file.findMany.mockResolvedValue([mockValues.root]);

      const result = await service.getRootContainer(mockValues.member.id);
      expect(result).toEqual({
        file_key: mockValues.root.file_key,
        file_name: mockValues.root.file_name,
        type: mockValues.root.type,
      });
      expect(prisma.file.findMany).toHaveBeenCalledWith({
        where: {
          owner_id: mockValues.member.id,
          file_name: SpecialContainerNameSchema.enum.root,
        },
        select: {
          file_key: true,
          file_name: true,
          type: true,
        },
      });
    });
  });
});
