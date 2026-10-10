import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

type Theme = 'light' | 'dark';
type Language = 'en' | 'si';
type Preferences = { theme: Theme; language: Language };
const STORAGE_KEY = '@unimate/preferences-v1';
const THEMES = {
  light: { background: '#FFFAF5', surface: '#FFFFFF', text: '#111827', muted: '#6B7280', border: '#E7E5E4', track: '#F3F4F6', accent: '#EA580C', accentSoft: '#FFEDD5', onAccent: '#FFFFFF' },
  dark: { background: '#121212', surface: '#1E1E1E', text: '#F9FAFB', muted: '#A8A29E', border: '#3A3530', track: '#292524', accent: '#FB923C', accentSoft: '#432817', onAccent: '#1C1917' },
};
// Add translations for other screens here when connecting them.
const TEXT = {
  en: { appearance: 'Appearance', light: 'Light', dark: 'Dark', language: 'Language', chooseLanguage: 'Choose your language', hint: 'Choose the language you prefer.', notifications: 'Notification settings', cancel: 'Cancel', storageError: 'Could not save your preference. Please try again.', home: 'Home', profile: 'Profile', help: 'Help & FAQ', feedback: 'Send feedback', report: 'Report a problem', contact: 'Contact us', about: 'About' },
  si: { appearance: 'පෙනුම', light: 'ආලෝක', dark: 'අඳුරු', language: 'භාෂාව', chooseLanguage: 'ඔබේ භාෂාව තෝරන්න', hint: 'ඔබ කැමති භාෂාව තෝරන්න.', notifications: 'දැනුම්දීම් සැකසුම්', cancel: 'අවලංගු කරන්න', storageError: 'ඔබේ තේරීම සුරැකීමට නොහැකි විය. නැවත උත්සාහ කරන්න.', home: 'මුල් පිටුව', profile: 'පැතිකඩ', help: 'උදව් සහ නිතර අසන ප්‍රශ්න', feedback: 'අදහස් යවන්න', report: 'ගැටලුවක් වාර්තා කරන්න', contact: 'අප අමතන්න', about: 'අප ගැන' },
};
type Key = keyof typeof TEXT.en;
type ContextValue = Preferences & {
  colors: typeof THEMES.light;
  isDark: boolean;
  saveError: boolean;
  setTheme: (theme: Theme) => void;
  setLanguage: (language: Language) => void;
  t: (key: Key) => string;
};
const PreferencesContext = createContext<ContextValue | undefined>(undefined);

export function PreferencesProvider({ children }: { children: React.ReactNode }) {
  const [preferences, setPreferences] = useState<Preferences>({ theme: 'light', language: 'en' });
  const [ready, setReady] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const current = useRef(preferences);
  const writes = useRef<Promise<void>>(Promise.resolve());
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    const load = async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          const next: Preferences = { theme: parsed?.theme === 'dark' ? 'dark' : 'light', language: parsed?.language === 'si' ? 'si' : 'en' };
          if (mounted.current) { current.current = next; setPreferences(next); }
        }
      } catch {
        if (mounted.current) setSaveError(true);
      } finally {
        if (mounted.current) setReady(true);
      }
    };
    void load();
    return () => { mounted.current = false; };
  }, []);

  const value = useMemo<ContextValue>(() => {
    const update = (patch: Partial<Preferences>) => {
      const next = { ...current.current, ...patch };
      current.current = next;
      setPreferences(next);
      setSaveError(false);
      // Serialize writes so rapid changes cannot save an older choice last.
      writes.current = writes.current.then(async () => {
        try {
          await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
          if (mounted.current) setSaveError(false);
        } catch {
          if (mounted.current) setSaveError(true);
        }
      });
    };
    return { ...preferences, colors: THEMES[preferences.theme], isDark: preferences.theme === 'dark', saveError, setTheme: (theme) => update({ theme }), setLanguage: (language) => update({ language }), t: (key) => TEXT[preferences.language][key] };
  }, [preferences, saveError]);

  if (!ready) return <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFAF5' }}><ActivityIndicator size="large" color="#EA580C" /></View>;
  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>;
}

export function usePreferences() {
  const value = useContext(PreferencesContext);
  if (!value) throw new Error('Wrap the app root in PreferencesProvider before using PrefsSection.');
  return value;
}
