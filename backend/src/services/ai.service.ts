import OpenAI from 'openai';
import { logger } from '../utils/logger';

interface MedicalSummary {
  summary: string;
  symptoms: string[];
  diagnoses: string[];
  medications: string[];
  followUpActions: string[];
}

const DEFAULT_MODEL = 'gpt-4o-mini';

class AIService {
  private client: OpenAI | null = null;
  private enabled: boolean = false;
  private model: string;

  constructor() {
    this.model = process.env.OPENAI_SUMMARY_MODEL || DEFAULT_MODEL;
    try {
      if (process.env.OPENAI_API_KEY) {
        this.client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
        this.enabled = true;
        logger.info(`✅ AI service (OpenAI ${this.model}) initialized`);
      } else {
        logger.warn('⚠️  AI service disabled - no OPENAI_API_KEY provided');
      }
    } catch (error) {
      logger.error('❌ Failed to initialize AI service:', error);
      this.enabled = false;
    }
  }

  /**
   * Generate medical summary from conversation messages
   */
  async generateMedicalSummary(messages: Array<{ role: string; content: string }>): Promise<MedicalSummary> {
    try {
      if (!this.enabled || !this.client) {
        return this.generateMockSummary(messages);
      }

      const conversationText = messages
        .map(m => `${m.role.toUpperCase()}: ${m.content}`)
        .join('\n');

      const prompt = `You are a medical AI assistant. Analyze the following doctor-patient conversation and extract key medical information.

Conversation:
${conversationText}

Provide your response as a single JSON object only (no markdown, no extra text), with this exact structure:
{"summary":"Brief consultation summary in 2-3 sentences","symptoms":["symptom1","symptom2"],"diagnoses":["diagnosis1"],"medications":["medication1"],"followUpActions":["action1","action2"]}`;

      const response = await this.client.chat.completions.create({
        model: this.model,
        max_tokens: 1000,
        messages: [{ role: 'user', content: prompt }],
      });

      const text = response.choices[0]?.message?.content?.trim();
      if (text) {
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const result = JSON.parse(jsonMatch[0]) as MedicalSummary;
          logger.debug('Generated medical summary:', result);
          return result;
        }
      }

      return this.generateMockSummary(messages);
    } catch (error) {
      logger.error('AI summary generation error:', error);
      return this.generateMockSummary(messages);
    }
  }

  private generateMockSummary(messages: Array<{ role: string; content: string }>): MedicalSummary {
    const symptoms: string[] = [];
    const medications: string[] = [];
    const diagnoses: string[] = [];
    const allText = messages.map(m => m.content.toLowerCase()).join(' ');

    const symptomKeywords = ['pain', 'fever', 'headache', 'cough', 'nausea', 'fatigue', 'dizzy'];
    symptomKeywords.forEach(keyword => {
      if (allText.includes(keyword)) {
        symptoms.push(keyword.charAt(0).toUpperCase() + keyword.slice(1));
      }
    });

    const medKeywords = ['aspirin', 'ibuprofen', 'acetaminophen', 'antibiotic'];
    medKeywords.forEach(keyword => {
      if (allText.includes(keyword)) {
        medications.push(keyword.charAt(0).toUpperCase() + keyword.slice(1));
      }
    });

    return {
      summary: `Medical consultation with ${messages.length} message exchanges. ${symptoms.length > 0 ? 'Patient reported: ' + symptoms.join(', ') + '.' : 'No specific symptoms reported.'}`,
      symptoms,
      diagnoses,
      medications,
      followUpActions: ['Monitor symptoms', 'Follow up if condition worsens'],
    };
  }

  isEnabled(): boolean {
    return this.enabled;
  }
}

export const aiService = new AIService();
