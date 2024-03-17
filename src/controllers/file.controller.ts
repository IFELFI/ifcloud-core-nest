import {
  Body,
  Controller,
  Get,
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
import { access_role } from '@prisma/client';
import { Response } from 'express';
import { AuthGuard } from 'src/guards/auth.guard';
import { RoleGuard } from 'src/guards/role.guard';
import { UserGuard } from 'src/guards/user.guard';
import { RangeInterceptor } from 'src/interceptors/range.interceptor';
import {
  IUploadFileRequestBody,
  validateUploadFileRequestBody,
} from 'src/interfaces/file.interface';
import { ParseRangePipe } from 'src/pipes/parseRange.pipe';
import { ParseResolutionPipe } from 'src/pipes/parseResolution.pipe';
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
    const stream = await this.fileService.downloadFile(fileKey);
    response.status(200);
    stream.pipe(response);
  }

  @Get('stream/:folderKey/:fileKey')
  @UseGuards(RoleGuard(access_role.read))
  @UseInterceptors(RangeInterceptor)
  async streamFile(
    @Param('fileKey', new ParseUUIDPipe()) fileKey: string,
    @Query('resolution', ParseResolutionPipe) resolution: string,
    @Query('range', ParseRangePipe) start: number,
    @Res() response: Response,
  ): Promise<void> {
    const { stream, end, fileSize } = await this.fileService.streamVideo(
      fileKey,
      start,
      resolution,
    );
    const headers = {
      'Content-Range': `bytes ${start}-${end}/${fileSize}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': end - start,
      'Content-Type': 'video/mp4',
    };
    response.writeHead(206, headers);
    stream.pipe(response);
  }
}
