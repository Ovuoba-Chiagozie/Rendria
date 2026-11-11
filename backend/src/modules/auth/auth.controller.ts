import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { SessionAuthGuard } from '../../common/guards/session-auth.guard';
import { env } from '../../config';
import type { User } from '../users/user.types';
import { AuthService } from './auth.service';

@Controller('app/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  async signup(
    @Body() body: Record<string, unknown>,
    @Res({ passthrough: true }) response: Response,
  ) {
    const output = await this.authService.signup(body);
    this.setToken(response, output.token);
    return {
      message: output.message,
      user: output.user,
      apiKey: output.apiKey,
    };
  }

  @Post('login')
  async login(
    @Body() body: Record<string, unknown>,
    @Res({ passthrough: true }) response: Response,
  ) {
    const output = await this.authService.login(body);
    this.setToken(response, output.token);
    return { message: output.message, user: output.user };
  }

  @Get('me')
  @UseGuards(SessionAuthGuard)
  me(@CurrentUser() user: User) {
    return {
      message: 'Fetched user',
      user: { _id: user.id, email: user.email, name: user.name },
    };
  }

  @Post('logout')
  @HttpCode(200)
  @UseGuards(SessionAuthGuard)
  logout(@Res({ passthrough: true }) response: Response) {
    response.clearCookie('token', this.cookieOptions());
    return { message: 'Logged out successfully' };
  }

  private setToken(response: Response, token: string) {
    response.cookie('token', token, {
      ...this.cookieOptions(),
      maxAge: 604800000,
    });
  }

  private cookieOptions() {
    return {
      httpOnly: true,
      secure: env.production,
      sameSite: 'lax' as const,
      path: '/',
    };
  }
}
