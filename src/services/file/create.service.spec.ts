import { DeepMockProxy, mockDeep } from 'jest-mock-extended';
import { FileCreateService } from './create.service';
import { PrismaClient } from '@prisma/client';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import mockValues from '../../../test/mockValues';

describe('FileWriteService', () => {
  let service: FileCreateService;
  let prisma: DeepMockProxy<PrismaClient>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FileCreateService, PrismaService],
    })
      .overrideProvider(PrismaService)
      .useValue(mockDeep(PrismaClient))
      .compile();

    service = module.get<FileCreateService>(FileCreateService);
    prisma = module.get<DeepMockProxy<PrismaClient>>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateBasicFileInfo', () => {
    it('should issue a write token', async () => {
      prisma.$transaction.mockResolvedValue([
        mockValues.fileInfo,
        mockValues.fileClosure,
        mockValues.fileRole,
      ]);

      const result = await service.generateBasicFileInfo(
        mockValues.member.id,
        mockValues.block.id,
        mockValues.container.id,
        mockValues.fileInfo.byte_size,
      );

      expect(result).toBeDefined();
    });
  });

  describe('createRootFile', () => {
    it('should create a root file', async () => {
      prisma.file.create.mockResolvedValue(mockValues.block);
      service.generateBasicFileInfo = jest
        .fn()
        .mockResolvedValue([
          mockValues.fileInfo,
          mockValues.fileClosure,
          mockValues.fileRole,
        ]);

      const result = await service.createRootFile(mockValues.member.id);

      expect(result).toEqual(mockValues.block);
    });
  });

  describe('createTemporaryFile', () => {
    it('should create a temporary file', async () => {
      prisma.temp_file.create.mockResolvedValue(mockValues.tempFile);

      const result = await service.createTemporaryFile(
        mockValues.member.id,
        mockValues.container.id,
        mockValues.tempFile.file_name,
        mockValues.tempFile.byte_size,
      );

      expect(result).toEqual(mockValues.tempFile);
    });
  });

  describe('createBlock', () => {
    it('should create a block file', async () => {
      prisma.file.create.mockResolvedValue(mockValues.block);
      service.generateBasicFileInfo = jest
        .fn()
        .mockResolvedValue([
          mockValues.fileInfo,
          mockValues.fileClosure,
          mockValues.fileRole,
        ]);

      const result = await service.createBlock(
        mockValues.member.id,
        mockValues.container.id,
        mockValues.block.file_name,
        mockValues.fileInfo.byte_size,
      );

      expect(result).toEqual(mockValues.block);
    });
  });

  describe('createContainer', () => {
    it('should create a container file', async () => {
      prisma.file.create.mockResolvedValue(mockValues.block);
      service.generateBasicFileInfo = jest
        .fn()
        .mockResolvedValue([
          mockValues.fileInfo,
          mockValues.fileClosure,
          mockValues.fileRole,
        ]);

      const result = await service.createContainer(
        mockValues.member.id,
        mockValues.container.id,
        mockValues.block.file_name,
      );

      expect(result).toEqual(mockValues.block);
    });
  });
});
