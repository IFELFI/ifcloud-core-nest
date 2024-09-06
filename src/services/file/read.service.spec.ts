import { DeepMockProxy, mockDeep } from 'jest-mock-extended';
import { FileReadService } from './read.service';
import { PrismaClient } from '@prisma/client';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma.service';

describe('ReadService', () => {
  let service: FileReadService;
  let prisma: DeepMockProxy<PrismaClient>;

  const memberId = 1;
  const fileKey = 'dd6a8799-6483-48dd-afc3-3453a417f2b4';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FileReadService, PrismaService],
    })
      .overrideProvider(PrismaService)
      .useValue(mockDeep(PrismaClient))
      .compile();

    service = module.get<FileReadService>(FileReadService);
    prisma = module.get<DeepMockProxy<PrismaClient>>(PrismaService);
    prisma.$transaction.mockImplementation((cb) => cb(prisma));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
