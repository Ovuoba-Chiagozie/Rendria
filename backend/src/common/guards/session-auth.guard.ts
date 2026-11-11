import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { AuthService } from '../../modules/auth/auth.service';
import type { AuthenticatedRequest } from '../decorators/current-user.decorator';

@Injectable()
export class SessionAuthGuard implements CanActivate {
  constructor(private readonly auth: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const cookies = request.cookies as unknown as
      Record<string, unknown> | undefined;
    const token = cookies?.token;
    request.user = await this.auth.userFromToken(
      typeof token === 'string' ? token : undefined,
    );
    return true;
  }
}
