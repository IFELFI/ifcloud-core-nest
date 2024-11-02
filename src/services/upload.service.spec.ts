import { Test, TestingModule } from '@nestjs/testing';
import { FileCreateService } from './file/create.service';
import { FileDeleteService } from './file/delete.service';
import { FileReadService } from './file/read.service';
import { StorageService } from './storage/storage.service';
import { TokenService } from './storage/token.service';
import { UploadService } from './upload.service';
import mockValues from '../../test/mockValues';

describe('UploadService', () => {
  let service: UploadService;
  let fileCreateService: FileCreateService;
  let fileReadService: FileReadService;
  let fileDeleteService: FileDeleteService;
  let storageService: StorageService;
  let tokenService: TokenService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UploadService,
        {
          provide: FileCreateService,
          useValue: {
            createTemporaryFile: jest.fn(),
          },
        },
        {
          provide: FileReadService,
          useValue: {
            getFile: jest.fn(),
          },
        },
        {
          provide: FileDeleteService,
          useValue: {
            deleteFile: jest.fn(),
            deleteTemporaryFile: jest.fn(),
          },
        },
        {
          provide: StorageService,
          useValue: {
            mergeChunks: jest.fn(),
          },
        },
        {
          provide: TokenService,
          useValue: {
            issueWriteToken: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<UploadService>(UploadService);
    fileCreateService = module.get<FileCreateService>(FileCreateService);
    fileReadService = module.get<FileReadService>(FileReadService);
    fileDeleteService = module.get<FileDeleteService>(FileDeleteService);
    storageService = module.get<StorageService>(StorageService);
    tokenService = module.get<TokenService>(TokenService);

    // File Create Service
    fileCreateService.createTemporaryFile = jest
      .fn()
      .mockResolvedValue(mockValues.tempFile);
    fileCreateService.createBlock = jest
      .fn()
      .mockResolvedValue(mockValues.block.file);

    // File Read Service
    fileReadService.getFile = jest.fn().mockResolvedValue(mockValues.block);
    fileReadService.getTemporaryFile = jest
      .fn()
      .mockResolvedValue(mockValues.tempFile);

    // File Delete Service
    fileDeleteService.deleteFile = jest
      .fn()
      .mockResolvedValue(mockValues.block);
    fileDeleteService.deleteTemporaryFile = jest
      .fn()
      .mockResolvedValue(mockValues.tempFile);

    // Storage Service
    storageService.mergeChunks = jest
      .fn()
      .mockResolvedValue(mockValues.storageSuccessReply);

    // Token Service
    tokenService.issueWriteToken = jest
      .fn()
      .mockResolvedValue(mockValues.randomToken);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('issueWriteToken', () => {
    it('should issue a write token', async () => {
      const result = await service.issueWriteToken(
        mockValues.member.id,
        mockValues.container.file.file_key,
        mockValues.tempFile.file_name,
        mockValues.tempFile.byte_size,
      );
      expect(result).toEqual({
        token: mockValues.randomToken,
        fileKey: mockValues.tempFile.file_key,
      });
    });
  });

  describe('completeUpload', () => {
    it('should complete the upload', async () => {
      const result = await service.completeUpload(
        mockValues.tempFile.file_key,
        mockValues.chunkCount,
      );
      expect(result).toEqual(mockValues.block.file);
    });
  });
});
