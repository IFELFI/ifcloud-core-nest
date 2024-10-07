import { PrismaClient } from '@prisma/client';
import { MemberService } from './member.service';
import { DeepMockProxy, mockDeep } from 'jest-mock-extended';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import mockValues from '../../../test/mockValues';

describe('MemberService', () => {
  let service: MemberService;
  let prisma: DeepMockProxy<PrismaClient>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MemberService, PrismaService],
    })
      .overrideProvider(PrismaService)
      .useValue(mockDeep(PrismaClient))
      .compile();

    service = module.get<MemberService>(MemberService);
    prisma = module.get<DeepMockProxy<PrismaClient>>(PrismaService);
    prisma.$transaction.mockImplementation((cb) => cb(prisma));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createMember', () => {
    it('should create a new member', async () => {
      prisma.member.create.mockResolvedValue(mockValues.member);
      prisma.service_status.create.mockResolvedValue(mockValues.serviceStatus);

      const result = await service.createMember(mockValues.member.uuid_key);

      expect(result).toEqual(mockValues.member);
    });
  });
});
