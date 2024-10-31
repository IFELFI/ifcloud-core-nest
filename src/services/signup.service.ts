import { Injectable } from '@nestjs/common';
import { FileCreateService } from './file/create.service';
import { MemberService } from './member/member.service';
import { SpecialContainerNameSchema } from '../schemas/file.schema';

/**
 * Signup service
 * Create a new member and root file
 * @category Signup
 * @class SignupService
 * @param memberService - The member service
 * @param fileCreateService - The file create service
 */

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
    const root = await this.fileCreateService
      .createRootFile(member.id)
      .catch((e) => {
        this.memberService.deleteMember(member.uuid_key);
        throw e;
      });

    const [home, trash] = await Promise.all([
      this.fileCreateService.createContainer(
        member.id,
        root.id,
        SpecialContainerNameSchema.enum.home,
      ),
      this.fileCreateService.createContainer(
        member.id,
        root.id,
        SpecialContainerNameSchema.enum.trash,
      ),
    ]).catch((e) => {
      this.memberService.deleteMember(member.uuid_key);
      throw e;
    });

    await this.fileCreateService
      .createLink(
        member.id,
        home.id,
        SpecialContainerNameSchema.enum.trash,
        trash.id,
      )
      .catch((e) => {
        this.memberService.deleteMember(member.uuid_key);
        throw e;
      });

    return member;
  }
}
