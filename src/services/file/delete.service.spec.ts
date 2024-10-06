import { file, file_type, PrismaClient } from '@prisma/client';
import { DeepMockProxy, mockDeep } from 'jest-mock-extended';
import { FileDeleteService } from './delete.service';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { SpecialContainerNameSchema } from '../../schemas/file.schema';

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
      const fileKey = '123e4567-e89b-12d3-a456-426614174000';

      await service.deleteFile(fileKey);

      expect(prisma.file.delete).toHaveBeenCalledWith({
        where: {
          file_key: fileKey,
        },
      });
    });
  });

  describe('moveToTrash', () => {
    const trashContainer: file = {
      id: BigInt(1),
      owner_id: 1,
      type: file_type.container,
      file_key: '12334567-e89b-12d3-a456-426614174000',
      file_name: SpecialContainerNameSchema.enum.trash,
    };
    const targetFile: file = {
      id: BigInt(2),
      owner_id: 1,
      type: file_type.block,
      file_key: '123e4567-e89b-12d3-a456-426614174000',
      file_name: 'file.txt',
    };
    it('should move a file to trash', async () => {
      const memberId = 1;

      prisma.file.findMany.mockResolvedValue([trashContainer]);
      prisma.file.findUniqueOrThrow.mockResolvedValue(targetFile);
      prisma.file_closure.update.mockResolvedValue({
        parent_id: trashContainer.id,
        child_id: BigInt(2),
      });

      await service.moveToTrash(memberId, targetFile.file_key);

      expect(prisma.file.findMany).toHaveBeenCalledWith({
        where: {
          owner_id: memberId,
          file_name: SpecialContainerNameSchema.enum.trash,
        },
      });
      expect(prisma.file.findUniqueOrThrow).toHaveBeenCalledWith({
        where: {
          file_key: targetFile.file_key,
        },
      });
      expect(prisma.file_closure.update).toHaveBeenCalledWith({
        where: {
          parent_id_child_id: {
            parent_id: trashContainer.id,
            child_id: targetFile.id,
          },
        },
        data: {
          parent_id: trashContainer.id,
        },
      });
    });
  });
});
