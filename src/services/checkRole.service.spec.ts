import { TestingModule, Test } from '@nestjs/testing';
import {
  PrismaClient,
  access_role,
  files,
  folders,
  user_role,
} from '@prisma/client';
import { DeepMockProxy, mockDeep } from 'jest-mock-extended';
import { CheckRoleService } from './checkRole.service';
import { PrismaService } from './prisma.service';
import { v4 as uuidv4 } from 'uuid';
import { NotFoundException } from '@nestjs/common';

describe('CheckRoleService', () => {
  let service: CheckRoleService;
  let prismaService: DeepMockProxy<PrismaClient>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CheckRoleService, PrismaService],
    })
      .overrideProvider(PrismaService)
      .useValue(mockDeep(PrismaClient))
      .compile();

    service = module.get<CheckRoleService>(CheckRoleService);
    prismaService = module.get<DeepMockProxy<PrismaClient>>(PrismaService);
  });

  // Test if the service is defined
  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('checkFolder', () => {
    it('should return true if user have role', async () => {
      const folderKey = uuidv4();
      const userId = 1;
      const role: access_role = 'create';
      const folder: folders = {
        id: BigInt(1),
        folder_name: 'test',
        parent_folder_id: null,
        folder_key: folderKey,
      };
      const userRole: user_role = {
        user_id: userId,
        folder_id: folder.id,
        role: ['create', 'update'],
      };
      prismaService.folders.findUnique.mockResolvedValue(folder);
      prismaService.user_role.findFirst.mockResolvedValue(userRole);

      const result = await service.checkFolder(folderKey, userId, role);
      expect(result).toBe(true);
    });

    it('should return false if user does not have role', async () => {
      const folderKey = uuidv4();
      const userId = 1;
      const role: access_role = 'delete';
      const folder: folders = {
        id: BigInt(1),
        folder_name: 'test',
        parent_folder_id: null,
        folder_key: folderKey,
      };
      const userRole: user_role = {
        user_id: userId,
        folder_id: folder.id,
        role: ['create', 'update'],
      };
      prismaService.folders.findUnique.mockResolvedValue(folder);
      prismaService.user_role.findFirst.mockResolvedValue(userRole);

      const result = await service.checkFolder(folderKey, userId, role);
      expect(result).toBe(false);
    });

    it('should throw NotFoundException if user_role does not exist', async () => {
      const folderKey = uuidv4();
      const userId = 1;
      const role = 'create';
      const folder: folders = {
        id: BigInt(1),
        folder_name: 'test',
        parent_folder_id: null,
        folder_key: folderKey,
      };
      prismaService.folders.findUnique.mockResolvedValue(folder);
      prismaService.user_role.findFirst.mockResolvedValue(null);

      const result = await service.checkFolder(folderKey, userId, role);
      expect(result).toBe(false);
    });
  });

  describe('checkFile', () => {
    it('should return true if user have role', async () => {
      const fileKey = uuidv4();
      const userId = 1;
      const role = 'create';
      const folder: folders = {
        id: BigInt(1),
        folder_name: 'test',
        parent_folder_id: null,
        folder_key: uuidv4(),
      };
      const userRole: user_role = {
        user_id: userId,
        folder_id: folder.id,
        role: ['create', 'update'],
      };
      const file: files = {
        id: BigInt(1),
        file_name: 'test',
        parent_folder_id: folder.id,
        file_key: fileKey,
        enabled: true,
      };
      prismaService.files.findUnique.mockResolvedValue(file);
      prismaService.user_role.findFirst.mockResolvedValue(userRole);

      const result = await service.checkFile(fileKey, userId, role);
      expect(result).toBe(true);
    });

    it('should return false if user does not have role', async () => {
      const fileKey = uuidv4();
      const userId = 1;
      const role = 'delete';
      const folder: folders = {
        id: BigInt(1),
        folder_name: 'test',
        parent_folder_id: null,
        folder_key: uuidv4(),
      };
      const userRole: user_role = {
        user_id: userId,
        folder_id: folder.id,
        role: ['create', 'update'],
      };
      const file: files = {
        id: BigInt(1),
        file_name: 'test',
        parent_folder_id: folder.id,
        file_key: fileKey,
        enabled: true,
      };
      prismaService.files.findUnique.mockResolvedValue(file);
      prismaService.user_role.findFirst.mockResolvedValue(userRole);

      const result = await service.checkFile(fileKey, userId, role);
      expect(result).toBe(false);
    });

    it('should throw NotFoundException if file does not exist', async () => {
      const fileKey = uuidv4();
      const userId = 1;
      const role = 'create';
      prismaService.files.findUnique.mockResolvedValue(null);

      await expect(service.checkFile(fileKey, userId, role)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw NotFoundException if user_role does not exist', async () => {
      const fileKey = uuidv4();
      const userId = 1;
      const role = 'create';
      const file: files = {
        id: BigInt(1),
        file_name: 'test',
        parent_folder_id: BigInt(1),
        file_key: fileKey,
        enabled: true,
      };
      prismaService.files.findUnique.mockResolvedValue(file);
      prismaService.user_role.findFirst.mockResolvedValue(null);

      const result = await service.checkFile(fileKey, userId, role);
      expect(result).toBe(false);
    });

    it('should throw NotFoundException if file_key is not provided', async () => {
      const fileKey = '';
      const userId = 1;
      const role = 'create';

      await expect(service.checkFile(fileKey, userId, role)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
