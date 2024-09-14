import {
  Controller,
  ForbiddenException,
  HttpCode,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { access_role } from '@prisma/client';
import { RoleGuard } from 'src/guards/role.guard';
import { CustomResponse } from 'src/interfaces/response';
import { FileRoleService } from 'src/services/file/role.service';
import { FileUpdateService } from 'src/services/file/update.service';

@Controller('file/update')
export class FileUpdateController {
  constructor(
    private readonly fileUpdateService: FileUpdateService,
    private readonly fileRoleService: FileRoleService,
  ) {}

  @Post('name/:fileKey')
  @HttpCode(200)
  @UseGuards(RoleGuard(access_role.update))
  async updateFileName(
    @Param('fileKey') fileKey: string,
    @Query('fileName') fileName: string,
  ) {
    const data = await this.fileUpdateService.updateFileName(fileKey, fileName);
    const response: CustomResponse<typeof data> = {
      status: 200,
      message: 'File name updated',
      data: data,
    };

    return response;
  }

  @Post('parent/:fileKey')
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
    const response: CustomResponse<typeof data> = {
      status: 200,
      message: 'File parent updated',
      data: data,
    };

    return response;
  }
}
