import { TestingModule, Test } from '@nestjs/testing';
import {
  ICreateFolderRequestBody,
  ICreateFolderServiceOutput,
} from 'src/interfaces/folder.interface';
import { FolderService } from 'src/services/folder.service';
import { PrismaService } from 'src/services/prisma.service';
import { FolderController } from './folder.controller';
import { v4 as uuidv4 } from 'uuid';

describe('FolderController', () => {
  let controller: FolderController;
  let folderService: FolderService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FolderController],
      providers: [FolderService, PrismaService],
    }).compile();

    controller = module.get<FolderController>(FolderController);
    folderService = module.get<FolderService>(FolderService);
  });

  // Test if the controller is defined
  it('should be defined', () => {
    expect(controller).toBeDefined();
    expect(folderService).toBeDefined();
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
    const createFolderOutput: ICreateFolderServiceOutput = {
      folderKey: createFolderRequestBody.data.parentFolderKey || uuidv4(),
    };
    folderService.create = jest.fn().mockResolvedValue(createFolderOutput);
    expect(await controller.createFolder(createFolderRequestBody)).toEqual(
      'Folder created',
    );
  });
});
