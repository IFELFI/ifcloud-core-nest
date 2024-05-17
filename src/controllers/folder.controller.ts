import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { access_role } from '@prisma/client';
import { AuthGuard } from 'src/guards/auth.guard';
import { RoleGuard } from 'src/guards/role.guard';
import { UserGuard } from 'src/guards/user.guard';
import {
  ICreateFolderRequestBody,
  IRenameFolderRequestBody,
  validateCreateFolderRequestBody,
  validateRenameFolderRequestBody,
} from 'src/interfaces/folder.interface';
import { TypiaValidationPipe } from 'src/pipes/validation.pipe';
import { FolderService } from 'src/services/folder.service';

@Controller('folder')
@UseGuards(AuthGuard, UserGuard)
export class FolderController {
  constructor(private folderService: FolderService) {}

  @Post('create/:folderKey')
  @UseGuards(RoleGuard(access_role.create))
  @HttpCode(201)
  async createFolder(
    @Param('folderKey', new ParseUUIDPipe()) folderKey: string,
    @Query('userId', ParseIntPipe) userId: number,
    @Body(new TypiaValidationPipe(validateCreateFolderRequestBody))
    createFolder: ICreateFolderRequestBody,
  ): Promise<string> {
    const folderName = createFolder.folderName;

    await this.folderService.create(folderName, folderKey, userId);

    return 'Folder created';
  }

  @Post('create')
  @HttpCode(201)
  async createRootFolder(
    @Query('userId', ParseIntPipe) userId: number,
    @Query('uuidKey', new ParseUUIDPipe()) uuidKey: string,
  ): Promise<string> {
    await this.folderService.create(uuidKey, null, userId);

    return 'Root folder created';
  }

  @Delete(':folderKey')
  @UseGuards(RoleGuard(access_role.delete))
  @HttpCode(200)
  async deleteFolder(
    @Param('folderKey', new ParseUUIDPipe()) folderKey: string,
  ): Promise<string> {
    await this.folderService.delete(folderKey);

    return 'Folder deleted';
  }

  @Get(':folderKey')
  @UseGuards(RoleGuard(access_role.read))
  @HttpCode(200)
  async readFolder(
    @Param('folderKey', new ParseUUIDPipe()) folderKey: string,
  ): Promise<{
    folders: Array<{
      folderKey: string;
      folderName: string;
    }>;
    files: Array<{
      fileKey: string;
      fileName: string;
      enabled: boolean;
    }>;
  }> {
    return this.folderService.read(folderKey);
  }

  @Get('root')
  @HttpCode(200)
  async readRootFolder(
    @Query('uuidKey', new ParseUUIDPipe()) uuidKey: string,
  ): Promise<{
    folders: Array<{
      folderKey: string;
      folderName: string;
    }>;
    files: Array<{
      fileKey: string;
      fileName: string;
      enabled: boolean;
    }>;
  }> {
    return this.folderService.readRoot(uuidKey);
  }

  @Patch('move/:folderKey')
  @UseGuards(RoleGuard(access_role.update, true, access_role.update))
  @HttpCode(200)
  async moveFolder(
    @Param('folderKey', new ParseUUIDPipe()) folderKey: string,
    @Query('targetKey', new ParseUUIDPipe()) targetFolderKey: string,
  ): Promise<string> {
    await this.folderService.updateParent(folderKey, targetFolderKey);

    return 'Folder moved';
  }

  @Patch('rename/:folderKey')
  @UseGuards(RoleGuard(access_role.update))
  @HttpCode(200)
  async renameFolder(
    @Param('folderKey', new ParseUUIDPipe()) folderKey: string,
    @Body(new TypiaValidationPipe(validateRenameFolderRequestBody))
    renameFolder: IRenameFolderRequestBody,
  ): Promise<string> {
    await this.folderService.updateName(folderKey, renameFolder.folderName);

    return 'Folder renamed';
  }
}
