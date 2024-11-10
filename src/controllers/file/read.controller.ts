import {
  Controller,
  Get,
  HttpCode,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { access_role, file_type } from '@prisma/client';
import { MemberGuard } from 'src/guards/member.guard';
import { RoleGuard } from 'src/guards/role.guard';
import { CustomResponse } from 'src/interfaces/response';
import { StringLengthPipe } from 'src/pipes/string.pipe';
import { FileReadService } from 'src/services/file/read.service';
import { TokenService } from 'src/services/storage/token.service';

@Controller('file')
@UseGuards(MemberGuard)
export class FileReadController {
  constructor(
    private readonly fileReadService: FileReadService,
    private readonly tokenService: TokenService,
  ) {}

  @Get('storage/:fileKey')
  @HttpCode(200)
  @UseGuards(RoleGuard(access_role.read))
  async getFile(@Param('fileKey') fileKey: string) {
    const data = await this.tokenService.issueReadToken(fileKey);
    const response: CustomResponse<{
      token: string;
    }> = {
      message: 'Token issued',
      data: {
        token: data,
      },
    };
    return response;
  }

  @Get('root')
  @HttpCode(200)
  async getRootContainer(@Query('memberId') memberId: number) {
    const data = await this.fileReadService.getSpecialContainer(
      memberId,
      'root',
    );
    const response: CustomResponse<{
      fileKey: string;
      fileName: string;
      type: file_type;
    }> = {
      message: 'Root file found',
      data: {
        fileKey: data.file_key,
        fileName: data.file_name,
        type: data.type,
      },
    };
    return response;
  }

  @Get('home')
  @HttpCode(200)
  async getHomeContainer(@Query('memberId') memberId: number) {
    const data = await this.fileReadService.getSpecialContainer(
      memberId,
      'home',
    );
    const response: CustomResponse<{
      fileKey: string;
      fileName: string;
      type: file_type;
    }> = {
      message: 'Home file found',
      data: {
        fileKey: data.file_key,
        fileName: data.file_name,
        type: data.type,
      },
    };
    return response;
  }

  @Get('trash')
  @HttpCode(200)
  async getTrashContainer(@Query('memberId') memberId: number) {
    const data = await this.fileReadService.getSpecialContainer(
      memberId,
      'trash',
    );
    const response: CustomResponse<{
      fileKey: string;
      fileName: string;
      type: file_type;
    }> = {
      message: 'Trash file found',
      data: {
        fileKey: data.file_key,
        fileName: data.file_name,
        type: data.type,
      },
    };
    return response;
  }

  @Get('info/:fileKey')
  @HttpCode(200)
  @UseGuards(RoleGuard(access_role.read))
  async getFileInfo(@Param('fileKey') fileKey: string) {
    const file = await this.fileReadService.getFile(fileKey);
    const fileInfo = await this.fileReadService.getFileInfo(file.id);
    const response: CustomResponse<{
      fileName: string;
      type: file_type;
      createDate: Date;
      updateDate: Date;
      byteSize: number;
    }> = {
      message: 'File info found',
      data: {
        fileName: file.file_name,
        type: file.type,
        createDate: fileInfo.create_date,
        updateDate: fileInfo.update_date,
        byteSize: fileInfo.byte_size,
      },
    };
    return response;
  }

  @Get('parent/:fileKey')
  @HttpCode(200)
  @UseGuards(RoleGuard(access_role.read))
  async getParentFile(@Param('fileKey') fileKey: string) {
    const file = await this.fileReadService.getFile(fileKey);
    const data = await this.fileReadService.getParentFile(file.id);
    const response: CustomResponse<{
      fileKey: string;
      fileName: string;
      type: file_type;
    }> = {
      message: 'File parent found',
      data: {
        fileKey: data.file_key,
        fileName: data.file_name,
        type: data.type,
      },
    };
    return response;
  }

  @Get('children/:fileKey')
  @HttpCode(200)
  @UseGuards(RoleGuard(access_role.read))
  async getChildrenFiles(@Param('fileKey') fileKey: string) {
    const file = await this.fileReadService.getFile(fileKey);
    const data = await this.fileReadService.getChildFiles(file.id);
    const response: CustomResponse<
      {
        fileKey: string;
        fileName: string;
        type: file_type;
      }[]
    > = {
      message: 'File children found',
      data: data.map((child) => ({
        fileKey: child.file_key,
        fileName: child.file_name,
        type: child.type,
      })),
    };
    return response;
  }

  @Get('find/:fileKey')
  @HttpCode(200)
  @UseGuards(RoleGuard(access_role.read))
  async findFile(
    @Param('fileKey') fileKey: string,
    @Query('file_name', new StringLengthPipe(1, 255)) fileName: string,
  ) {
    const file = await this.fileReadService.getFile(fileKey);
    const data = await this.fileReadService.findFileByFileName(
      file.id,
      fileName,
    );
    const response: CustomResponse<
      {
        fileKey: string;
        fileName: string;
        type: file_type;
      }[]
    > = {
      message: 'File found',
      data: data.map((file) => ({
        fileKey: file.file_key,
        fileName: file.file_name,
        type: file.type,
      })),
    };
    return response;
  }

  @Get('link-target/:fileKey')
  @HttpCode(200)
  @UseGuards(RoleGuard(access_role.read))
  async getLinkTarget(@Param('fileKey') fileKey: string) {
    const file = await this.fileReadService.getFile(fileKey);
    const data = await this.fileReadService.getLinkTargetFile(file.id);
    const response: CustomResponse<{
      fileKey: string;
      fileName: string;
      type: file_type;
    }> = {
      message: 'Link target found',
      data: {
        fileKey: data.file_key,
        fileName: data.file_name,
        type: data.type,
      },
    };
    return response;
  }
}
