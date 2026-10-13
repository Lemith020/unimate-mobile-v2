import { Slot } from 'expo-router';

import { PreferencesProvider } from '../contexts/PreferencesContext';
import { FoodFavouritesProvider } from '../contexts/FoodFavouritesContext';
import { MarketplaceFavouritesProvider } from '../contexts/MarketplaceFavouritesContext';

export default function RootLayout() {
    return (
        <PreferencesProvider>
            <FoodFavouritesProvider>
                <MarketplaceFavouritesProvider>
                    <Slot />
                </MarketplaceFavouritesProvider>
            </FoodFavouritesProvider>
        </PreferencesProvider>
    );
}