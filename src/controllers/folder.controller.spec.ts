import { TestingModule, Test } from '@nestjs/testing';
import { ICreateFolderRequestBody } from 'src/interfaces/folder.interface';
import { FolderService } from 'src/services/folder.service';
import { PrismaService } from 'src/services/prisma.service';
import { FolderController } from './folder.controller';
import { v4 as uuidv4 } from 'uuid';
import { CheckRoleService } from 'src/services/checkRole.service';
import { AuthGuard } from 'src/guards/auth.guard';
import { UserGuard } from 'src/guards/user.guard';
import { RoleGuard } from 'src/guards/role.guard';

describe('FolderController', () => {
  let controller: FolderController;
  let folderService: FolderService;
  let checkRoleService: CheckRoleService;

  beforeEach(async () => {
    const mockGuards = {
      canActivate: jest.fn().mockReturnValue(true),
    };
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FolderController],
      providers: [FolderService, PrismaService, CheckRoleService],
    })
      .overrideGuard(AuthGuard)
      .useValue(mockGuards)
      .overrideGuard(UserGuard)
      .useValue(mockGuards)
      .overrideGuard(RoleGuard)
      .useValue(mockGuards)
      .compile();

    controller = module.get<FolderController>(FolderController);
    folderService = module.get<FolderService>(FolderService);
    checkRoleService = module.get<CheckRoleService>(CheckRoleService);
  });

  // Test if the controller is defined
  it('should be defined', () => {
    expect(controller).toBeDefined();
    expect(folderService).toBeDefined();
    expect(checkRoleService).toBeDefined();
  });

  describe('createFolder', () => {
    it('should create a folder', async () => {
      const createFolderRequestBody: ICreateFolderRequestBody = {
        folderName: 'test',
      };
      const folderKey = uuidv4();
      folderService.create = jest.fn().mockResolvedValue({ folderKey });
      expect(
        await controller.createFolder(uuidv4(), 1, createFolderRequestBody),
      ).toEqual(folderKey);
    });
  });

  describe('createRootFolder', () => {
    it('should create a root folder', async () => {
      const folderKey = uuidv4();
      folderService.create = jest.fn().mockResolvedValue({ folderKey });
      expect(await controller.createRootFolder(1, uuidv4())).toEqual(folderKey);
    });
  });

  describe('deleteFolder', () => {
    it('should delete a folder', async () => {
      folderService.delete = jest.fn().mockResolvedValue(true);
      expect(await controller.deleteFolder('1234')).toEqual('Folder deleted');
    });
  });

  describe('readFolder', () => {
    it('should read a folder', async () => {
      const folders: Array<{
        key: string;
        name: string;
      }> = [{ key: '1234', name: 'test' }];
      const files: Array<{
        key: string;
        name: string;
      }> = [{ key: '1234', name: 'test' }];

      folderService.readFolderByKey = jest.fn().mockResolvedValue({
        folders,
        files,
      });

      expect(await controller.readFolder('1234')).toEqual({
        folders,
        files,
      });
    });
  });

  describe('readRootFolder', () => {
    it('should read root folder', async () => {
      const folders: Array<{
        key: string;
        name: string;
      }> = [{ key: '1234', name: 'test' }];
      const files: Array<{
        key: string;
        name: string;
      }> = [{ key: '1234', name: 'test' }];

      folderService.readRootFolder = jest.fn().mockResolvedValue({
        folders,
        files,
      });

      expect(await controller.readRootFolder(uuidv4())).toEqual({
        folders,
        files,
      });
    });
  });

  describe('getRootFolderKey', () => {
    it('should get root folder key', async () => {
      folderService.getRootFolderKey = jest.fn().mockResolvedValue('1234');
      expect(await controller.getRootFolderKey(uuidv4())).toEqual('1234');
    });
  });

  describe('moveFolder', () => {
    it('should move folder', async () => {
      folderService.updateParent = jest.fn().mockResolvedValue(true);
      expect(await controller.moveFolder('1234', '5678')).toEqual(
        'Folder moved',
      );
    });
  });

  describe('renameFolder', () => {
    it('should rename a folder', async () => {
      folderService.updateName = jest.fn().mockResolvedValue(true);
      expect(
        await controller.renameFolder('1234', { folderName: 'test ' }),
      ).toEqual('Folder renamed');
    });
  });
});
