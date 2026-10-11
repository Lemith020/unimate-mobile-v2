import { Slot } from 'expo-router';

import { PreferencesProvider } from '../contexts/PreferencesContext';
import { FoodFavouritesProvider } from '../contexts/FoodFavouritesContext';

export default function RootLayout() {
    return (
        <PreferencesProvider>
            <FoodFavouritesProvider>
                <Slot />
            </FoodFavouritesProvider>
        </PreferencesProvider>
    );
}