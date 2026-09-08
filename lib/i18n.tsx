'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { dict, DEFAULT_LOCALE, type Locale } from './translations';

interface LocaleContextType {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: typeof dict[Locale];
}

const LocaleContext = createContext<LocaleContextType>({
  locale: DEFAULT_LOCALE,
  setLocale: () => {},
  t: dict[DEFAULT_LOCALE],
});

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);

  useEffect(() => {
    const saved = localStorage.getItem('arry-locale') as Locale | null;
    if (saved && dict[saved]) {
      setLocaleState(saved);
      document.documentElement.lang = saved;
    }
  }, []);

  const setLocale = (l: Locale) => {
    setLocaleState(l);
    localStorage.setItem('arry-locale', l);
    document.documentElement.lang = l;
  };

  return (
    <LocaleContext.Provider value={{ locale, setLocale, t: dict[locale] }}>
      {children}
    </LocaleContext.Provider>
  );
}

export const useLocale = () => useContext(LocaleContext);
