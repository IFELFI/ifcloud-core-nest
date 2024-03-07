import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from './prisma.service';
import { UserService } from './user.service';
import { DeepMockProxy, mockDeep } from 'jest-mock-extended';
import { PrismaClient, users } from '@prisma/client';
import {
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';

describe('UserService', () => {
  let service: UserService;
  let prismaService: DeepMockProxy<PrismaClient>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UserService, PrismaService],
    })
      .overrideProvider(PrismaService)
      .useValue(mockDeep(PrismaClient))
      .compile();

    service = module.get<UserService>(UserService);
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
  it('should create a user', async () => {
    const uuidKey = '1234';
    const createUser: users = {
      id: 1,
      uuid_key: uuidKey,
    };
    const output = {
      id: createUser.id,
      uuidKey,
    };
    prismaService.users.create.mockResolvedValue(createUser);
    expect(await service.create(uuidKey)).toEqual(output);
  });

  it('should read a user', async () => {
    const uuidKey = '1234';
    const user: users = {
      id: 1,
      uuid_key: '1234',
    };
    prismaService.users.findUniqueOrThrow.mockResolvedValue(user);
    expect(await service.read(uuidKey)).toEqual(user.id);
  });

  it('should delete a user', async () => {
    const uuidKey = '1234';
    const user: users = {
      id: 1,
      uuid_key: '1234',
    };
    prismaService.users.delete.mockResolvedValue(user);
    expect(await service.delete(uuidKey)).toBeUndefined();
  });

  /**
   * Error handling
   * Test if the service is throwing an error
   */
  it('should throw an conflict error when creating a same user', async () => {
    const uuidKey = '1234';
    prismaService.users.create.mockRejectedValue({ code: 'P2002' });
    await expect(service.create(uuidKey)).rejects.toThrow(ConflictException);
  });

  it('should throw an internal server error when creating a user', async () => {
    const uuidKey = '1234';
    prismaService.users.create.mockRejectedValue({ code: 'P2003' });
    await expect(service.create(uuidKey)).rejects.toThrow(
      InternalServerErrorException,
    );
  });

  it('should throw an conflict error when reading a user', async () => {
    const uuidKey = '1234';
    prismaService.users.findUniqueOrThrow.mockRejectedValue({ code: 'P2002' });
    await expect(service.read(uuidKey)).rejects.toThrow(ConflictException);
  });

  it('should throw an internal server error when reading a user', async () => {
    const uuidKey = '1234';
    prismaService.users.findUniqueOrThrow.mockRejectedValue({ code: 'P2003' });
    await expect(service.read(uuidKey)).rejects.toThrow(
      InternalServerErrorException,
    );
  });

  it('should throw an conflict error when deleting a user', async () => {
    const uuidKey = '1234';
    prismaService.users.delete.mockRejectedValue({ code: 'P2002' });
    await expect(service.delete(uuidKey)).rejects.toThrow(ConflictException);
  });

  it('should throw an internal server error when deleting a user', async () => {
    const uuidKey = '1234';
    prismaService.users.delete.mockRejectedValue({ code: 'P2003' });
    await expect(service.delete(uuidKey)).rejects.toThrow(
      InternalServerErrorException,
    );
  });
});
