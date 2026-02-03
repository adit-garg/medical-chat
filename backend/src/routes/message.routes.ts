import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { body } from 'express-validator';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { translationService } from '../services/translation.service';

const router = Router();
const prisma = new PrismaClient();

router.use(authenticate);

/**
 * POST /api/messages
 * Send a new message (auto-translates)
 */
router.post(
  '/',
  [
    body('conversationId').isUUID(),
    body('content').trim().notEmpty(),
    body('type').isIn(['TEXT', 'AUDIO']),
    body('audioData').optional(),
  ],
  validate,
  async (req, res) => {
    try {
      const { conversationId, content, type, audioData } = req.body;

      // Get conversation to determine target language
      const conversation = await prisma.conversation.findUnique({
        where: { id: conversationId },
        include: {
          doctor: true,
          patient: true,
        },
      });

      if (!conversation) {
        return res.status(404).json({ error: 'Conversation not found' });
      }

      const userRole = req.userRole!;
      const sourceLanguage = userRole === 'DOCTOR'
        ? conversation.doctorLanguage
        : conversation.patientLanguage;
      const targetLanguage = userRole === 'DOCTOR'
        ? conversation.patientLanguage
        : conversation.doctorLanguage;

      // Create message immediately (no translation yet) for fast live delivery
      const message = await prisma.message.create({
        data: {
          conversationId,
          senderId: req.userId!,
          senderRole: userRole as any,
          content,
          translatedContent: null,
          type: type as any,
          audioData: audioData || null,
        },
        include: { sender: { select: { id: true, name: true, role: true } } },
      });

      await prisma.conversation.update({
        where: { id: conversationId },
        data: { updatedAt: new Date() },
      });

      // Emit immediately so other client sees the message right away
      const io = req.app.get('io') as import('socket.io').Server;
      if (io) {
        io.to(`conversation:${conversationId}`).emit('message_created', message);
      }

      // Translate in background and update message + emit translation
      const needsTranslation = type === 'TEXT' && content !== '[Audio Message]' && sourceLanguage !== targetLanguage;
      if (needsTranslation) {
        translationService
          .translateText(content, targetLanguage, sourceLanguage)
          .then(async (translatedContent) => {
            await prisma.message.update({
              where: { id: message.id },
              data: { translatedContent },
            });
            if (io) {
              io.to(`conversation:${conversationId}`).emit('message_translated', {
                messageId: message.id,
                translation: translatedContent,
              });
            }
          })
          .catch((err) => console.error('Background translation failed:', err));
      }

      res.status(201).json(message);
    } catch (error) {
      console.error('Message creation error:', error);
      res.status(500).json({ error: 'Failed to send message' });
    }
  }
);

export default router;
