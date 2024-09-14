import { Test, TestingModule } from '@nestjs/testing';
import { file, file_type, PrismaClient } from '@prisma/client';
import { FileUpdateService } from './update.service';
import { PrismaService } from '../prisma.service';
import { DeepMockProxy, mockDeep } from 'jest-mock-extended';

describe('FileUpdateService', () => {
  let service: FileUpdateService;
  let prisma: DeepMockProxy<PrismaClient>;

  const file: file = {
    id: BigInt(1),
    file_key: '123e4567-e89b-12d3-a456-426614174000',
    type: file_type.container,
    file_name: 'folder',
    owner_id: 1,
  };
  const parent: file = {
    id: BigInt(2),
    file_key: '123e4567-e89b-12d3-a456-426614174001',
    type: file_type.container,
    file_name: 'folder',
    owner_id: 1,
  };

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
      const fileName = 'new_folder';
      prisma.file.update.mockResolvedValue({
        ...file,
        file_name: fileName,
      });

      const result = await service.updateFileName(file.file_key, fileName);

      expect(result).toEqual({ ...file, file_name: fileName });
    });
  });

  describe('updateFileParent', () => {
    it('should update file parent', async () => {
      prisma.file.findUniqueOrThrow.mockResolvedValue(parent);
      prisma.file.findUniqueOrThrow.mockResolvedValue(file);
      prisma.file_closure.update.mockResolvedValue({
        parent_id: parent.id,
        child_id: file.id,
      });

      const result = await service.updateFileParent(
        file.file_key,
        parent.file_key,
      );

      expect(result).toBeTruthy();
    });
  });
});
