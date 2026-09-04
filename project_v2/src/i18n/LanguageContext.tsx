import { createContext, useContext, useState, useCallback, useMemo, type ReactNode } from 'react';
import { en } from './en';
import { ur } from './ur';

export type Lang = 'en' | 'ur';

const DICTS: Record<Lang, Record<string, string>> = { en, ur };
const LANG_KEY = 'urbaneye-lang-v1';

interface LanguageContextValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
  toggleLang: () => void;
  /** Translate a key; falls back to the key itself if missing. */
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

function readLang(): Lang {
  const stored = localStorage.getItem(LANG_KEY);
  return stored === 'ur' ? 'ur' : 'en';
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(readLang);

  const setLang = useCallback((next: Lang) => {
    setLangState(next);
    localStorage.setItem(LANG_KEY, next);
  }, []);

  const toggleLang = useCallback(() => {
    setLangState((prev) => {
      const next = prev === 'en' ? 'ur' : 'en';
      localStorage.setItem(LANG_KEY, next);
      return next;
    });
  }, []);

  const t = useCallback(
    (key: string) => DICTS[lang][key] ?? DICTS.en[key] ?? key,
    [lang]
  );

  const value = useMemo(() => ({ lang, setLang, toggleLang, t }), [lang, setLang, toggleLang, t]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within a LanguageProvider');
  return ctx;
}
