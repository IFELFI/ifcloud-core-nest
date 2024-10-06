import { Injectable } from '@nestjs/common';
import { FileCreateService } from './file/create.service';
import { MemberService } from './member/member.service';

@Injectable()
export class SignupService {
  constructor(
    private readonly memberService: MemberService,
    private readonly fileCreateService: FileCreateService,
  ) {}

  /**
   * Create a new member and root file
   * @param uuidKey - The UUID key of the member
   * @returns The created member
   * @example
   * createMember('123e4567-e89b-12d3-a456-426614174000');
   * Returns the created member
   */
  async signup(uuidKey: string) {
    const member = await this.memberService.createMember(uuidKey);
    await this.fileCreateService.createRootFile(member.id);
    return member;
  }
}
