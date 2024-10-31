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
      prisma.file_path.findUniqueOrThrow.mockResolvedValue(
        mockValues.block.path,
      );
      prisma.$transaction.mockResolvedValue([
        mockValues.block.info,
        mockValues.block.path,
        mockValues.block.role,
      ]);

      const result = await service.generateBasicFileInfo(
        mockValues.member.id,
        mockValues.block.file.id,
        mockValues.container.file.id,
        mockValues.block.info.byte_size,
      );

      expect(result).toBeDefined();
    });
  });

  describe('createRootFile', () => {
    it('should create a root file', async () => {
      prisma.file.create.mockResolvedValue(mockValues.root.file);
      prisma.file_info.create.mockResolvedValue(mockValues.root.info);
      prisma.file_path.create.mockResolvedValue(mockValues.root.path);
      prisma.file_role.create.mockResolvedValue(mockValues.root.role);

      const result = await service.createRootFile(mockValues.member.id);

      expect(result).toEqual(mockValues.root.file);
    });
  });

  describe('createTemporaryFile', () => {
    it('should create a temporary file', async () => {
      prisma.temp_file.create.mockResolvedValue(mockValues.tempFile);

      const result = await service.createTemporaryFile(
        mockValues.member.id,
        mockValues.container.file.id,
        mockValues.tempFile.file_name,
        mockValues.tempFile.byte_size,
      );

      expect(result).toEqual(mockValues.tempFile);
    });
  });

  describe('createBlock', () => {
    it('should create a block file', async () => {
      prisma.file.create.mockResolvedValue(mockValues.block.file);
      service.generateBasicFileInfo = jest
        .fn()
        .mockResolvedValue([
          mockValues.block.info,
          mockValues.block.path,
          mockValues.block.role,
        ]);

      const result = await service.createBlock(
        mockValues.member.id,
        mockValues.container.file.id,
        mockValues.block.file.file_name,
        mockValues.block.info.byte_size,
      );

      expect(result).toEqual(mockValues.block.file);
    });
  });

  describe('createContainer', () => {
    it('should create a container file', async () => {
      prisma.file.create.mockResolvedValue(mockValues.container.file);
      service.generateBasicFileInfo = jest
        .fn()
        .mockResolvedValue([
          mockValues.container.info,
          mockValues.container.path,
          mockValues.container.role,
        ]);

      const result = await service.createContainer(
        mockValues.member.id,
        mockValues.home.file.id,
        mockValues.container.file.file_name,
      );

      expect(result).toEqual(mockValues.container.file);
    });
  });
});
