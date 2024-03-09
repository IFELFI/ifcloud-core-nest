import { TestingModule, Test } from '@nestjs/testing';
import { ICreateFolderRequestBody } from 'src/interfaces/folder.interface';
import { FolderService } from 'src/services/folder.service';
import { PrismaService } from 'src/services/prisma.service';
import { FolderController } from './folder.controller';
import { v4 as uuidv4 } from 'uuid';
import { CheckRoleService } from 'src/services/checkRole.service';

describe('FolderController', () => {
  let controller: FolderController;
  let folderService: FolderService;
  let checkRoleService: CheckRoleService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FolderController],
      providers: [FolderService, PrismaService, CheckRoleService],
    }).compile();

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

  /**
   * Success handling
   * Test if the controller is successfully done
   */
  it('should create a folder', async () => {
    const createFolderRequestBody: ICreateFolderRequestBody = {
      userId: 1,
      payload: {
        uuidKey: '1234',
      },
      data: {
        folderName: 'test',
        parentFolderKey: uuidv4(),
      },
    };
    folderService.create = jest.fn().mockResolvedValue({ folderKey: uuidv4() });
    expect(await controller.createFolder(createFolderRequestBody)).toEqual(
      'Folder created',
    );
  });

  it('should delete a folder', async () => {
    const deleteFolderRequestBody = {
      userId: 1,
      payload: {
        uuidKey: '1234',
      },
    };
    folderService.delete = jest.fn().mockResolvedValue(true);
    expect(
      await controller.deleteFolder(deleteFolderRequestBody, '1234'),
    ).toEqual('Folder deleted');
  });

  it('should read a folder', async () => {
    const readFolderRequestBody = {
      userId: 1,
      payload: {
        uuidKey: '1234',
      },
    };
    const folders: Array<{
      folderKey: string;
      folderName: string;
    }> = [{ folderKey: '1234', folderName: 'test' }];
    const files: Array<{
      fileKey: string;
      fileName: string;
    }> = [{ fileKey: '1234', fileName: 'test' }];

    folderService.read = jest.fn().mockResolvedValue({
      folders,
      files,
    });

    expect(await controller.readFolder(readFolderRequestBody, '1234')).toEqual({
      folders,
      files,
    });
  });
});
