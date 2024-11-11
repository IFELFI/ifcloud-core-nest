import {
  Controller,
  ForbiddenException,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { access_role, file_type } from '@prisma/client';
import { MemberGuard } from 'src/guards/member.guard';
import { RoleGuard } from 'src/guards/role.guard';
import { CustomResponse } from 'src/interfaces/response';
import { StringLengthPipe } from 'src/pipes/string.pipe';
import { FileReadService } from 'src/services/file/read.service';
import { FileRoleService } from 'src/services/file/role.service';
import { FileUpdateService } from 'src/services/file/update.service';

@Controller('file')
@UseGuards(MemberGuard)
export class FileUpdateController {
  constructor(
    private readonly fileUpdateService: FileUpdateService,
    private readonly fileReadService: FileReadService,
    private readonly fileRoleService: FileRoleService,
  ) {}

  @Patch('name/:fileKey')
  @HttpCode(200)
  @UseGuards(RoleGuard(access_role.update))
  async updateFileName(
    @Param('fileKey') fileKey: string,
    @Query('file_name', new StringLengthPipe(1, 255)) fileName: string,
  ) {
    const data = await this.fileUpdateService.updateFileName(fileKey, fileName);
    const response: CustomResponse<{
      fileKey: string;
      fileName: string;
      type: file_type;
    }> = {
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
    @Query('parent_key', ParseUUIDPipe) parentKey: string,
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
      message: 'File parent updated',
      data: {
        success: data,
      },
    };

    return response;
  }

  @Patch('trash/:fileKey')
  @HttpCode(200)
  @UseGuards(RoleGuard(access_role.update))
  async moveToTrash(
    @Param('fileKey') fileKey: string,
    @Query('memberId') memberId: number,
  ) {
    const trash = await this.fileReadService.getSpecialContainer(
      memberId,
      'trash',
    );
    const data = await this.fileUpdateService.updateFileParent(
      fileKey,
      trash.file_key,
    );
    const response: CustomResponse<{
      success: boolean;
    }> = {
      message: 'File moved to trash',
      data: {
        success: data,
      },
    };

    return response;
  }
}
