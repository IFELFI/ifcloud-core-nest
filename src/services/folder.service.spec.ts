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
  NotFoundException,
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

  describe('create', () => {
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
      expect(await service.create(folderName, parentFolderKey, userId)).toEqual(
        {
          folderKey: createFolder.folder_key,
        },
      );
    });

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
  });

  describe('delete', () => {
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

  describe('read', () => {
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
      prismaService.folders.findMany.mockResolvedValue(findFolders);
      prismaService.files.findMany.mockResolvedValue(findFiles);
      expect(await service['read'](folder.id)).toEqual({
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
  });

  describe('updateParent', () => {
    it('should update a folder parent', async () => {
      const folderKey = uuidv4();
      const parentFolderKey = uuidv4();
      const folder: folders = {
        id: BigInt(1),
        folder_name: 'test',
        parent_folder_id: BigInt(2),
        folder_key: folderKey,
      };
      const parentFolder: folders = {
        id: BigInt(3),
        folder_name: 'test',
        parent_folder_id: BigInt(4),
        folder_key: parentFolderKey,
      };
      const updateFolder: folders = {
        id: BigInt(1),
        folder_name: 'test',
        parent_folder_id: parentFolder.id,
        folder_key: folderKey,
      };
      prismaService.$transaction.mockImplementation((callback) =>
        callback(prismaService),
      );
      prismaService.folders.findUnique
        .mockResolvedValueOnce(folder)
        .mockResolvedValueOnce(parentFolder);
      prismaService.folders.update.mockResolvedValue(updateFolder);

      expect(await service.updateParent(folderKey, parentFolderKey)).toEqual(
        true,
      );
    });

    it('should throw an not found error if target folder is not exist when updating a folder parent', async () => {
      const folderKey = uuidv4();
      const parentFolderKey = uuidv4();
      prismaService.$transaction.mockImplementation((callback) =>
        callback(prismaService),
      );
      prismaService.folders.findUnique.mockResolvedValue(null);

      await expect(
        service.updateParent(folderKey, parentFolderKey),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw an not found error if parent folder is not exist when updating a folder parent', async () => {
      const folderKey = uuidv4();
      const parentFolderKey = uuidv4();
      const folder: folders = {
        id: BigInt(1),
        folder_name: 'test',
        parent_folder_id: BigInt(2),
        folder_key: folderKey,
      };
      prismaService.$transaction.mockImplementation((callback) =>
        callback(prismaService),
      );
      prismaService.folders.findUnique
        .mockResolvedValueOnce(folder)
        .mockResolvedValueOnce(null);

      await expect(
        service.updateParent(folderKey, parentFolderKey),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateName', () => {
    it('should update a folder name', async () => {
      const folderKey = uuidv4();
      const folderName = 'test';
      const folder: folders = {
        id: BigInt(1),
        folder_name: 'beforeTest',
        parent_folder_id: null,
        folder_key: folderKey,
      };
      const updateFolder: folders = {
        id: BigInt(1),
        folder_name: folderName,
        parent_folder_id: null,
        folder_key: folderKey,
      };
      prismaService.folders.findUnique.mockResolvedValue(folder);
      prismaService.folders.update.mockResolvedValue(updateFolder);

      expect(await service.updateName(folderKey, folderName)).toEqual(true);
    });

    it('should throw an not found error if folder is not exist when updating a folder name', async () => {
      const folderKey = uuidv4();
      const folderName = 'test';
      prismaService.folders.findUnique.mockResolvedValue(null);

      await expect(service.updateName(folderKey, folderName)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
