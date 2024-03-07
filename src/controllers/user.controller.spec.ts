import { UserService } from 'src/services/user.service';
import { UserController } from './user.controller';
import { Test, TestingModule } from '@nestjs/testing';
import {
  ICreateUserRequestBody,
  ICreateUserServiceOutput,
} from 'src/interfaces/user.interface';
import { PrismaService } from 'src/services/prisma.service';

describe('UserController', () => {
  let controller: UserController;
  let userService: UserService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [UserService, PrismaService],
    }).compile();

    controller = module.get<UserController>(UserController);
    userService = module.get<UserService>(UserService);
  });

  // Test if the controller is defined
  it('should be defined', () => {
    expect(controller).toBeDefined();
    expect(userService).toBeDefined();
  });

  /**
   * Success handling
   * Test if the controller is successfully done
   */
  it('should create a user', async () => {
    const uuidKey = '1234';
    const createUserRequestBody: ICreateUserRequestBody = {
      payload: {
        uuidKey,
      },
    };
    const createUserOutput: ICreateUserServiceOutput = {
      id: 1,
      uuidKey,
    };
    userService.create = jest.fn().mockResolvedValue(createUserOutput);
    expect(await controller.createUser(createUserRequestBody)).toEqual(
      'User created',
    );
  });
});
