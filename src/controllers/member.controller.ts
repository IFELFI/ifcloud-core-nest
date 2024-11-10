import {
  Controller,
  Delete,
  Get,
  HttpCode,
  NotFoundException,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { MemberGuard } from 'src/guards/member.guard';
import { CustomResponse } from 'src/interfaces/response';
import { MemberService } from 'src/services/member/member.service';
import { SignupService } from 'src/services/signup.service';

@Controller('member')
export class MemberController {
  constructor(
    private memberService: MemberService,
    private signupService: SignupService,
  ) {}

  @Get()
  @HttpCode(200)
  async getMember(@Query('uuidKey', ParseUUIDPipe) uuidKey: string) {
    const data = await this.memberService.getMember(uuidKey);
    if (!data) {
      throw new NotFoundException('Member not found');
    }
    const response: CustomResponse<{
      uuidKey: string;
    }> = {
      message: 'Member found',
      data: {
        uuidKey: data.uuid_key,
      },
    };
    return response;
  }

  @Post()
  @HttpCode(201)
  async createMember(@Query('uuidKey', ParseUUIDPipe) uuidKey: string) {
    const data = await this.signupService.signup(uuidKey);
    const response: CustomResponse<{
      uuidKey: string;
    }> = {
      message: 'Member created',
      data: {
        uuidKey: data.uuid_key,
      },
    };
    return response;
  }

  @Delete()
  @HttpCode(200)
  @UseGuards(MemberGuard)
  async deleteMember(@Query('uuidKey', ParseUUIDPipe) uuidKey: string) {
    const data = await this.memberService.deleteMember(uuidKey);
    const response: CustomResponse<{
      uuidKey: string;
    }> = {
      message: 'Member deleted',
      data: {
        uuidKey: data.uuid_key,
      },
    };
    return response;
  }

  @Get('status')
  @HttpCode(200)
  @UseGuards(MemberGuard)
  async getServiceStatus(@Query('uuidKey', ParseUUIDPipe) uuidKey: string) {
    const data = await this.memberService.getServiceStatusByKey(uuidKey);
    const response: CustomResponse<{
      available: boolean;
      joinDate: Date;
      updateDate: Date;
    }> = {
      message: 'Service status found',
      data: {
        available: data.available,
        joinDate: data.join_date,
        updateDate: data.update_date,
      },
    };
    return response;
  }
}
