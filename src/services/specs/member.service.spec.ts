import { member, PrismaClient, service_status } from '@prisma/client';
import { MemberService } from '../member.service';
import { DeepMockProxy, mockDeep } from 'jest-mock-extended';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma.service';

describe('MemberService', () => {
  let service: MemberService;
  let prisma: DeepMockProxy<PrismaClient>;

  const uuid = '123e4567-e89b-12d3-a456-426614174000';

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
      const member: member = { id: 1, uuid_key: uuid };
      const serviceStatus: service_status = {
        member_id: member.id,
        available: false,
        join_date: new Date(),
        update_date: new Date(),
      };

      prisma.member.create.mockResolvedValue(member);
      prisma.service_status.create.mockResolvedValue(serviceStatus);

      const result = await service.createMember(uuid);

      expect(result).toEqual(member);
    });
  });
});
