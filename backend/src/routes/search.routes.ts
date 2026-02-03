import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();
const prisma = new PrismaClient();

router.use(authenticate);

/**
 * GET /api/search?q=query&conversationId=optional
 * Search messages across conversations
 */
router.get('/', async (req, res) => {
  try {
    const { q: query, conversationId } = req.query;

    if (!query || typeof query !== 'string') {
      return res.status(400).json({ error: 'Search query required' });
    }

    const whereClause: any = {
      OR: [
        { content: { contains: query, mode: 'insensitive' } },
        { translatedContent: { contains: query, mode: 'insensitive' } },
      ],
      conversation: {
        OR: [
          { doctorId: req.userId },
          { patientId: req.userId },
        ],
      },
    };

    if (conversationId) {
      whereClause.conversationId = conversationId;
    }

    const messages = await prisma.message.findMany({
      where: whereClause,
      include: {
        conversation: {
          select: {
            id: true,
            doctor: { select: { name: true } },
            patient: { select: { name: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    res.json(messages);
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Search failed' });
  }
});

export default router;
