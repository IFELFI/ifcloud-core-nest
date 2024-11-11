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
      prisma.file.findUniqueOrThrow.mockResolvedValue(mockValues.block.file);

      expect(await service.getFile(mockValues.block.file.file_key)).toBe(
        mockValues.block.file,
      );
      expect(prisma.file.findUniqueOrThrow).toHaveBeenCalledWith({
        where: {
          file_key: mockValues.block.file.file_key,
        },
      });
    });
  });

  describe('getFileInfo', () => {
    it('should return a file info', async () => {
      prisma.file_info.findUniqueOrThrow.mockResolvedValue(
        mockValues.block.info,
      );

      expect(await service.getFileInfo(mockValues.block.file.id)).toBe(
        mockValues.block.info,
      );
      expect(prisma.file_info.findUniqueOrThrow).toHaveBeenCalledWith({
        where: {
          file_id: mockValues.block.file.id,
        },
      });
    });
  });

  describe('getFiles', () => {
    it('should return files', async () => {
      prisma.file.findMany.mockResolvedValue([
        mockValues.root.file,
        mockValues.home.file,
        mockValues.container.file,
        mockValues.block.file,
      ]);

      expect(await service.getFiles(mockValues.member.id)).toEqual([
        mockValues.root.file,
        mockValues.home.file,
        mockValues.container.file,
        mockValues.block.file,
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
      prisma.file.findMany.mockResolvedValue([mockValues.block.file]);

      expect(
        await service.getFilesByType(mockValues.member.id, file_type.block),
      ).toEqual([mockValues.block.file]);
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
      prisma.file.findMany.mockResolvedValue([mockValues.root.file]);

      const result = await service.getRootContainer(mockValues.member.id);
      expect(result).toEqual(mockValues.root.file);
      expect(prisma.file.findMany).toHaveBeenCalledWith({
        where: {
          owner_id: mockValues.member.id,
          file_name: SpecialContainerNameSchema.enum.root,
          file_path: {
            path: {
              equals: [],
            },
          },
        },
      });
    });
  });

  describe('getHomeContainer', () => {
    it('should return a home file', async () => {
      service.getRootContainer = jest
        .fn()
        .mockResolvedValue(mockValues.root.file);
      prisma.file.findMany.mockResolvedValue([mockValues.home.file]);

      const result = await service.getHomeContainer(mockValues.member.id);
      expect(result).toEqual(mockValues.home.file);
      expect(prisma.file.findMany).toHaveBeenCalledWith({
        where: {
          owner_id: mockValues.member.id,
          file_name: SpecialContainerNameSchema.enum.home,
          file_path: {
            path: {
              equals: [mockValues.root.file.id],
            },
          },
        },
      });
    });
  });

  describe('getSpecialContainer', () => {
    it('should return a special file', async () => {
      prisma.file.findMany.mockResolvedValueOnce([mockValues.root.file]);
      prisma.file.findMany.mockResolvedValueOnce([mockValues.home.file]);

      const result = await service.getSpecialContainer(
        mockValues.member.id,
        SpecialContainerNameSchema.enum.home,
      );
      expect(result).toEqual(mockValues.home.file);
      expect(prisma.file.findMany).toHaveBeenLastCalledWith({
        where: {
          owner_id: mockValues.member.id,
          file_name: SpecialContainerNameSchema.enum.home,
          file_path: {
            path: {
              equals: [mockValues.root.file.id],
            },
          },
        },
      });
    });
  });

  describe('getParentFile', () => {
    it('should return files by parent', async () => {
      prisma.file_path.findUniqueOrThrow.mockResolvedValue(
        mockValues.block.path,
      );
      prisma.file.findUniqueOrThrow.mockResolvedValue(
        mockValues.container.file,
      );

      expect(await service.getParentFile(mockValues.block.file.id)).toEqual(
        mockValues.container.file,
      );
    });
  });

  describe('getChildrenFiles', () => {
    it('should return children files', async () => {
      prisma.file_path.findUniqueOrThrow.mockResolvedValue(
        mockValues.container.path,
      );
      prisma.file.findMany.mockResolvedValue([mockValues.block.file]);

      expect(await service.getChildFiles(mockValues.container.file.id)).toEqual(
        [mockValues.block.file],
      );
      expect(prisma.file.findMany).toHaveBeenCalledWith({
        where: {
          file_path: {
            path: {
              equals: [
                ...mockValues.container.path.path,
                mockValues.container.file.id,
              ],
            },
          },
        },
      });
    });
  });
});
