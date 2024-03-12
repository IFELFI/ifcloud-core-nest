import { TestingModule, Test } from '@nestjs/testing';
import { PrismaClient, access_role, folders, user_role } from '@prisma/client';
import { DeepMockProxy, mockDeep } from 'jest-mock-extended';
import { CheckRoleService } from './checkRole.service';
import { PrismaService } from './prisma.service';
import { v4 as uuidv4 } from 'uuid';

describe('CheckRoleService', () => {
  let service: CheckRoleService;
  let prismaService: DeepMockProxy<PrismaClient>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CheckRoleService, PrismaService],
    })
      .overrideProvider(PrismaService)
      .useValue(mockDeep(PrismaClient))
      .compile();

    service = module.get<CheckRoleService>(CheckRoleService);
    prismaService = module.get<DeepMockProxy<PrismaClient>>(PrismaService);
  });

  // Test if the service is defined
  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  /**
   * Success handling
   * Test if the service is successfully done
   */

  // Check role success handling
  it('should return true if user have role', async () => {
    const folderKey = uuidv4();
    const userId = 1;
    const role: access_role = 'create';
    const folder: folders = {
      id: BigInt(1),
      folder_name: 'test',
      parent_folder_id: null,
      folder_key: folderKey,
    };
    const userRole: user_role = {
      user_id: userId,
      folder_id: folder.id,
      role: ['create', 'update'],
    };
    prismaService.folders.findUnique.mockResolvedValue(folder);
    prismaService.user_role.findFirst.mockResolvedValue(userRole);

    const result = await service.checkRole(folder.id, userId, role);
    expect(result).toBe(true);
  });

  it('should return false if user does not have role', async () => {
    const folderKey = uuidv4();
    const userId = 1;
    const role: access_role = 'delete';
    const folder: folders = {
      id: BigInt(1),
      folder_name: 'test',
      parent_folder_id: null,
      folder_key: folderKey,
    };
    const userRole: user_role = {
      user_id: userId,
      folder_id: folder.id,
      role: ['create', 'update'],
    };
    prismaService.folders.findUnique.mockResolvedValue(folder);
    prismaService.user_role.findFirst.mockResolvedValue(userRole);

    const result = await service.checkRole(folder.id, userId, role);
    expect(result).toBe(false);
  });

  /**
   * Failure handling
   * Test if the service is failed
   */

  // Check role failure handling
  it('should throw NotFoundException if user_role does not exist', async () => {
    const folderKey = uuidv4();
    const userId = 1;
    const role = 'create';
    const folder: folders = {
      id: BigInt(1),
      folder_name: 'test',
      parent_folder_id: null,
      folder_key: folderKey,
    };
    prismaService.folders.findUnique.mockResolvedValue(folder);
    prismaService.user_role.findFirst.mockResolvedValue(null);

    const result = await service.checkRole(folder.id, userId, role);
    expect(result).toBe(false);
  });
});
