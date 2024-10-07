import { PrismaClient } from '@prisma/client';
import { DeepMockProxy, mockDeep } from 'jest-mock-extended';
import { FileDeleteService } from './delete.service';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { SpecialContainerNameSchema } from '../../schemas/file.schema';
import mockValues from '../../../test/mockValues';

describe('FileDeleteService', () => {
  let service: FileDeleteService;
  let prisma: DeepMockProxy<PrismaClient>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FileDeleteService, PrismaService],
    })
      .overrideProvider(PrismaService)
      .useValue(mockDeep(PrismaClient))
      .compile();

    service = module.get<FileDeleteService>(FileDeleteService);
    prisma = module.get<DeepMockProxy<PrismaClient>>(PrismaService);
    prisma.$transaction.mockImplementation((cb) => cb(prisma));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('deleteFile', () => {
    it('should delete a file', async () => {
      prisma.file.delete.mockResolvedValue(mockValues.block);

      await service.deleteFile(mockValues.block.file_key);

      expect(prisma.file.delete).toHaveBeenCalledWith({
        where: {
          file_key: mockValues.block.file_key,
        },
      });
    });
  });

  describe('deleteTemporaryFile', () => {
    it('should delete a temporary file', async () => {
      prisma.temp_file.delete.mockResolvedValue(mockValues.tempFile);

      await service.deleteTemporaryFile(mockValues.tempFile.id);

      expect(prisma.temp_file.delete).toHaveBeenCalledWith({
        where: {
          id: mockValues.tempFile.id,
        },
      });
    });
  });

  describe('moveToTrash', () => {
    it('should move a file to trash', async () => {
      prisma.file.findMany.mockResolvedValue([mockValues.trash]);
      prisma.file.findUniqueOrThrow.mockResolvedValue(mockValues.block);
      prisma.file_closure.update.mockResolvedValue({
        parent_id: mockValues.trash.id,
        child_id: mockValues.block.id,
      });

      const result = await service.moveToTrash(
        mockValues.member.id,
        mockValues.block.file_key,
      );

      expect(result).toBe(true);
      expect(prisma.file.findMany).toHaveBeenCalledWith({
        where: {
          owner_id: mockValues.member.id,
          file_name: SpecialContainerNameSchema.enum.trash,
        },
      });
      expect(prisma.file.findUniqueOrThrow).toHaveBeenCalledWith({
        where: {
          file_key: mockValues.block.file_key,
        },
      });
      expect(prisma.file_closure.update).toHaveBeenCalledWith({
        where: {
          child_id: mockValues.block.id,
        },
        data: {
          parent_id: mockValues.trash.id,
        },
      });
    });
  });
});
