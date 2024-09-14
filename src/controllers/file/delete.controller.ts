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

@Controller('file/delete')
@UseGuards(MemberGuard)
export class FileDeleteController {
  constructor(private readonly fileDeleteService: FileDeleteService) {}

  @Delete('permanant/:fileKey')
  @HttpCode(200)
  @UseGuards(RoleGuard(access_role.delete))
  async deleteContainerFile(@Param('fileKey') fileKey: string) {
    const data = await this.fileDeleteService.deleteFile(fileKey);
    const response: CustomResponse<typeof data> = {
      status: 200,
      message: 'Container file deleted',
      data: data,
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
    const response: CustomResponse<typeof data> = {
      status: 200,
      message: 'Container file trashed',
      data: data,
    };

    return response;
  }
}
