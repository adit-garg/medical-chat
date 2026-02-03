import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { body } from 'express-validator';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';

const router = Router();
const prisma = new PrismaClient();

router.use(authenticate);

/**
 * PATCH /api/conversations/:id/language
 * Set current user's preferred language for this conversation (doctor → doctorLanguage, patient → patientLanguage)
 */
router.patch(
  '/:id/language',
  [body('language').isLength({ min: 2, max: 5 }).trim()],
  validate,
  async (req: Request, res: Response) => {
    try {
      const conversationId = req.params.id;
      const { language } = req.body;
      const userId = req.userId!;
      const userRole = req.userRole!;

      const conversation = await prisma.conversation.findFirst({
        where: {
          id: conversationId,
          OR: [{ doctorId: userId }, { patientId: userId }],
        },
      });
      if (!conversation) {
        return res.status(404).json({ error: 'Conversation not found' });
      }

      const update = userRole === 'DOCTOR'
        ? { doctorLanguage: language }
        : { patientLanguage: language };

      await prisma.conversation.update({
        where: { id: conversationId },
        data: update,
      });

      res.json({ ...conversation, ...update });
    } catch (error) {
      console.error('Update language error:', error);
      res.status(500).json({ error: 'Failed to update language' });
    }
  }
);

router.get('/', async (req: Request, res: Response) => {
  try {
    const conversations = await prisma.conversation.findMany({
      where: {
        OR: [{ doctorId: req.userId }, { patientId: req.userId }],
      },
      include: {
        doctor: { select: { id: true, name: true, email: true, language: true } },
        patient: { select: { id: true, name: true, email: true, language: true } },
        _count: { select: { messages: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });
    res.json(conversations);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch conversations' });
  }
});

router.get('/:id/messages', async (req: Request, res: Response) => {
  try {
    const messages = await prisma.message.findMany({
      where: { conversationId: req.params.id },
      include: { sender: { select: { id: true, name: true, role: true } } },
      orderBy: { createdAt: 'asc' },
    });
    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

export default router;
