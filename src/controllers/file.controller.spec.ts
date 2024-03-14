import { TestingModule, Test } from '@nestjs/testing';
import { IUploadFileRequestBody } from 'src/interfaces/file.interface';
import { CheckRoleService } from 'src/services/checkRole.service';
import { FileService } from 'src/services/file.service';
import { PrismaService } from 'src/services/prisma.service';
import { FileController } from './file.controller';
import { Readable } from 'stream';
import { v4 as uuidv4 } from 'uuid';

describe('FileController', () => {
  let controller: FileController;
  let fileService: FileService;
  let checkRoleService: CheckRoleService;
  const res = {
    status: jest.fn(() => res),
    json: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FileController],
      providers: [FileService, PrismaService, CheckRoleService],
    }).compile();

    controller = module.get<FileController>(FileController);
    fileService = module.get<FileService>(FileService);
    checkRoleService = module.get<CheckRoleService>(CheckRoleService);
  });

  // Test if the controller is defined
  it('should be defined', () => {
    expect(controller).toBeDefined();
    expect(fileService).toBeDefined();
    expect(checkRoleService).toBeDefined();
  });

  /**
   * Success handling
   * Test if the controller is successfully done
   */
  it('should upload a file', async () => {
    const uploadFileRequestBody: IUploadFileRequestBody = {
      userId: 1,
      payload: {
        uuidKey: '1234',
      },
      data: {
        fileName: 'test.txt',
        totalChunks: 1,
        chunkNumber: 0,
      },
    };
    const file: Express.Multer.File = {
      fieldname: 'file',
      originalname: 'test.txt',
      encoding: '7bit',
      mimetype: 'text/plain',
      buffer: Buffer.from('test'),
      size: 4,
      destination: '',
      filename: '',
      path: '',
      stream: Readable.from('test'),
    };
    const folderKey = uuidv4();
    fileService.uploadFile = jest.fn().mockResolvedValue(true);
    await controller.uploadFile(file, uploadFileRequestBody, folderKey, res);
    expect(res.status).toHaveBeenCalledWith(201);
  });
});
