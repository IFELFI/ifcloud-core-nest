import {
  Controller,
  Delete,
  HttpCode,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { access_role } from '@prisma/client';
import { MemberGuard } from 'src/guards/member.guard';
import { RoleGuard } from 'src/guards/role.guard';
import { CustomResponse } from 'src/interfaces/response';
import { FileDeleteService } from 'src/services/file/delete.service';

@Controller('file')
@UseGuards(MemberGuard)
export class FileDeleteController {
  constructor(private readonly fileDeleteService: FileDeleteService) {}

  @Delete('permanant/:fileKey')
  @HttpCode(200)
  @UseGuards(RoleGuard(access_role.delete))
  async deleteContainerFile(@Param('fileKey') fileKey: string) {
    const data = await this.fileDeleteService.deleteFile(fileKey);
    const response: CustomResponse<{
      fileKey: string;
      fileName: string;
      type: string;
    }> = {
      status: 200,
      message: 'Container file deleted',
      data: {
        fileKey: data.file_key,
        fileName: data.file_name,
        type: data.type,
      },
    };

    return response;
  }

  @Delete('trash/:fileKey')
  @HttpCode(200)
  @UseGuards(RoleGuard(access_role.delete))
  async trashContainerFile(
    @Param('fileKey') fileKey: string,
    @Query('memberId') memberId: number,
  ) {
    const data = await this.fileDeleteService.moveToTrash(memberId, fileKey);
    const response: CustomResponse<{
      success: boolean;
    }> = {
      status: 200,
      message: 'Container file trashed',
      data: {
        success: data,
      },
    };

    return response;
  }
}
