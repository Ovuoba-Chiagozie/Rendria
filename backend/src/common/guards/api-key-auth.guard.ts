import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { ApiKeysService } from '../../modules/api-keys/api-keys.service';
import type { AuthenticatedRequest } from '../decorators/current-user.decorator';

@Injectable()
export class ApiKeyAuthGuard implements CanActivate {
  constructor(private readonly keys: ApiKeysService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const authorization = request.header('authorization') || '';
    const key =
      authorization.replace(/^Bearer\s+/i, '') || request.header('x-api-key');
    request.user = await this.keys.apiKeyUser(key);
    return true;
  }
}
