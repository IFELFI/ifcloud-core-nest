import { UserService } from 'src/services/user.service';
import { UserController } from './user.controller';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from 'src/services/prisma.service';
import { v4 as uuidv4 } from 'uuid';
import { FavoriteService } from 'src/services/favorite.service';
import { CheckRoleService } from 'src/services/checkRole.service';

describe('UserController', () => {
  let controller: UserController;
  let userService: UserService;
  let favoriteService: FavoriteService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        UserService,
        PrismaService,
        FavoriteService,
        CheckRoleService,
      ],
    }).compile();

    controller = module.get<UserController>(UserController);
    userService = module.get<UserService>(UserService);
    favoriteService = module.get<FavoriteService>(FavoriteService);
  });

  // Test if the controller is defined
  it('should be defined', () => {
    expect(controller).toBeDefined();
    expect(userService).toBeDefined();
    expect(favoriteService).toBeDefined();
  });

  /**
   * Success handling
   * Test if the controller is successfully done
   */
  it('should get a user', async () => {
    const uuidKey = uuidv4();
    const user = {
      id: 1,
      uuidKey,
    };
    userService.read = jest.fn().mockResolvedValue(user.id);
    expect(await controller.getUser(user.uuidKey)).toEqual('User found');
  });

  it('should create a user', async () => {
    const uuidKey = uuidv4();
    const createUserOutput = {
      id: 1,
      uuidKey,
    };
    userService.create = jest.fn().mockResolvedValue(createUserOutput);
    expect(await controller.createUser(createUserOutput.uuidKey)).toEqual(
      'User created',
    );
  });

  it('should delete a user', async () => {
    const uuidKey = uuidv4();
    const deleteUserOutput = {
      id: 1,
      uuidKey,
    };
    userService.delete = jest.fn().mockResolvedValue(deleteUserOutput);
    expect(await controller.deleteUser(deleteUserOutput.uuidKey)).toEqual(
      'User deleted',
    );
  });

  it('should get a favorite folder', async () => {
    const userId = 1;
    const folders = [
      {
        id: 1,
        folder_key: uuidv4(),
        folder_name: 'test',
      },
    ];
    favoriteService.readFavorite = jest.fn().mockResolvedValue(folders);
    expect(await controller.getFavorite(userId)).toEqual(
      folders.map((folder) => ({
        key: folder.folder_key,
        name: folder.folder_name,
      })),
    );
  });

  it('should create a favorite folder', async () => {
    const userId = 1;
    const folderKey = uuidv4();
    favoriteService.createFavorite = jest.fn().mockResolvedValue(undefined);
    expect(await controller.createFavorite(userId, folderKey)).toEqual(
      undefined,
    );
  });

  it('should delete a favorite folder', async () => {
    const userId = 1;
    const folderKey = uuidv4();
    favoriteService.deleteFavorite = jest.fn().mockResolvedValue(undefined);
    expect(await controller.deleteFavorite(userId, folderKey)).toEqual(
      undefined,
    );
  });
});
