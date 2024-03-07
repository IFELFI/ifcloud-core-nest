import { UserService } from 'src/services/user.service';
import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { TypiaValidationPipe } from 'src/pipes/validation.pipe';
import { IVerifiedRequestBody } from 'src/interfaces/request.interface';
import { validateCreateUserRequestBody } from 'src/interfaces/user.interface';

@Controller('user')
export class UserController {
  constructor(private userService: UserService) {}

  @Post('enroll')
  @HttpCode(201)
  async createUser(
    @Body(new TypiaValidationPipe(validateCreateUserRequestBody))
    verifiedRequestBody: IVerifiedRequestBody,
  ): Promise<string> {
    const uuidKey = verifiedRequestBody.payload.uuidKey;
    await this.userService.create(uuidKey);
    return 'User created';
  }
}
