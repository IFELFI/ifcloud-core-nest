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
    const response: CustomResponse<typeof data> = {
      status: 201,
      message: 'Container file created',
      data: data,
    };

    return response;
  }
}
