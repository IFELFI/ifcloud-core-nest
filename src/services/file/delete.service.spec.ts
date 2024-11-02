import { PrismaClient } from '@prisma/client';
import { DeepMockProxy, mockDeep } from 'jest-mock-extended';
import { FileDeleteService } from './delete.service';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import mockValues from '../../../test/mockValues';
import { StorageService } from '../storage/storage.service';

describe('FileDeleteService', () => {
  let service: FileDeleteService;
  let prisma: DeepMockProxy<PrismaClient>;
  //let storageService: StorageService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FileDeleteService,
        PrismaService,
        {
          provide: StorageService,
          useValue: {
            deleteFile: jest.fn(),
          },
        },
      ],
    })
      .overrideProvider(PrismaService)
      .useValue(mockDeep(PrismaClient))
      .compile();

    service = module.get<FileDeleteService>(FileDeleteService);
    prisma = module.get<DeepMockProxy<PrismaClient>>(PrismaService);
    //storageService = module.get<StorageService>(StorageService);
    prisma.$transaction.mockImplementation((cb) => cb(prisma));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
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
});
