import { Translate } from '@google-cloud/translate/build/src/v2';
import { logger } from '../utils/logger';

type TranslationProvider = 'google' | 'mymemory' | 'libretranslate' | 'mock';

class TranslationService {
  private translate: Translate | null = null;
  private provider: TranslationProvider = 'mock';

  constructor() {
    if (process.env.GOOGLE_TRANSLATION_API_KEY) {
      try {
        this.translate = new Translate({ key: process.env.GOOGLE_TRANSLATION_API_KEY });
        this.provider = 'google';
        logger.info('✅ Translation: Google Cloud');
      } catch (e) {
        logger.error('Google Translate init failed', e);
      }
    }
    if (this.provider === 'mock' && process.env.LIBRETRANSLATE_URL) {
      this.provider = 'libretranslate';
      logger.info('✅ Translation: LibreTranslate');
    }
    if (this.provider === 'mock') {
      this.provider = 'mymemory';
      logger.info('✅ Translation: MyMemory (free API)');
    }
  }

  async translateText(
    text: string,
    targetLanguage: string,
    sourceLanguage?: string
  ): Promise<string> {
    try {
      if (this.provider === 'google' && this.translate) {
        const [translation] = await this.translate.translate(text, {
          from: sourceLanguage,
          to: targetLanguage,
        });
        return translation;
      }
      if (this.provider === 'libretranslate') {
        return this.libreTranslate(text, targetLanguage, sourceLanguage || 'en');
      }
      if (this.provider === 'mymemory') {
        return this.myMemoryTranslate(text, targetLanguage, sourceLanguage || 'en');
      }
      return this.mockTranslate(text, targetLanguage);
    } catch (error) {
      logger.error('Translation error:', error);
      return this.mockTranslate(text, targetLanguage);
    }
  }

  /** MyMemory free API - no key required (1000 words/day limit) */
  private async myMemoryTranslate(
    text: string,
    targetLanguage: string,
    sourceLanguage: string
  ): Promise<string> {
    if (sourceLanguage === targetLanguage) return text;
    const langpair = `${sourceLanguage}|${targetLanguage}`;
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${encodeURIComponent(langpair)}`;
    const res = await fetch(url);
    const data = (await res.json()) as { responseData?: { translatedText?: string }; responseStatus?: number };
    const translated = data?.responseData?.translatedText;
    if (translated) return translated;
    return this.mockTranslate(text, targetLanguage);
  }

  /** LibreTranslate - self-hosted or public API (open source) */
  private async libreTranslate(
    text: string,
    targetLanguage: string,
    sourceLanguage: string
  ): Promise<string> {
    if (sourceLanguage === targetLanguage) return text;
    const base = (process.env.LIBRETRANSLATE_URL || 'https://libretranslate.com').replace(/\/$/, '');
    const res = await fetch(`${base}/translate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        q: text,
        source: sourceLanguage,
        target: targetLanguage,
      }),
    });
    if (!res.ok) throw new Error(`LibreTranslate ${res.status}`);
    const data = (await res.json()) as { translatedText?: string };
    return data?.translatedText || this.mockTranslate(text, targetLanguage);
  }

  async detectLanguage(text: string): Promise<string> {
    if (this.provider === 'google' && this.translate) {
      try {
        const [detection] = await this.translate.detect(text);
        return Array.isArray(detection) ? detection[0].language : (detection as { language: string }).language;
      } catch {
        return 'en';
      }
    }
    return 'en';
  }

  async getSupportedLanguages(): Promise<Array<{ code: string; name: string }>> {
    return this.getMockLanguages();
  }

  private mockTranslate(text: string, targetLanguage: string): string {
    const names: Record<string, string> = {
      en: 'English', es: 'Spanish', fr: 'French', de: 'German', zh: 'Chinese',
      ja: 'Japanese', ar: 'Arabic', hi: 'Hindi', it: 'Italian', pt: 'Portuguese',
      ko: 'Korean', ru: 'Russian', tr: 'Turkish', vi: 'Vietnamese', th: 'Thai',
    };
    const name = names[targetLanguage] || targetLanguage.toUpperCase();
    return `[${name}] ${text}`;
  }

  private getMockLanguages(): Array<{ code: string; name: string }> {
    return [
      { code: 'en', name: 'English' }, { code: 'es', name: 'Spanish' }, { code: 'fr', name: 'French' },
      { code: 'de', name: 'German' }, { code: 'it', name: 'Italian' }, { code: 'pt', name: 'Portuguese' },
      { code: 'zh', name: 'Chinese (Simplified)' }, { code: 'ja', name: 'Japanese' }, { code: 'ko', name: 'Korean' },
      { code: 'ar', name: 'Arabic' }, { code: 'hi', name: 'Hindi' }, { code: 'ru', name: 'Russian' },
      { code: 'tr', name: 'Turkish' }, { code: 'vi', name: 'Vietnamese' }, { code: 'th', name: 'Thai' },
    ];
  }

  isEnabled(): boolean {
    return this.provider !== 'mock' || true;
  }
}

export const translationService = new TranslationService();
