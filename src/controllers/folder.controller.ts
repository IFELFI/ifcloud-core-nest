import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import {
  ICreateFolderRequestBody,
  validateCreateFolderRequestBody,
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
    const { folderName, parentFolderId } = createFolder.data;

    await this.folderService.create({
      folderName,
      parentFolderId,
      userId,
    });

    return 'Folder created';
  }
}
