import { Controller, Get, HttpCode, Param, UseGuards } from '@nestjs/common';
import { access_role } from '@prisma/client';
import { MemberGuard } from 'src/guards/member.guard';
import { RoleGuard } from 'src/guards/role.guard';
import { CustomResponse } from 'src/interfaces/response';
import { StreamService } from 'src/services/stream.service';

@Controller('file/stream')
@UseGuards(MemberGuard)
export class StreamController {
  constructor(private readonly streamService: StreamService) {}

  @Get('read-token/:fileKey')
  @HttpCode(200)
  @UseGuards(RoleGuard(access_role.read))
  async issueReadToken(@Param('fileKey') fileKey: string) {
    const token = await this.streamService.issueReadToken(fileKey);

    const response: CustomResponse<{ token: string }> = {
      message: 'Read token issued',
      data: {
        token,
      },
    };

    return response;
  }
}
