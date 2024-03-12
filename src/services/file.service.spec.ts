import { file_info } from './../../node_modules/.prisma/client/index.d';
import { PrismaClient, files, folders, temp_files } from '@prisma/client';
import { DeepMockProxy, mockDeep } from 'jest-mock-extended';
import { FileService } from './file.service';
import { CheckRoleService } from './checkRole.service';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from './prisma.service';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import {
  ConflictException,
  ForbiddenException,
  InternalServerErrorException,
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
  });

  // Test if the service is defined
  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  /**
   * Success handling
   * Test if the service is successfully done
   */

  // Merge chunks success handling
  it('should merge chunks', async () => {
    const fileName = 'test.txt';
    const totalChunks = 1;
    const fsCreateWriteStream = jest
      .spyOn(fs, 'createWriteStream')
      .mockReturnValue({
        write: jest.fn(),
        end: jest.fn(),
      } as any);
    const fsPromisesReadFile = jest
      .spyOn(fs.promises, 'readFile')
      .mockResolvedValue(Buffer.from('test'));
    const fsUnlinkSync = jest.spyOn(fs, 'unlinkSync').mockReturnValue();

    await service['mergeChunks'](fileName, totalChunks);

    expect(fsCreateWriteStream).toHaveBeenCalled();
    expect(fsPromisesReadFile).toHaveBeenCalled();
    expect(fsUnlinkSync).toHaveBeenCalled();
  });

  // Upload chunk success handling
  it('should upload chunk', async () => {
    const chunk = Buffer.from('test');
    const chunkNumber = 0;
    const totalChunks = 1;
    const fileName = 'test.txt';
    const fsExistsSync = jest.spyOn(fs, 'existsSync').mockReturnValue(false);
    const fsMkdirSync = jest.spyOn(fs, 'mkdirSync').mockReturnValue(undefined);
    jest.spyOn(fs.promises, 'writeFile').mockResolvedValue();

    const result = await service['uploadChunk'](
      chunk,
      chunkNumber,
      totalChunks,
      fileName,
    );

    expect(result).toBe(true);
    expect(fsExistsSync).toHaveBeenCalled();
    expect(fsMkdirSync).toHaveBeenCalled();
  });

  // Upload file success handling
  it('should upload file', async () => {
    const userId = 1;
    const parentFolderKey = uuidv4();
    const chunk = Buffer.from('test');
    const chunkNumber = 0;
    const totalChunks = 1;
    const fileName = 'test.txt';
    const fsExistsSync = jest.spyOn(fs, 'existsSync').mockReturnValue(false);
    const fsMkdirSync = jest.spyOn(fs, 'mkdirSync').mockReturnValue(undefined);
    jest.spyOn(fs.promises, 'writeFile').mockResolvedValue();

    const parentFolder: folders = {
      id: BigInt(1),
      folder_name: 'test',
      parent_folder_id: null,
      folder_key: parentFolderKey,
    };

    const tempFile: temp_files = {
      id: BigInt(1),
      temp_file_name: fileName,
      uploader_id: userId,
      file_key: uuidv4(),
      total_chunks: totalChunks,
      create_date: new Date(),
    };

    const file: files = {
      id: BigInt(1),
      file_name: fileName,
      parent_folder_id: parentFolder.id,
      file_key: tempFile.file_key,
      enabled: true,
    };

    const fileInfo: file_info = {
      id: BigInt(1),
      file_id: file.id,
      uploader_id: userId,
      create_date: new Date(),
      update_date: new Date(),
      byte_size: 4,
    };

    // Temp file created
    prismaService.folders.findUnique.mockResolvedValue(parentFolder);
    checkRoleService.checkRole.mockResolvedValue(true);
    prismaService.files.findFirst.mockResolvedValue(null);
    prismaService.temp_files.create.mockResolvedValue(tempFile);
    service['uploadChunk'] = jest.fn().mockResolvedValue(true);

    // After chunk merged and received true from uploadChunk
    prismaService.$transaction.mockImplementation((callback) =>
      callback(prismaService),
    );
    prismaService.temp_files.findUnique.mockResolvedValue(tempFile);
    prismaService.files.create.mockResolvedValue(file);
    const fsStatSync = jest
      .spyOn(fs, 'statSync')
      .mockReturnValue({ size: BigInt(4) } as any);
    prismaService.file_info.create.mockResolvedValue(fileInfo);

    const result = await service.uploadFile(
      userId,
      parentFolderKey,
      fileName,
      chunk,
      chunkNumber,
      totalChunks,
    );

    expect(result).toEqual({
      isDone: true,
      fileKey: file.file_key,
    });
    expect(fsStatSync).toHaveBeenCalled();
    expect(fsExistsSync).toHaveBeenCalled();
    expect(fsMkdirSync).toHaveBeenCalled();
  });

  /**
   * Failure handling
   * Test if the service is failed
   */

  // Merge chunks failure handling
  it('should throw error when merge chunks', async () => {
    const fileName = 'test.txt';
    const totalChunks = 1;
    const fsCreateWriteStream = jest
      .spyOn(fs, 'createWriteStream')
      .mockReturnValue({
        write: jest.fn(),
        end: jest.fn(),
      } as any);
    const fsPromisesReadFile = jest
      .spyOn(fs.promises, 'readFile')
      .mockRejectedValue(new Error('error'));
    jest.spyOn(fs, 'unlinkSync').mockReturnValue();

    await expect(service['mergeChunks'](fileName, totalChunks)).rejects.toThrow(
      'error',
    );
    expect(fsCreateWriteStream).toHaveBeenCalled();
    expect(fsPromisesReadFile).toHaveBeenCalled();
  });

  // Upload chunk failure handling
  it('should throw error when upload chunk', async () => {
    const chunk = Buffer.from('test');
    const chunkNumber = 0;
    const totalChunks = 1;
    const fileName = 'test.txt';
    const fsExistsSync = jest.spyOn(fs, 'existsSync').mockReturnValue(false);
    const fsMkdirSync = jest.spyOn(fs, 'mkdirSync').mockReturnValue(undefined);
    jest.spyOn(fs.promises, 'writeFile').mockRejectedValue(new Error('error'));

    await expect(
      service['uploadChunk'](chunk, chunkNumber, totalChunks, fileName),
    ).rejects.toThrow('error');
    expect(fsExistsSync).toHaveBeenCalled();
    expect(fsMkdirSync).toHaveBeenCalled();
  });

  it('should throw error when upload chunk but failed to merge chunks', async () => {
    const chunk = Buffer.from('test');
    const chunkNumber = 0;
    const totalChunks = 1;
    const fileName = 'test.txt';
    const fsExistsSync = jest.spyOn(fs, 'existsSync').mockReturnValue(false);
    const fsMkdirSync = jest.spyOn(fs, 'mkdirSync').mockReturnValue(undefined);
    jest.spyOn(fs.promises, 'writeFile').mockResolvedValue();

    const fsUnlinkSync = jest.spyOn(fs, 'unlinkSync').mockReturnValue();

    service['mergeChunks'] = jest.fn().mockRejectedValue(new Error('error'));

    await expect(
      service['uploadChunk'](chunk, chunkNumber, totalChunks, fileName),
    ).rejects.toThrow(InternalServerErrorException);
    expect(fsExistsSync).toHaveBeenCalled();
    expect(fsMkdirSync).toHaveBeenCalled();
    expect(fsUnlinkSync).toHaveBeenCalled();
  });

  // Upload file failure handling
  it('should throw error when upload file but failed to create temp file', async () => {
    const userId = 1;
    const parentFolderKey = uuidv4();
    const chunk = Buffer.from('test');
    const chunkNumber = 0;
    const totalChunks = 1;
    const fileName = 'test.txt';

    prismaService.folders.findUnique.mockResolvedValue({
      id: BigInt(1),
      folder_name: 'test',
      parent_folder_id: null,
      folder_key: parentFolderKey,
    });
    checkRoleService.checkRole.mockResolvedValue(true);
    prismaService.temp_files.create.mockRejectedValue({ code: 'P2002' });

    await expect(
      service.uploadFile(
        userId,
        parentFolderKey,
        fileName,
        chunk,
        chunkNumber,
        totalChunks,
      ),
    ).rejects.toThrow(ConflictException);
  });

  it('should throw error when upload file but failed to create file', async () => {
    const userId = 1;
    const parentFolderKey = uuidv4();
    const chunk = Buffer.from('test');
    const chunkNumber = 0;
    const totalChunks = 1;
    const fileName = 'test.txt';

    prismaService.folders.findUnique.mockResolvedValue({
      id: BigInt(1),
      folder_name: 'test',
      parent_folder_id: null,
      folder_key: parentFolderKey,
    });
    checkRoleService.checkRole.mockResolvedValue(true);
    prismaService.files.findFirst.mockResolvedValue(null);
    prismaService.temp_files.create.mockResolvedValue({
      id: BigInt(1),
      temp_file_name: fileName,
      uploader_id: userId,
      file_key: uuidv4(),
      total_chunks: totalChunks,
      create_date: new Date(),
    });
    service['uploadChunk'] = jest.fn().mockResolvedValue(true);

    prismaService.$transaction.mockImplementation((callback) =>
      callback(prismaService),
    );
    prismaService.temp_files.findUnique.mockResolvedValue({
      id: BigInt(1),
      temp_file_name: fileName,
      uploader_id: userId,
      file_key: uuidv4(),
      total_chunks: totalChunks,
      create_date: new Date(),
    });
    prismaService.files.create.mockRejectedValue({ code: 'P2002' });

    await expect(
      service.uploadFile(
        userId,
        parentFolderKey,
        fileName,
        chunk,
        chunkNumber,
        totalChunks,
      ),
    ).rejects.toThrow(InternalServerErrorException);
  });

  it('should throw error when upload file but has no role to upload a file', async () => {
    const userId = 1;
    const parentFolderKey = uuidv4();
    const chunk = Buffer.from('test');
    const chunkNumber = 0;
    const totalChunks = 1;
    const fileName = 'test.txt';

    prismaService.folders.findUnique.mockResolvedValue({
      id: BigInt(1),
      folder_name: 'test',
      parent_folder_id: null,
      folder_key: parentFolderKey,
    });
    checkRoleService.checkRole.mockResolvedValue(false);

    await expect(
      service.uploadFile(
        userId,
        parentFolderKey,
        fileName,
        chunk,
        chunkNumber,
        totalChunks,
      ),
    ).rejects.toThrow(ForbiddenException);
  });
});
