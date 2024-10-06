import {
  Controller,
  HttpCode,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { access_role } from '@prisma/client';
import { MemberGuard } from 'src/guards/member.guard';
import { RoleGuard } from 'src/guards/role.guard';
import { CustomResponse } from 'src/interfaces/response';
import { FileCreateService } from 'src/services/file/create.service';

@Controller('file')
@UseGuards(MemberGuard)
export class FileWriteController {
  constructor(private readonly fileWriteService: FileCreateService) {}

  @Post('container/:parentKey')
  @HttpCode(201)
  @UseGuards(RoleGuard(access_role.create))
  async createContainerFile(
    @Param('parentKey') parentKey: string,
    @Query('memberId') memberId: number,
    @Query('fileName') fileName: string,
  ) {
    const data = await this.fileWriteService.createContainer(
      memberId,
      parentKey,
      fileName,
    );
    const response: CustomResponse<{
      fileKey: string;
      fileName: string;
      type: string;
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
