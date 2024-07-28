import { UserService } from 'src/services/user.service';
import {
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { UserGuard } from 'src/guards/user.guard';
import { FavoriteService } from 'src/services/favorite.service';
import { RoleGuard } from 'src/guards/role.guard';
import { access_role } from '@prisma/client';
import { BackgroundService } from 'src/services/background.service';

@Controller('user')
export class UserController {
  constructor(
    private userService: UserService,
    private favoriteService: FavoriteService,
    private backgroundService: BackgroundService,
  ) {}

  @Get()
  @HttpCode(200)
  async getUser(
    @Query('uuidKey', new ParseUUIDPipe()) uuidKey: string,
  ): Promise<string> {
    await this.userService.read(uuidKey);
    return 'User found';
  }

  @Get('enroll')
  @HttpCode(201)
  async createUser(
    @Query('uuidKey', new ParseUUIDPipe()) uuidKey: string,
  ): Promise<string> {
    await this.userService.create(uuidKey);
    return 'User created';
  }

  @Delete()
  @UseGuards(UserGuard)
  async deleteUser(
    @Query('uuidKey', new ParseUUIDPipe()) uuidKey: string,
  ): Promise<string> {
    await this.userService.delete(uuidKey);
    return 'User deleted';
  }

  // Favorite
  @Get('favorite')
  @UseGuards(UserGuard)
  @HttpCode(200)
  async getFavorite(@Query('userId') userId: number): Promise<
    Array<{
      key: string;
      name: string;
    }>
  > {
    const folders = await this.favoriteService.readFavorite(userId);
    return folders.map((folder) => ({
      key: folder.folder_key,
      name: folder.folder_name,
    }));
  }

  @Post('favorite/:folderKey')
  @UseGuards(UserGuard, RoleGuard(access_role.read))
  @HttpCode(200)
  async createFavorite(
    @Query('userId') userId: number,
    @Param('folderKey', new ParseUUIDPipe()) folderKey: string,
  ): Promise<string> {
    await this.favoriteService.createFavorite(userId, folderKey);
    return 'Favorite created';
  }

  @Delete('favorite/:folderKey')
  @UseGuards(UserGuard, RoleGuard(access_role.read))
  @HttpCode(200)
  async deleteFavorite(
    @Query('userId') userId: number,
    @Param('folderKey', new ParseUUIDPipe()) folderKey: string,
  ): Promise<string> {
    await this.favoriteService.deleteFavorite(userId, folderKey);
    return 'Favorite deleted';
  }

  // Background
  @Get('background')
  @UseGuards(UserGuard)
  @HttpCode(200)
  async getBackground(@Query('userId') userId: number): Promise<{
    fileKey: string | null;
    url: string | null;
  }> {
    return this.backgroundService.readBackground(userId);
  }

  @Delete('background')
  @UseGuards(UserGuard)
  @HttpCode(200)
  async deleteBackground(@Query('userId') userId: number): Promise<string> {
    await this.backgroundService.deleteBackground(userId);
    return 'Background deleted';
  }

  @Post('background/:fileKey')
  @UseGuards(UserGuard, RoleGuard(access_role.read))
  @HttpCode(200)
  async createBackground(
    @Query('userId') userId: number,
    @Param('fileKey', new ParseUUIDPipe()) fileKey: string,
  ): Promise<string> {
    await this.backgroundService.setBackgroundFile(userId, fileKey);
    return 'Background created';
  }
}
