import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import {
  ICreateFolderRequestBody,
  IDeleteFolderRequestBody,
  validateCreateFolderRequestBody,
  validateDeleteFolderRequestBody,
} from 'src/interfaces/folder.interface';
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

    await this.folderService.create({
      folderName,
      parentFolderKey,
      userId,
    });

    return 'Folder created';
  }

  @Post('delete')
  @HttpCode(200)
  async deleteFolder(
    @Body(new TypiaValidationPipe(validateDeleteFolderRequestBody))
    deleteFolder: IDeleteFolderRequestBody,
  ): Promise<string> {
    const { folderKey } = deleteFolder.data;

    await this.folderService.delete({ folderKey });

    return 'Folder deleted';
  }
}
