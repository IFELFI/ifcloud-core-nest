import { Test, TestingModule } from '@nestjs/testing';
import { PrismaClient } from '@prisma/client';
import { FileUpdateService } from './update.service';
import { PrismaService } from '../prisma/prisma.service';
import { DeepMockProxy, mockDeep } from 'jest-mock-extended';
import mockValues from '../../../test/mockValues';

describe('FileUpdateService', () => {
  let service: FileUpdateService;
  let prisma: DeepMockProxy<PrismaClient>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FileUpdateService, PrismaService],
    })
      .overrideProvider(PrismaService)
      .useValue(mockDeep(PrismaClient))
      .compile();

    service = module.get<FileUpdateService>(FileUpdateService);
    prisma = module.get<DeepMockProxy<PrismaClient>>(PrismaService);
    prisma.$transaction.mockImplementation((cb) => cb(prisma));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('updateFileName', () => {
    it('should update file name', async () => {
      const newFileName = 'new_folder';
      prisma.file.update.mockResolvedValue({
        ...mockValues.block,
        file_name: newFileName,
      });

      const result = await service.updateFileName(
        mockValues.block.file_key,
        newFileName,
      );

      expect(result).toEqual({ ...mockValues.block, file_name: newFileName });
    });
  });

  describe('updateFileParent', () => {
    it('should update file parent', async () => {
      prisma.file.findUniqueOrThrow.mockResolvedValue(mockValues.container);
      prisma.file.findUniqueOrThrow.mockResolvedValue(mockValues.block);
      prisma.file_closure.update.mockResolvedValue({
        parent_id: mockValues.root.id,
        child_id: mockValues.block.id,
      });

      const result = await service.updateFileParent(
        mockValues.block.file_key,
        mockValues.root.file_key,
      );

      expect(result).toBeTruthy();
    });
  });
});
