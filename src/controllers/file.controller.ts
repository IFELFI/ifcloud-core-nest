import {
  Body,
  Controller,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  IUploadFileRequestBody,
  validateUploadFileRequestBody,
} from 'src/interfaces/file.interface';
import { TypiaValidationPipe } from 'src/pipes/validation.pipe';
import { FileService } from 'src/services/file.service';

@Controller('file')
export class FileController {
  constructor(private fileService: FileService) {}

  @Post('upload/:folderKey')
  @UseInterceptors(FileInterceptor('file'))
  @HttpCode(201)
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Body(new TypiaValidationPipe(validateUploadFileRequestBody))
    uploadFile: IUploadFileRequestBody,
    @Param('folderKey', new ParseUUIDPipe()) folderKey: string,
  ): Promise<string> {
    const userId = uploadFile.userId;
    const fileName = uploadFile.data.fileName;
    const fileBuffer = file.buffer;
    const totalChunks = uploadFile.data.totalChunks;
    const chunkNumber = uploadFile.data.chunkNumber;

    const result = await this.fileService.uploadFile(
      userId,
      folderKey,
      fileName,
      fileBuffer,
      chunkNumber,
      totalChunks,
    );

    if (result) {
      return 'File uploaded';
    }
    return 'Chunk uploaded';
  }
}
