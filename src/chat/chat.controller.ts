import { Body, Controller, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AuthenticatedRequest } from '../auth/types/authenticated-request.type';
import { ChatService } from './chat.service';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { CreateMessageDto } from './dto/create-message.dto';

@Controller('chat')
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get('conversations')
  getConversations(@Req() req: AuthenticatedRequest) {
    return this.chatService.getConversations(req.user);
  }

  @Post('conversations')
  createConversation(
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreateConversationDto,
  ) {
    return this.chatService.createConversation(req.user, dto);
  }

  @Get('conversations/:id/messages')
  getMessages(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.chatService.getMessages(id, req.user);
  }

  @Post('conversations/:id/messages')
  createMessage(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: CreateMessageDto,
  ) {
    return this.chatService.createMessage(id, req.user, dto.body);
  }

  @Patch('conversations/:id/read')
  markRead(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.chatService.markRead(id, req.user);
  }
}
