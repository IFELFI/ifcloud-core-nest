import {
  Controller,
  Get,
  HttpCode,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { access_role } from '@prisma/client';
import { MemberGuard } from 'src/guards/member.guard';
import { RoleGuard } from 'src/guards/role.guard';
import { CustomResponse } from 'src/interfaces/response';
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
    const response: CustomResponse<typeof data> = {
      status: 200,
      message: 'Token issued',
      data: data,
    };
    return response;
  }

  @Get('root')
  @HttpCode(200)
  async getRootFile(@Query('memberId') memberId: number) {
    const data = await this.fileReadService.getRootFile(memberId);
    const response: CustomResponse<typeof data> = {
      status: 200,
      message: 'Root file found',
      data: data,
    };
    return response;
  }

  @Get('info/:fileKey')
  @HttpCode(200)
  @UseGuards(RoleGuard(access_role.read))
  async getFileInfo(@Param('fileKey') fileKey: string) {
    const file = await this.fileReadService.getFile(fileKey);
    const data = await this.fileReadService.getFileInfo(file.id);
    const response: CustomResponse<typeof data> = {
      status: 200,
      message: 'File info found',
      data: data,
    };
    return response;
  }

  @Get('parent/:fileKey')
  @HttpCode(200)
  @UseGuards(RoleGuard('read'))
  async getParentFile(@Param('fileKey') fileKey: string) {
    const file = await this.fileReadService.getFile(fileKey);
    const data = await this.fileReadService.getParentFile(file.id);
    const response: CustomResponse<typeof data> = {
      status: 200,
      message: 'File parent found',
      data: data,
    };
    return response;
  }

  @Get('children/:fileKey')
  @HttpCode(200)
  @UseGuards(RoleGuard('read'))
  async getChildrenFiles(@Param('fileKey') fileKey: string) {
    const file = await this.fileReadService.getFile(fileKey);
    const data = await this.fileReadService.getChildFiles(file.id);
    const response: CustomResponse<typeof data> = {
      status: 200,
      message: 'File children found',
      data: data,
    };
    return response;
  }

  @Get('find/:fileKey')
  @HttpCode(200)
  @UseGuards(RoleGuard(access_role.read))
  async findFile(
    @Param('fileKey') fileKey: string,
    @Query('fileName') fileName: string,
  ) {
    const file = await this.fileReadService.getFile(fileKey);
    const data = await this.fileReadService.findFileByFileName(
      file.id,
      fileName,
    );
    const response: CustomResponse<typeof data> = {
      status: 200,
      message: 'File found',
      data: data,
    };
    return response;
  }
}
