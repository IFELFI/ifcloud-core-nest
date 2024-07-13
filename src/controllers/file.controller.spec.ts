import { TestingModule, Test } from '@nestjs/testing';
import { IUploadFileRequestBody } from 'src/interfaces/file.interface';
import { CheckRoleService } from 'src/services/checkRole.service';
import { FileService } from 'src/services/file.service';
import { PrismaService } from 'src/services/prisma.service';
import { FileController } from './file.controller';
import { Readable } from 'stream';
import { v4 as uuidv4 } from 'uuid';
import { JwtService } from '@nestjs/jwt';
import { AuthGuard } from 'src/guards/auth.guard';
import { UserGuard } from 'src/guards/user.guard';
import fs from 'fs';
import { Response } from 'express';
import { mockDeep } from 'jest-mock-extended';

describe('FileController', () => {
  let controller: FileController;
  let fileService: FileService;
  let checkRoleService: CheckRoleService;
  const res = mockDeep<Response>({
    status: jest.fn().mockImplementation(() => res),
    writeHead: jest.fn().mockImplementation((status, headers) => {
      res.status(status);
      res.headers = headers;
    }),
  });
  const mockGuards = {
    canActivate: jest.fn().mockReturnValue(true),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FileController],
      providers: [FileService, PrismaService, CheckRoleService, JwtService],
    })
      .overrideGuard(AuthGuard)
      .useValue(mockGuards)
      .overrideGuard(UserGuard)
      .useValue(mockGuards)
      .compile();

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
      fileName: 'test.txt',
      totalChunks: '1',
      chunkNumber: '0',
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
    fileService.upload = jest
      .fn()
      .mockResolvedValue({ isDone: true, fileKey: uuidv4() });
    await controller.uploadFile(file, uploadFileRequestBody, folderKey, 1, res);
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it('should download a file', async () => {
    const fileKey = uuidv4();
    const stream = fs.createReadStream('./test/sample/sample-video.mp4');
    fileService.getOriginStream = jest.fn().mockResolvedValue(stream);
    await controller.downloadFile(fileKey, res);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  // it('should stream a file', async () => {
  //   const fileKey = uuidv4();
  //   const start = 0;
  //   const end = 1024 * 1024;
  //   const fileStream = fs.createReadStream('./test/sample/sample-video.mp4', {
  //     start,
  //     end,
  //   });
  //   const ffmpegStream = ffmpeg(fileStream)
  //     .videoCodec('libx264')
  //     .format('mp4')
  //     .outputOptions([
  //       '-movflags frag_keyframe+empty_moov',
  //       '-frag_duration 5000',
  //     ]);
  //   fileService.stream = jest.fn().mockResolvedValue({
  //     stream: ffmpegStream,
  //     end: end,
  //     fileSize: 104857600,
  //   });
  //   await controller.streamFile(fileKey, '720p', start, res);
  //   expect(res.status).toHaveBeenCalledWith(206);
  //   expect(res.headers).toBeDefined();
  //   expect(res.headers).toHaveProperty('Content-Range');
  //   expect(res.headers['Content-Range']).toBe(
  //     `bytes ${start}-${end}/104857600`,
  //   );
  //   expect(res.headers).toHaveProperty('Content-Length');
  //   expect(res.headers['Content-Length']).toBe(1048576);
  //   expect(res.headers).toHaveProperty('Content-Type');
  //   expect(res.headers['Content-Type']).toBe('video/mp4');
  // });

  it('should delete a file', async () => {
    const fileKey = uuidv4();
    fileService.deleteFile = jest.fn().mockResolvedValue(true);
    await controller.deleteFile(fileKey);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('should rename a file', async () => {
    const fileKey = uuidv4();
    const newFileName = {
      fileName: 'newFileName.txt',
    };
    fileService.renameFile = jest.fn().mockResolvedValue(true);
    await controller.renameFile(fileKey, newFileName);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('should move a file', async () => {
    const fileKey = uuidv4();
    const folderKey = uuidv4();
    fileService.updateParent = jest.fn().mockResolvedValue(true);
    await controller.moveFile(fileKey, folderKey);
    expect(res.status).toHaveBeenCalledWith(200);
  });
});
