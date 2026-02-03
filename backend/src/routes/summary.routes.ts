import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middleware/auth.middleware';
import { aiService } from '../services/ai.service';

const router = Router();
const prisma = new PrismaClient();

router.use(authenticate);

/**
 * POST /api/summaries/:conversationId
 * Generate AI summary for conversation
 */
router.post('/:conversationId', async (req, res) => {
  try {
    const { conversationId } = req.params;

    // Verify user has access to conversation
    const conversation = await prisma.conversation.findFirst({
      where: {
        id: conversationId,
        OR: [
          { doctorId: req.userId },
          { patientId: req.userId },
        ],
      },
    });

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    // Get all messages
    const messages = await prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
      include: {
        sender: { select: { role: true } },
      },
    });

    if (messages.length === 0) {
      return res.status(400).json({ error: 'No messages to summarize' });
    }

    // Format messages for AI
    const formattedMessages = messages.map(msg => ({
      role: msg.sender.role.toLowerCase(),
      content: msg.content,
    }));

    // Generate summary
    const summaryData = await aiService.generateMedicalSummary(formattedMessages);

    // Save or update summary
    const summary = await prisma.summary.upsert({
      where: { conversationId },
      update: {
        content: summaryData.summary,
        symptoms: summaryData.symptoms,
        diagnoses: summaryData.diagnoses,
        medications: summaryData.medications,
        followUpActions: summaryData.followUpActions,
        updatedAt: new Date(),
      },
      create: {
        conversationId,
        content: summaryData.summary,
        symptoms: summaryData.symptoms,
        diagnoses: summaryData.diagnoses,
        medications: summaryData.medications,
        followUpActions: summaryData.followUpActions,
      },
    });

    res.json(summary);
  } catch (error) {
    console.error('Summary generation error:', error);
    res.status(500).json({ error: 'Failed to generate summary' });
  }
});

/**
 * GET /api/summaries/:conversationId
 * Get existing summary
 */
router.get('/:conversationId', async (req, res) => {
  try {
    const { conversationId } = req.params;

    const summary = await prisma.summary.findUnique({
      where: { conversationId },
    });

    if (!summary) {
      return res.status(404).json({ error: 'Summary not found' });
    }

    res.json(summary);
  } catch (error) {
    console.error('Summary fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch summary' });
  }
});

export default router;
