import {
  Body,
  Controller,
  HttpCode,
  Param,
  ParseIntPipe,
  ParseUUIDPipe,
  Post,
  Query,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { AuthGuard } from 'src/guards/auth.guard';
import { UserGuard } from 'src/guards/user.guard';
import {
  IUploadFileRequestBody,
  validateUploadFileRequestBody,
} from 'src/interfaces/file.interface';
import { TypiaValidationPipe } from 'src/pipes/validation.pipe';
import { FileService } from 'src/services/file.service';

@Controller('file')
@UseGuards(AuthGuard, UserGuard)
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
    @Query('userId', ParseIntPipe) userId: number,
    @Res() response: Response,
  ): Promise<void> {
    const fileBuffer = file.buffer;
    const fileName = uploadFile.fileName;
    const totalChunks = parseInt(uploadFile.totalChunks);
    const chunkNumber = parseInt(uploadFile.chunkNumber);

    const result = await this.fileService.uploadFile(
      userId,
      folderKey,
      fileName,
      fileBuffer,
      chunkNumber,
      totalChunks,
    );

    if (result) {
      response.status(201).json({
        done: true,
        message: 'File uploaded',
        fileKey: result.fileKey,
      });
    } else {
      response.status(200).json({
        done: false,
        message: 'Chunk uploaded',
      });
    }
  }
}
