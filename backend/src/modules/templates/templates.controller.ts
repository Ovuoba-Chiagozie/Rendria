import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { SessionAuthGuard } from '../../common/guards/session-auth.guard';
import type { User } from '../users/user.types';
import { TemplatesService } from './templates.service';

@Controller('app/templates')
@UseGuards(SessionAuthGuard)
export class TemplatesController {
  constructor(private readonly templates: TemplatesService) {}

  @Get()
  list(@CurrentUser() user: User) {
    return this.templates.listTemplates(user);
  }

  @Post()
  create(@CurrentUser() user: User, @Body() body: Record<string, unknown>) {
    return this.templates.createTemplate(user, body);
  }

  @Get(':id')
  get(@CurrentUser() user: User, @Param('id') id: string) {
    return this.templates.getTemplate(user, id);
  }

  @Put(':id')
  update(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
  ) {
    return this.templates.updateTemplate(user, id, body);
  }

  @Delete(':id')
  delete(@CurrentUser() user: User, @Param('id') id: string) {
    return this.templates.deleteTemplate(user, id);
  }

  @Post('upload-thumbnail')
  @UseInterceptors(
    FileInterceptor('thumbnail', {
      storage: memoryStorage(),
      limits: { fileSize: 10485760 },
    }),
  )
  uploadThumbnail(
    @CurrentUser() user: User,
    @UploadedFile() file: Express.Multer.File,
    @Body('templateId') templateId: string,
  ) {
    return this.templates.upload(
      user,
      String(templateId || ''),
      file,
      'thumbnail',
    );
  }

  @Post('upload-image')
  @UseInterceptors(
    FileInterceptor('image', {
      storage: memoryStorage(),
      limits: { fileSize: 10485760 },
    }),
  )
  uploadImage(
    @CurrentUser() user: User,
    @UploadedFile() file: Express.Multer.File,
    @Body('templateId') templateId: string,
    @Body('elementId') elementId: string,
  ) {
    return this.templates.upload(
      user,
      String(templateId || ''),
      file,
      'image',
      String(elementId || ''),
    );
  }
}
