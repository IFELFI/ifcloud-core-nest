import { DeepMockProxy, mockDeep } from 'jest-mock-extended';
import { FolderService } from './folder.service';
import {
  PrismaClient,
  external_access,
  files,
  folder_info,
  folders,
} from '@prisma/client';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from './prisma.service';
import {
  BadRequestException,
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';

describe('FolderService', () => {
  let service: FolderService;
  let prismaService: DeepMockProxy<PrismaClient>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FolderService, PrismaService],
    })
      .overrideProvider(PrismaService)
      .useValue(mockDeep(PrismaClient))
      .compile();

    service = module.get<FolderService>(FolderService);
    prismaService = module.get<DeepMockProxy<PrismaClient>>(PrismaService);
  });

  // Test if the service is defined
  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  /**
   * Success handling
   * Test if the service is successfully done
   */

  // Create folder success handling
  it('should create a folder', async () => {
    const folderName = 'test';
    const parentFolderId = BigInt(1);
    const parentFolderKey = uuidv4();
    const userId = 1;
    const parentFolder: folders = {
      id: parentFolderId,
      folder_name: 'test',
      parent_folder_id: null,
      folder_key: parentFolderKey,
    };
    const createFolder: folders = {
      id: BigInt(1),
      folder_name: folderName,
      parent_folder_id: parentFolderId,
      folder_key: parentFolderKey,
    };
    const createFolderInfo: folder_info = {
      id: BigInt(1),
      folder_id: createFolder.id,
      owner_id: userId,
      create_date: new Date(),
      update_date: new Date(),
    };
    const createExternalAccess: external_access = {
      id: BigInt(1),
      folder_id: createFolder.id,
      enabled: false,
      access_key_id: BigInt(1),
    };

    prismaService.$transaction.mockImplementation((callback) =>
      callback(prismaService),
    );
    prismaService.folders.findUnique.mockResolvedValue(parentFolder);
    prismaService.folders.create.mockResolvedValue(createFolder);
    prismaService.folder_info.create.mockResolvedValue(createFolderInfo);
    prismaService.external_access.create.mockResolvedValue(
      createExternalAccess,
    );
    expect(await service.create(folderName, parentFolderKey, userId)).toEqual({
      folderKey: createFolder.folder_key,
    });
  });

  // Delete folder success handling
  it('should delete a folder', async () => {
    const folderKey = uuidv4();
    const folder: folders = {
      id: BigInt(1),
      folder_name: 'test',
      parent_folder_id: null,
      folder_key: folderKey,
    };
    const folder_info: folder_info = {
      id: BigInt(1),
      folder_id: folder.id,
      owner_id: 1,
      create_date: new Date(),
      update_date: new Date(),
    };

    prismaService.$transaction.mockImplementation((callback) =>
      callback(prismaService),
    );
    prismaService.folders.findUnique.mockResolvedValue(folder);
    prismaService.folder_info.findUnique.mockResolvedValue(folder_info);
    prismaService.folders.delete.mockResolvedValue(folder);
    expect(await service.delete(folderKey)).toEqual(true);
  });

  // Read folder success handling
  it('should read a folder', async () => {
    const folderKey = uuidv4();
    const folder: folders = {
      id: BigInt(1),
      folder_name: 'test',
      parent_folder_id: null,
      folder_key: folderKey,
    };
    const findFolders: folders[] = [
      {
        id: BigInt(1),
        folder_name: 'test',
        parent_folder_id: folder.id,
        folder_key: uuidv4(),
      },
    ];
    const findFiles: files[] = [
      {
        id: BigInt(1),
        file_name: 'test',
        parent_folder_id: folder.id,
        file_key: uuidv4(),
        enabled: true,
      },
    ];
    prismaService.folders.findUnique.mockResolvedValue(folder);
    prismaService.folders.findMany.mockResolvedValue(findFolders);
    prismaService.files.findMany.mockResolvedValue(findFiles);
    expect(await service.read(folderKey)).toEqual({
      folders: findFolders.map((folder) => {
        return {
          folderKey: folder.folder_key,
          folderName: folder.folder_name,
        };
      }),
      files: findFiles.map((file) => {
        return {
          fileKey: file.file_key,
          fileName: file.file_name,
          enabled: file.enabled,
        };
      }),
    });
  });

  /**
   * Error handling
   * Test if the service is throwing an error
   */

  // Create folder error handling
  it('should throw an conflict error when creating a same folder', async () => {
    const folderName = 'test';
    const parentFolderKey = uuidv4();
    const userId = 1;
    prismaService.$transaction.mockImplementation((callback) =>
      callback(prismaService),
    );
    prismaService.folders.findUnique.mockResolvedValue({
      id: BigInt(1),
      folder_name: 'test',
      parent_folder_id: null,
      folder_key: parentFolderKey,
    });
    prismaService.folders.create.mockRejectedValue({ code: 'P2002' });
    await expect(
      service.create(folderName, parentFolderKey, userId),
    ).rejects.toThrow(ConflictException);
  });

  it('should throw an internal server error when creating a folder', async () => {
    const folderName = 'test';
    const parentFolderKey = uuidv4();
    const userId = 1;
    prismaService.$transaction.mockImplementation((callback) =>
      callback(prismaService),
    );
    prismaService.folders.findUnique.mockResolvedValue({
      id: BigInt(1),
      folder_name: 'test',
      parent_folder_id: null,
      folder_key: parentFolderKey,
    });
    prismaService.folders.create.mockRejectedValue({ code: 'P2003' });
    await expect(
      service.create(folderName, parentFolderKey, userId),
    ).rejects.toThrow(InternalServerErrorException);
  });

  // Delete folder error handling
  it('should throw an bad request error if folder is not exist when deleting a folder', async () => {
    const folderKey = uuidv4();
    prismaService.$transaction.mockImplementation((callback) =>
      callback(prismaService),
    );
    prismaService.folders.findUnique.mockResolvedValue(null);

    await expect(service.delete(folderKey)).rejects.toThrow(
      BadRequestException,
    );
  });

  it('should throw an bad request error if folder_info is not exist when deleting a folder', async () => {
    const folderKey = uuidv4();
    const folder: folders = {
      id: BigInt(1),
      folder_name: 'test',
      parent_folder_id: null,
      folder_key: folderKey,
    };
    prismaService.$transaction.mockImplementation((callback) =>
      callback(prismaService),
    );
    prismaService.folders.findUnique.mockResolvedValue(folder);
    prismaService.folder_info.findUnique.mockResolvedValue(null);

    await expect(service.delete(folderKey)).rejects.toThrow(
      BadRequestException,
    );
  });

  it('should throw an internal server error when deleting a folder', async () => {
    const folderKey = uuidv4();
    const folder: folders = {
      id: BigInt(1),
      folder_name: 'test',
      parent_folder_id: null,
      folder_key: folderKey,
    };
    const folder_info: folder_info = {
      id: BigInt(1),
      folder_id: folder.id,
      owner_id: 1,
      create_date: new Date(),
      update_date: new Date(),
    };
    prismaService.$transaction.mockImplementation((callback) =>
      callback(prismaService),
    );
    prismaService.folders.findUnique.mockResolvedValue(folder);
    prismaService.folder_info.findUnique.mockResolvedValue(folder_info);
    prismaService.folders.delete.mockRejectedValue({ code: 'P2003' });

    await expect(service.delete(folderKey)).rejects.toThrow(
      InternalServerErrorException,
    );
  });
});
