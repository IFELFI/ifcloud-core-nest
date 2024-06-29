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
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { access_role } from '@prisma/client';
import { Response } from 'express';
import { AuthGuard } from 'src/guards/auth.guard';
import { RoleGuard } from 'src/guards/role.guard';
import { UserGuard } from 'src/guards/user.guard';
import {
  IRenameFileRequestBody,
  IUploadFileRequestBody,
  validateRenameFileRequestBody,
  validateUploadFileRequestBody,
} from 'src/interfaces/file.interface';
import { FileValidatePipe } from 'src/pipes/file.validate.pipe';
import { TypiaValidationPipe } from 'src/pipes/validation.pipe';
import { FileService } from 'src/services/file.service';

@Controller('file')
@UseGuards(AuthGuard, UserGuard)
export class FileController {
  constructor(private fileService: FileService) {}

  @Post('upload/:folderKey')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        fileSize: 1024 * 1024 * 1024,
        fieldSize: 1024 * 1024 * 20,
      },
    }),
  )
  @UseGuards(RoleGuard(access_role.create))
  @HttpCode(201)
  async uploadFile(
    @UploadedFile(new FileValidatePipe()) file: Express.Multer.File,
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

    const result = await this.fileService.upload(
      userId,
      folderKey,
      fileName,
      fileBuffer,
      chunkNumber,
      totalChunks,
    );

    if (result.isDone) {
      response.status(201).json({
        done: true,
        message: 'File uploaded',
        fileKey: result.fileKey,
      });
    } else {
      response.status(206).json({
        done: false,
        message: 'Chunk uploaded',
      });
    }
  }

  @Get('download/:folderKey/:fileKey')
  @UseGuards(RoleGuard(access_role.read))
  async downloadFile(
    @Param('fileKey', new ParseUUIDPipe()) fileKey: string,
    @Res() response: Response,
  ): Promise<void> {
    const { stream, length } = await this.fileService.getOriginStream(fileKey);
    response.status(200);
    response.setHeader('Content-Length', length);
    stream.pipe(response);
  }

  @Delete(':folderKey/:fileKey')
  @UseGuards(RoleGuard(access_role.delete))
  @HttpCode(200)
  async deleteFile(
    @Param('fileKey', new ParseUUIDPipe()) fileKey: string,
  ): Promise<string> {
    await this.fileService.deleteFile(fileKey);
    return 'File deleted';
  }

  @Patch('rename/:folderKey/:fileKey')
  @UseGuards(RoleGuard(access_role.update))
  @HttpCode(200)
  async renameFile(
    @Param('fileKey', new ParseUUIDPipe()) fileKey: string,
    @Body(new TypiaValidationPipe(validateRenameFileRequestBody))
    renameFile: IRenameFileRequestBody,
  ): Promise<string> {
    await this.fileService.renameFile(fileKey, renameFile.fileName);
    return 'File renamed';
  }

  @Patch('move/:folderKey/:fileKey')
  @UseGuards(RoleGuard(access_role.update, true, access_role.update))
  @HttpCode(200)
  async moveFile(
    @Param('fileKey', new ParseUUIDPipe()) fileKey: string,
    @Query('targetKey', new ParseUUIDPipe()) targetFolderKey: string,
  ): Promise<string> {
    await this.fileService.updateParent(fileKey, targetFolderKey);
    return 'File moved';
  }
}
