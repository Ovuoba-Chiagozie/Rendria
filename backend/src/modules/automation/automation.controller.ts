import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { SessionAuthGuard } from '../../common/guards/session-auth.guard';
import type { User } from '../users/user.types';
import { AutomationService } from './automation.service';

@Controller('app/automation')
@UseGuards(SessionAuthGuard)
export class AutomationController {
  constructor(private readonly api: AutomationService) {}

  @Get(':id')
  async get(@CurrentUser() user: User, @Param('id') id: string) {
    return this.api.automation(user, id);
  }
}
