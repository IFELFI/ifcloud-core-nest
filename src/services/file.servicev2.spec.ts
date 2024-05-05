import { file_info } from '.prisma/client';
import { PrismaClient, files, folders, temp_files } from '@prisma/client';
import { DeepMockProxy, mockDeep } from 'jest-mock-extended';
import { FileService } from './file.servicev2';
import { CheckRoleService } from './checkRole.service';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from './prisma.service';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import {
  BadRequestException,
  ConflictException,
  InternalServerErrorException,
  NotFoundException,
  UnsupportedMediaTypeException,
} from '@nestjs/common';

describe('FileService', () => {
  let service: FileService;
  let prismaService: DeepMockProxy<PrismaClient>;
  let checkRoleService: DeepMockProxy<CheckRoleService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FileService, PrismaService, CheckRoleService],
    })
      .overrideProvider(PrismaService)
      .useValue(mockDeep(PrismaClient))
      .overrideProvider(CheckRoleService)
      .useValue(mockDeep(CheckRoleService))
      .compile();

    service = module.get<FileService>(FileService);
    prismaService = module.get<DeepMockProxy<PrismaClient>>(PrismaService);
    checkRoleService =
      module.get<DeepMockProxy<CheckRoleService>>(CheckRoleService);
    prismaService.$transaction.mockImplementation((callback) =>
      callback(prismaService),
    );
  });

  // Test if the service is defined
  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('upload', () => {
    const userId = 1;
    const folderKey = uuidv4();
    const fileName = 'test.txt';
    const chunk = Buffer.from('test');
    const chunkNumber = 0;
    const totalChunks = 1;
    const targetFolder: folders = {
      id: BigInt(1),
      folder_name: 'test',
      parent_folder_id: null,
      folder_key: folderKey,
    };
    const targetFile: files = {
      id: BigInt(1),
      file_name: fileName,
      parent_folder_id: targetFolder.id,
      file_key: uuidv4(),
      enabled: true,
    };
    const tempFile: temp_files = {
      id: BigInt(1),
      temp_file_name: `${targetFolder.folder_key}_${fileName}`,
      uploader_id: userId,
      file_key: uuidv4(),
      total_chunks: totalChunks,
      create_date: new Date(),
    };

    beforeEach(() => {
      prismaService.folders.findUnique.mockResolvedValue(targetFolder);
      prismaService.files.findFirst.mockResolvedValueOnce(null);
      prismaService.temp_files.create.mockResolvedValue(tempFile);
      prismaService.temp_files.findUnique.mockResolvedValue(tempFile);
      prismaService.files.create.mockResolvedValue(targetFile);

      service['uploadChunk'] = jest.fn().mockResolvedValue(null);
      jest.spyOn(fs, 'existsSync').mockReturnValue(true);
      jest.spyOn(fs, 'statSync').mockReturnValue({ size: BigInt(4) } as any);
    });

    it('should upload file', async () => {
      const result = await service.upload(
        userId,
        folderKey,
        fileName,
        chunk,
        chunkNumber,
        totalChunks,
      );

      expect(result).toEqual({
        isDone: true,
        fileKey: targetFile.file_key,
      });
    });
    it('should upload file with chunk', async () => {
      const result = await service.upload(
        userId,
        folderKey,
        fileName,
        chunk,
        chunkNumber,
        totalChunks + 1,
      );

      expect(result).toEqual({
        isDone: false,
      });
    });
  });
});
