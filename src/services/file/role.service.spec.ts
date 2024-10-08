import { access_role, PrismaClient } from '@prisma/client';
import { FileRoleService } from './role.service';
import { DeepMockProxy, mockDeep } from 'jest-mock-extended';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import mockValues from '../../../test/mockValues';

describe('FileRoleService', () => {
  let service: FileRoleService;
  let prisma: DeepMockProxy<PrismaClient>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FileRoleService, PrismaService],
    })
      .overrideProvider(PrismaService)
      .useValue(mockDeep(PrismaClient))
      .compile();

    service = module.get<FileRoleService>(FileRoleService);
    prisma = module.get<DeepMockProxy<PrismaClient>>(PrismaService);
    prisma.$transaction.mockImplementation((cb) => cb(prisma));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getRole', () => {
    it('should return the role of a member for a file', async () => {
      prisma.file.findUniqueOrThrow.mockResolvedValue(mockValues.block);
      prisma.file_role.findUnique.mockResolvedValue(mockValues.fileRole);

      const result = await service.getRole(
        mockValues.member.id,
        mockValues.block.file_key,
      );

      expect(result).toBeDefined();
    });
  });

  describe('checkRole', () => {
    it('should return true if the member has the required role for the file', async () => {
      prisma.file.findUniqueOrThrow.mockResolvedValue(mockValues.block);
      prisma.file_role.findUnique.mockResolvedValue(mockValues.fileRole);

      const result = await service.checkRole(
        mockValues.member.id,
        mockValues.block.file_key,
        access_role.read,
      );

      expect(result).toBe(true);
    });

    it('should return false if the member does not have the required role for the file', async () => {
      prisma.file.findUniqueOrThrow.mockResolvedValue(mockValues.block);
      prisma.file_role.findUnique.mockResolvedValue(null);

      const result = await service.checkRole(
        mockValues.member.id,
        mockValues.block.file_key,
        access_role.read,
      );

      expect(result).toBe(false);
    });
  });
});
