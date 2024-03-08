import { DeepMockProxy, mockDeep } from 'jest-mock-extended';
import { FolderService } from './folder.service';
import {
  PrismaClient,
  external_access,
  folder_info,
  folders,
  user_role,
} from '@prisma/client';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from './prisma.service';
import { ICreateFolderServiceOutput } from 'src/interfaces/folder.interface';
import {
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
    const createUserRole: user_role = {
      user_id: 1,
      folder_id: createFolder.id,
      role: ['create', 'read', 'update', 'delete'],
    };

    const output: ICreateFolderServiceOutput = {
      folderKey: createFolder.folder_key,
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
    prismaService.user_role.create.mockResolvedValue(createUserRole);
    expect(
      await service.create({
        folderName,
        parentFolderKey,
        userId,
      }),
    ).toEqual(output);
  });

  /**
   * Error handling
   * Test if the service is throwing an error
   */
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
      service.create({
        folderName,
        parentFolderKey,
        userId,
      }),
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
      service.create({
        folderName,
        parentFolderKey,
        userId,
      }),
    ).rejects.toThrow(InternalServerErrorException);
  });
});
