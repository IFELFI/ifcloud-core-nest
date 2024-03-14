import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from 'src/guards/auth.guard';
import { RoleGuard } from 'src/guards/role.guard';
import { UserGuard } from 'src/guards/user.guard';
import {
  ICreateFolderRequestBody,
  validateCreateFolderRequestBody,
} from 'src/interfaces/folder.interface';
import { TypiaValidationPipe } from 'src/pipes/validation.pipe';
import { FolderService } from 'src/services/folder.service';

@Controller('folder')
@UseGuards(AuthGuard, UserGuard)
export class FolderController {
  constructor(private folderService: FolderService) {}

  @Post('create/:folderKey')
  @UseGuards(RoleGuard('create'))
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
    @Body(new TypiaValidationPipe(validateCreateFolderRequestBody))
    createFolder: ICreateFolderRequestBody,
  ): Promise<string> {
    const folderName = createFolder.folderName;

    await this.folderService.create(folderName, undefined, userId);

    return 'Root folder created';
  }

  @Delete(':folderKey')
  @UseGuards(RoleGuard('delete'))
  @HttpCode(200)
  async deleteFolder(
    @Param('folderKey', new ParseUUIDPipe()) folderKey: string,
  ): Promise<string> {
    await this.folderService.delete(folderKey);

    return 'Folder deleted';
  }

  @Get(':folderKey')
  @UseGuards(RoleGuard('read'))
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
}
