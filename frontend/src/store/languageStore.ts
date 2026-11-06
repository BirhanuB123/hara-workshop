import { create } from 'zustand';
import enTranslations from '../locales/en.json';
import amTranslations from '../locales/am.json';

export type Language = 'en' | 'am';

interface LanguageState {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  localize: <T extends Record<string, any>>(item: T | null | undefined, field: string, fallbackField?: string) => string;
}

const STORAGE_KEY = 'hara_language';

const getInitialLanguage = (): Language => {
  if (typeof window === 'undefined') return 'en';
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'en' || saved === 'am') {
      return saved;
    }
    // Browser language detection
    if (navigator.language && navigator.language.toLowerCase().startsWith('am')) {
      return 'am';
    }
  } catch (err) {
    console.error('Error reading saved language:', err);
  }
  return 'en';
};

const resolveNestedKey = (obj: any, path: string): string | null => {
  if (!obj || typeof obj !== 'object') return null;
  const parts = path.split('.');
  let current = obj;
  for (const part of parts) {
    if (current && typeof current === 'object' && part in current) {
      current = current[part];
    } else {
      return null;
    }
  }
  return typeof current === 'string' ? current : null;
};

const applyDocumentLanguage = (lang: Language) => {
  if (typeof document !== 'undefined') {
    document.documentElement.lang = lang;
    document.documentElement.dir = 'ltr'; // Amharic and English are both LTR
  }
};

const initialLang = getInitialLanguage();
applyDocumentLanguage(initialLang);

export const useLanguageStore = create<LanguageState>((set, get) => ({
  language: initialLang,

  setLanguage: (lang: Language) => {
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch (err) {
      console.error('Error saving language:', err);
    }
    applyDocumentLanguage(lang);
    set({ language: lang });
  },

  toggleLanguage: () => {
    const current = get().language;
    const next: Language = current === 'en' ? 'am' : 'en';
    get().setLanguage(next);
  },

  t: (key: string, params?: Record<string, string | number>): string => {
    const currentLang = get().language;
    let translation: string | null = null;

    if (currentLang === 'am') {
      translation = resolveNestedKey(amTranslations, key);
    }

    if (!translation) {
      translation = resolveNestedKey(enTranslations, key);
    }

    if (!translation) {
      // Fallback: return the last part of key or key itself
      return key;
    }

    if (params) {
      Object.entries(params).forEach(([paramKey, val]) => {
        translation = translation!.replace(new RegExp(`\\{${paramKey}\\}`, 'g'), String(val));
      });
    }

    return translation;
  },

  localize: <T extends Record<string, any>>(item: T | null | undefined, field: string, fallbackField?: string): string => {
    if (!item) return '';
    const currentLang = get().language;
    
    if (currentLang === 'am') {
      const amVal = item[`${field}_am`];
      if (amVal && typeof amVal === 'string' && amVal.trim() !== '') {
        return amVal;
      }
    }

    const defaultVal = item[field];
    if (defaultVal !== undefined && defaultVal !== null && String(defaultVal).trim() !== '') {
      return String(defaultVal);
    }

    if (fallbackField && item[fallbackField]) {
      return String(item[fallbackField]);
    }

    return '';
  }
}));
