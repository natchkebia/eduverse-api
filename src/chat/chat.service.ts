import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ChatService {
  constructor(private readonly prisma: PrismaService) {}

  private isAdmin(role: Role) {
    return role === Role.ADMIN || role === Role.SUPER_ADMIN;
  }

  private async getConversationForAccess(
    conversationId: string,
    user: { id: string; role: Role },
  ) {
    const conversation = await this.prisma.chatConversation.findUnique({
      where: { id: conversationId },
      include: { user: true },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    if (!this.isAdmin(user.role) && conversation.userId !== user.id) {
      throw new ForbiddenException('You can access only your own conversation');
    }

    return conversation;
  }

  getConversations(user: { id: string; role: Role }) {
    return this.prisma.chatConversation.findMany({
      where: this.isAdmin(user.role) ? {} : { userId: user.id },
      orderBy: { lastMessageAt: 'desc' },
      include: {
        user: true,
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: { sender: true },
        },
      },
    });
  }

  async createConversation(
    user: { id: string; role: Role },
    dto: { subject?: string; message?: string },
  ) {
    if (this.isAdmin(user.role)) {
      throw new BadRequestException(
        'Admins reply to existing user conversations',
      );
    }

    const message = dto.message?.trim();
    return this.prisma.chatConversation.create({
      data: {
        userId: user.id,
        subject: dto.subject?.trim() || null,
        userReadAt: new Date(),
        ...(message
          ? {
              lastMessageAt: new Date(),
              messages: {
                create: {
                  senderId: user.id,
                  body: message,
                },
              },
            }
          : {}),
      },
      include: {
        user: true,
        messages: { orderBy: { createdAt: 'asc' }, include: { sender: true } },
      },
    });
  }

  async getMessages(conversationId: string, user: { id: string; role: Role }) {
    await this.getConversationForAccess(conversationId, user);
    return this.prisma.chatMessage.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
      include: { sender: true },
    });
  }

  async createMessage(
    conversationId: string,
    user: { id: string; role: Role },
    body: string,
  ) {
    await this.getConversationForAccess(conversationId, user);
    const messageBody = body.trim();
    if (!messageBody) {
      throw new BadRequestException('Message body is required');
    }

    const now = new Date();
    return this.prisma.$transaction(async (tx) => {
      const message = await tx.chatMessage.create({
        data: {
          conversationId,
          senderId: user.id,
          body: messageBody,
        },
        include: { sender: true },
      });

      await tx.chatConversation.update({
        where: { id: conversationId },
        data: {
          lastMessageAt: now,
          ...(this.isAdmin(user.role)
            ? { adminReadAt: now }
            : { userReadAt: now }),
        },
      });

      return message;
    });
  }

  async markRead(conversationId: string, user: { id: string; role: Role }) {
    await this.getConversationForAccess(conversationId, user);
    const now = new Date();
    return this.prisma.chatConversation.update({
      where: { id: conversationId },
      data: this.isAdmin(user.role) ? { adminReadAt: now } : { userReadAt: now },
    });
  }
}
