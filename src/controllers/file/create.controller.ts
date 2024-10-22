import {
  BadRequestException,
  Controller,
  HttpCode,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { access_role, file_type } from '@prisma/client';
import { MemberGuard } from 'src/guards/member.guard';
import { RoleGuard } from 'src/guards/role.guard';
import { CustomResponse } from 'src/interfaces/response';
import { StringLengthPipe } from 'src/pipes/string.pipe';
import { FileCreateService } from 'src/services/file/create.service';
import { FileReadService } from 'src/services/file/read.service';

@Controller('file')
@UseGuards(MemberGuard)
export class FileWriteController {
  constructor(
    private readonly fileWriteService: FileCreateService,
    private readonly fileReadService: FileReadService,
  ) {}

  @Post('container/:fileKey')
  @HttpCode(201)
  @UseGuards(RoleGuard(access_role.create))
  async createContainerFile(
    @Param('fileKey') parentKey: string,
    @Query('memberId') memberId: number,
    @Query('file_name', new StringLengthPipe(1, 255)) fileName: string,
  ) {
    const parentFile = await this.fileReadService.getFile(parentKey);
    if (parentFile.type !== file_type.container) {
      throw new BadRequestException('Parent file is not a container');
    }
    const data = await this.fileWriteService.createContainer(
      memberId,
      parentFile.id,
      fileName,
    );
    const response: CustomResponse<{
      fileKey: string;
      fileName: string;
      type: file_type;
    }> = {
      status: 201,
      message: 'Container file created',
      data: {
        fileKey: data.file_key,
        fileName: data.file_name,
        type: data.type,
      },
    };

    return response;
  }
}
