import { file, file_role, PrismaClient } from '@prisma/client';
import { FileRoleService } from '../fileRole.service';
import { DeepMockProxy, mockDeep } from 'jest-mock-extended';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma.service';

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
      const memberId = 1;
      const fileKey = '123e4567-e89b-12d3-a456-426614174000';

      const file: file = {
        id: BigInt(1),
        file_key: fileKey,
        type: 'block',
        file_name: 'file.txt',
      };

      const role: file_role = {
        member_id: 1,
        file_id: file.id,
        role: ['read'],
      };

      prisma.file.findUniqueOrThrow.mockResolvedValue(file);
      prisma.file_role.findUnique.mockResolvedValue(role);

      const result = await service.getRole(memberId, fileKey);

      expect(result).toEqual(role);
    });

    it('should throw an error if the file is not found', async () => {
      const memberId = 1;
      const fileKey = '123e4567-e89b-12d3-a456-426614174000';

      prisma.file.findUniqueOrThrow.mockRejectedValue(new Error());

      await expect(service.getRole(memberId, fileKey)).rejects.toThrow();
    });
  });

  describe('checkRole', () => {
    it('should return true if the member has the required role for the file', async () => {
      const memberId = 1;
      const fileKey = '123e4567-e89b-12d3-a456-426614174000';
      const role = 'read';

      const file: file = {
        id: BigInt(1),
        file_key: fileKey,
        type: 'block',
        file_name: 'file.txt',
      };

      const fileRole: file_role = {
        member_id: 1,
        file_id: file.id,
        role: ['read'],
      };

      prisma.file.findUniqueOrThrow.mockResolvedValue(file);
      prisma.file_role.findUnique.mockResolvedValue(fileRole);

      const result = await service.checkRole(memberId, fileKey, role);

      expect(result).toBe(true);
    });

    it('should return false if the member does not have the required role for the file', async () => {
      const memberId = 1;
      const fileKey = '123e4567-e89b-12d3-a456-426614174000';
      const role = 'read';

      const file: file = {
        id: BigInt(1),
        file_key: fileKey,
        type: 'block',
        file_name: 'file.txt',
      };

      const fileRole: file_role = {
        member_id: 1,
        file_id: file.id,
        role: ['create'],
      };

      prisma.file.findUniqueOrThrow.mockResolvedValue(file);
      prisma.file_role.findUnique.mockResolvedValue(fileRole);

      const result = await service.checkRole(memberId, fileKey, role);

      expect(result).toBe(false);
    });
  });
});
