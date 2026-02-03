import { Server, Socket } from 'socket.io';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import { translationService } from '../services/translation.service';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export const initializeSocketHandlers = (io: Server) => {
  // Authentication middleware
  io.use((socket: Socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Authentication error'));
      }

      const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; role: string };
      (socket as any).userId = decoded.userId;
      (socket as any).userRole = decoded.role;
      next();
    } catch (error) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket: Socket) => {
    const userId = (socket as any).userId;
    const userRole = (socket as any).userRole;

    logger.info(`User connected: ${userId} (${userRole})`);

    // Join conversation room
    socket.on('join_conversation', async (data: { conversationId: string; userId: string; role: string }) => {
      try {
        const { conversationId } = data;
        socket.join(`conversation:${conversationId}`);
        logger.info(`User ${userId} joined conversation ${conversationId}`);
      } catch (error) {
        logger.error('Join conversation error:', error);
        socket.emit('error', { message: 'Failed to join conversation' });
      }
    });

    // Send message
    socket.on('send_message', async (data: {
      conversationId: string;
      content: string;
      type: 'TEXT' | 'AUDIO';
      audioData?: string;
    }) => {
      try {
        const { conversationId, content, type, audioData } = data;

        // Get conversation
        const conversation = await prisma.conversation.findUnique({
          where: { id: conversationId },
        });

        if (!conversation) {
          return socket.emit('error', { message: 'Conversation not found' });
        }

        const sourceLanguage = userRole === 'DOCTOR'
          ? conversation.doctorLanguage
          : conversation.patientLanguage;
        const targetLanguage = userRole === 'DOCTOR'
          ? conversation.patientLanguage
          : conversation.doctorLanguage;

        // Save message immediately for fast delivery; translate in background
        const message = await prisma.message.create({
          data: {
            conversationId,
            senderId: userId,
            senderRole: userRole,
            content,
            translatedContent: null,
            type,
            audioData,
          },
          include: { sender: { select: { id: true, name: true, role: true } } },
        });

        io.to(`conversation:${conversationId}`).emit('message_created', message);

        const needsTranslation = type === 'TEXT' && content !== '[Audio Message]' && sourceLanguage !== targetLanguage;
        if (needsTranslation) {
          translationService
            .translateText(content, targetLanguage, sourceLanguage)
            .then(async (translatedContent) => {
              await prisma.message.update({
                where: { id: message.id },
                data: { translatedContent },
              });
              io.to(`conversation:${conversationId}`).emit('message_translated', {
                messageId: message.id,
                translation: translatedContent,
              });
            })
            .catch((err) => logger.error('Socket translation failed', err));
        }

        logger.debug(`Message sent in conversation ${conversationId}`);
      } catch (error) {
        logger.error('Send message error:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Typing indicator
    socket.on('typing', (data: { conversationId: string }) => {
      socket.to(`conversation:${data.conversationId}`).emit('user_typing', {
        userId,
        role: userRole,
      });
    });

    // Disconnect
    socket.on('disconnect', () => {
      logger.info(`User disconnected: ${userId}`);
    });
  });
};
