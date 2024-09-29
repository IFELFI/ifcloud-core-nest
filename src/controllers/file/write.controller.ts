import {
  Controller,
  Get,
  HttpCode,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { access_role } from '@prisma/client';
import { lastValueFrom } from 'rxjs';
import { MemberGuard } from 'src/guards/member.guard';
import { RoleGuard } from 'src/guards/role.guard';
import { CustomResponse } from 'src/interfaces/response';
import { FileWriteService } from 'src/services/file/write.service';
import { StorageService } from 'src/services/storage/storage.service';

@Controller('file/write')
//@UseGuards(MemberGuard)
export class FileWriteController {
  constructor(
    private readonly fileWriteService: FileWriteService,
    private readonly storageService: StorageService,
  ) {}

  @Post('container/:fileKey')
  @HttpCode(201)
  @UseGuards(RoleGuard(access_role.create))
  async createContainerFile(
    @Param('fileKey') fileKey: string,
    @Query('memberId') memberId: number,
    @Query('fileName') fileName: string,
  ) {
    const data = await this.fileWriteService.createContainer(
      memberId,
      fileKey,
      fileName,
    );
    const response: CustomResponse<typeof data> = {
      status: 201,
      message: 'Container file created',
      data: data,
    };

    return response;
  }

  @Post('block/:fileKey')
  @HttpCode(201)
  @UseGuards(RoleGuard(access_role.create))
  async createBlockFile(
    @Param('fileKey') fileKey: string,
    @Query('memberId') memberId: number,
    @Query('fileName') fileName: string,
    @Query('byteSize') byteSize: number,
  ) {
    const data = await this.fileWriteService.issueWriteToken(
      memberId,
      fileKey,
      fileName,
      byteSize,
    );
    const response: CustomResponse<typeof data> = {
      status: 201,
      message: 'Block file created',
      data: data,
    };

    return response;
  }

  @Get('block/:fileKey/merge')
  @HttpCode(201)
  //@UseGuards(RoleGuard(access_role.create))
  async mergeBlockFile(@Param('fileKey') fileKey: string) {
    const obs = this.storageService.mergeChunks(fileKey, 1);
    const data = await lastValueFrom(obs);
    const response: CustomResponse<typeof data> = {
      status: 201,
      message: 'Block file merged',
      data: data,
    };

    return response;
  }
}
