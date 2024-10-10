import {
  Controller,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { access_role, file_type } from '@prisma/client';
import { MemberGuard } from 'src/guards/member.guard';
import { RoleGuard } from 'src/guards/role.guard';
import { CustomResponse } from 'src/interfaces/response';
import { StringLengthPipe } from 'src/pipes/string.pipe';
import { UploadService } from 'src/services/upload.service';

@Controller('file/upload')
@UseGuards(MemberGuard)
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Get('write-token/:fileKey')
  @HttpCode(201)
  @UseGuards(RoleGuard(access_role.create))
  async issueWriteToken(
    @Param('fileKey') fileKey: string,
    @Query('memberId') memberId: number,
    @Query('file_name', new StringLengthPipe(1, 255)) fileName: string,
    @Query('byte_size', ParseIntPipe) byteSize: number,
  ) {
    const data = await this.uploadService.issueWriteToken(
      memberId,
      fileKey,
      fileName,
      byteSize,
    );
    const response: CustomResponse<{
      token: string;
      fileKey: string;
    }> = {
      status: 201,
      message: 'Block file created',
      data: {
        token: data.token,
        fileKey: data.fileKey,
      },
    };

    return response;
  }

  @Patch('complete/:fileKey')
  @HttpCode(201)
  async completeUpload(
    @Param('fileKey') fileKey: string,
    @Query('total_chunks', ParseIntPipe) totalChunks: number,
  ) {
    const data = await this.uploadService.completeUpload(fileKey, totalChunks);
    const response: CustomResponse<{
      fileKey: string;
      fileName: string;
      type: file_type;
    }> = {
      status: 201,
      message: 'Block file merged',
      data: {
        fileKey: data.file_key,
        fileName: data.file_name,
        type: data.type,
      },
    };

    return response;
  }
}
