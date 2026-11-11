import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ApiKeyAuthGuard } from '../../common/guards/api-key-auth.guard';
import { SessionAuthGuard } from '../../common/guards/session-auth.guard';
import type { User } from '../users/user.types';
import { BatchRenderService } from './batch-render.service';
import { RenderingService } from './rendering.service';

@Controller()
export class RenderingController {
  constructor(
    private readonly rendering: RenderingService,
    private readonly batches: BatchRenderService,
  ) {}

  @Post('v1/render')
  @UseGuards(ApiKeyAuthGuard)
  render(@CurrentUser() user: User, @Body() body: Record<string, unknown>) {
    return this.rendering.render(user, body);
  }

  @Post('v1/render/batch')
  @UseGuards(ApiKeyAuthGuard)
  batch(@CurrentUser() user: User, @Body() body: Record<string, unknown>) {
    return this.batches.batch(user, body);
  }

  @Get('app/renders')
  @UseGuards(SessionAuthGuard)
  list(@CurrentUser() user: User) {
    return this.rendering.listRenders(user);
  }

  @Get('app/renders/batches')
  @UseGuards(SessionAuthGuard)
  listBatches(@CurrentUser() user: User) {
    return this.rendering.listBatches(user);
  }

  @Get('app/renders/batches/:id')
  @UseGuards(SessionAuthGuard)
  getBatch(@CurrentUser() user: User, @Param('id') id: string) {
    return this.rendering.getBatch(user, id);
  }

  @Delete('app/renders/:id')
  @UseGuards(SessionAuthGuard)
  delete(@CurrentUser() user: User, @Param('id') id: string) {
    return this.rendering.deleteRender(user, id);
  }
}
