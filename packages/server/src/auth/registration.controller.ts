import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  Post,
} from '@nestjs/common';
import {
  type LoginResponse,
  type RegisterRequest,
  registerRequestSchema,
} from '@bustit/shared';
import { ZodValidationPipe } from '../infrastructure/validation/index.js';
import { InvalidInviteError } from '../invites/index.js';
import { UsernameTakenError } from '../users/index.js';
import { AuthTokenService } from './auth-token.service.js';
import { Public } from './public.js';
import { RegistrationService } from './registration.service.js';

@Controller('auth')
export class RegistrationController {
  constructor(
    private readonly registrationService: RegistrationService,
    private readonly authTokenService: AuthTokenService,
  ) {}

  /**
   * Creates a player account with an invite code and logs the new user in.
   * Unknown, used, revoked and expired codes fail alike.
   */
  @Public()
  @Post('register')
  async register(
    @Body(new ZodValidationPipe(registerRequestSchema)) body: RegisterRequest,
  ): Promise<LoginResponse> {
    try {
      const user = await this.registrationService.register(body);

      return await this.authTokenService.loginResponseFor(user);
    } catch (error) {
      if (error instanceof InvalidInviteError) {
        throw new BadRequestException('Invalid invite code');
      }

      if (error instanceof UsernameTakenError) {
        throw new ConflictException('Username is taken');
      }

      throw error;
    }
  }
}
