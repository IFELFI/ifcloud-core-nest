import {
  Controller,
  Delete,
  Get,
  HttpCode,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { MemberGuard } from 'src/guards/member.guard';
import { CustomResponse } from 'src/interfaces/response';
import { MemberService } from 'src/services/member.service';

@Controller('member')
export class MemberController {
  constructor(private memberService: MemberService) {}

  @Get()
  @HttpCode(200)
  async getMember(@Query('uuidKey', new ParseUUIDPipe()) uuidKey: string) {
    const data = await this.memberService.getMember(uuidKey);
    const response: CustomResponse<typeof data> = {
      status: 200,
      message: 'Member found',
      data: data,
    };
    return response;
  }

  @Post()
  @HttpCode(201)
  async createMember(@Query('uuidKey', new ParseUUIDPipe()) uuidKey: string) {
    const data = await this.memberService.createMember(uuidKey);
    const response: CustomResponse<typeof data> = {
      status: 201,
      message: 'Member created',
      data: data,
    };
    return response;
  }

  @Delete()
  @HttpCode(200)
  @UseGuards(MemberGuard)
  async deleteMember(@Query('uuidKey', new ParseUUIDPipe()) uuidKey: string) {
    const data = await this.memberService.deleteMember(uuidKey);
    const response: CustomResponse<typeof data> = {
      status: 200,
      message: 'Member deleted',
      data: data,
    };
    return response;
  }

  @Get('status')
  @HttpCode(200)
  async getAllMembers(@Query('uuidKey', new ParseUUIDPipe()) uuidKey: string) {
    const data = await this.memberService.getMemberServiceStatus(uuidKey);
    const response: CustomResponse<typeof data> = {
      status: 200,
      message: 'Service status found',
      data: data,
    };
    return response;
  }
}
