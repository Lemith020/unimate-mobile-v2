import { Slot } from 'expo-router';
import { PreferencesProvider } from '../contexts/PreferencesContext';

export default function RootLayout() {
  return (
    <PreferencesProvider>
      <Slot />
    </PreferencesProvider>
  );
}