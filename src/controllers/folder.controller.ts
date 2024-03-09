import {
  Body,
  Controller,
  Delete,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import {
  ICreateFolderRequestBody,
  validateCreateFolderRequestBody,
} from 'src/interfaces/folder.interface';
import {
  IUserRequestBody,
  validateUserRequestBody,
} from 'src/interfaces/request.interface';
import { TypiaValidationPipe } from 'src/pipes/validation.pipe';
import { FolderService } from 'src/services/folder.service';

@Controller('folder')
export class FolderController {
  constructor(private folderService: FolderService) {}

  @Post('create')
  @HttpCode(201)
  async createFolder(
    @Body(new TypiaValidationPipe(validateCreateFolderRequestBody))
    createFolder: ICreateFolderRequestBody,
  ): Promise<string> {
    const userId = createFolder.userId;
    const { folderName, parentFolderKey } = createFolder.data;

    await this.folderService.create(folderName, parentFolderKey, userId);

    return 'Folder created';
  }

  @Delete(':folderKey')
  @HttpCode(200)
  async deleteFolder(
    @Body(new TypiaValidationPipe(validateUserRequestBody))
    deleteFolder: IUserRequestBody,
    @Param('folderKey', new ParseUUIDPipe()) folderKey: string,
  ): Promise<string> {
    const userId = deleteFolder.userId;

    await this.folderService.delete(folderKey, userId);

    return 'Folder deleted';
  }

  @Post('read/:folderKey')
  @HttpCode(200)
  async readFolder(
    @Body(new TypiaValidationPipe(validateUserRequestBody))
    readFolder: IUserRequestBody,
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
    const userId = readFolder.userId;

    return this.folderService.read(folderKey, userId);
  }
}
