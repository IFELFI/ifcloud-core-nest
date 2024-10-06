import {
  Controller,
  ForbiddenException,
  HttpCode,
  Param,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { access_role, file_type } from '@prisma/client';
import { MemberGuard } from 'src/guards/member.guard';
import { RoleGuard } from 'src/guards/role.guard';
import { CustomResponse } from 'src/interfaces/response';
import { FileRoleService } from 'src/services/file/role.service';
import { FileUpdateService } from 'src/services/file/update.service';

@Controller('file')
@UseGuards(MemberGuard)
export class FileUpdateController {
  constructor(
    private readonly fileUpdateService: FileUpdateService,
    private readonly fileRoleService: FileRoleService,
  ) {}

  @Patch('name/:fileKey')
  @HttpCode(200)
  @UseGuards(RoleGuard(access_role.update))
  async updateFileName(
    @Param('fileKey') fileKey: string,
    @Query('fileName') fileName: string,
  ) {
    const data = await this.fileUpdateService.updateFileName(fileKey, fileName);
    const response: CustomResponse<{
      fileKey: string;
      fileName: string;
      type: file_type;
    }> = {
      status: 200,
      message: 'File name updated',
      data: {
        fileKey: data.file_key,
        fileName: data.file_name,
        type: data.type,
      },
    };

    return response;
  }

  @Patch('parent/:fileKey')
  @HttpCode(200)
  @UseGuards(RoleGuard(access_role.update))
  async updateFileParent(
    @Param('fileKey') fileKey: string,
    @Query('memberId') memberId: number,
    @Query('parentKey') parentKey: string,
  ) {
    const checkParentRole = await this.fileRoleService.checkRole(
      memberId,
      parentKey,
      access_role.update,
    );
    if (!checkParentRole) {
      throw new ForbiddenException('No permission to update parent');
    }

    const data = await this.fileUpdateService.updateFileParent(
      fileKey,
      parentKey,
    );
    const response: CustomResponse<{
      success: boolean;
    }> = {
      status: 200,
      message: 'File parent updated',
      data: {
        success: data,
      },
    };

    return response;
  }
}
