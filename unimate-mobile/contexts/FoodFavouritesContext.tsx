import React, {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@unimate/food-favourites/v1';

export type FavouriteFood = {
    id: string;
    place_id: string;
    name: string;
    price: number;
    description?: string | null;
    image_url?: string | null;
    menu_category_id?: string | null;
    category_name?: string | null;
    is_available?: boolean;
    shop_name?: string;
};

type FoodFavouritesContextValue = {
    favourites: FavouriteFood[];
    isLoading: boolean;
    storageError: string | null;
    isFavourite: (foodId: string) => boolean;
    toggleFavourite: (food: FavouriteFood) => void;
    removeFavourite: (foodId: string) => void;
};

const FoodFavouritesContext =
    createContext<FoodFavouritesContextValue | undefined>(
        undefined
    );

function isValidFood(value: unknown): value is FavouriteFood {
    if (!value || typeof value !== 'object') {
        return false;
    }

    const food = value as Partial<FavouriteFood>;

    return (
        typeof food.id === 'string' &&
        food.id.length > 0 &&
        typeof food.place_id === 'string' &&
        food.place_id.length > 0 &&
        typeof food.name === 'string' &&
        typeof food.price === 'number' &&
        Number.isFinite(food.price) &&
        food.price >= 0
    );
}

export function FoodFavouritesProvider({
    children,
}: {
    children: React.ReactNode;
}) {
    const [favourites, setFavourites] = useState<
        FavouriteFood[]
    >([]);
    const [isLoading, setIsLoading] = useState(true);
    const [storageError, setStorageError] = useState<
        string | null
    >(null);
    const [canPersist, setCanPersist] = useState(false);

    // Save changes in order, even when hearts are tapped quickly.
    const saveQueue = useRef<Promise<void>>(
        Promise.resolve()
    );
    const mounted = useRef(false);

    useEffect(() => {
        let active = true;
        mounted.current = true;

        async function loadFavourites() {
            try {
                const stored =
                    await AsyncStorage.getItem(STORAGE_KEY);

                if (!active) return;

                if (stored !== null) {
                    const parsed: unknown = JSON.parse(stored);

                    if (!Array.isArray(parsed)) {
                        throw new Error(
                            'Invalid favourites data'
                        );
                    }

                    const uniqueFoods = new Map<
                        string,
                        FavouriteFood
                    >();

                    parsed.filter(isValidFood).forEach((food) => {
                        uniqueFoods.set(food.id, food);
                    });

                    setFavourites(
                        Array.from(uniqueFoods.values())
                    );
                }

                setCanPersist(true);
            } catch (error) {
                if (!active) return;

                console.warn(
                    'Unable to load food favourites:',
                    error
                );

                setStorageError(
                    'Saved favourites could not be loaded. Please restart the app.'
                );
            } finally {
                if (active) {
                    setIsLoading(false);
                }
            }
        }

        void loadFavourites();

        return () => {
            active = false;
            mounted.current = false;
        };
    }, []);

    useEffect(() => {
        if (isLoading || !canPersist) return;

        const snapshot = JSON.stringify(favourites);

        saveQueue.current = saveQueue.current
            .then(async () => {
                await AsyncStorage.setItem(
                    STORAGE_KEY,
                    snapshot
                );

                if (mounted.current) {
                    setStorageError(null);
                }
            })
            .catch((error: unknown) => {
                console.warn(
                    'Unable to save food favourites:',
                    error
                );

                if (mounted.current) {
                    setStorageError(
                        'Your latest favourites could not be saved on this device.'
                    );
                }
            });
    }, [favourites, isLoading, canPersist]);

    const isFavourite = useCallback(
        (foodId: string) =>
            favourites.some((food) => food.id === foodId),
        [favourites]
    );

    const toggleFavourite = useCallback(
        (food: FavouriteFood) => {
            if (isLoading || !canPersist) return;

            if (!isValidFood(food)) {
                console.warn(
                    'Cannot favourite an invalid food item.'
                );
                return;
            }

            setFavourites((current) => {
                const exists = current.some(
                    (item) => item.id === food.id
                );

                if (exists) {
                    return current.filter(
                        (item) => item.id !== food.id
                    );
                }

                return [{ ...food }, ...current];
            });
        },
        [isLoading, canPersist]
    );

    const removeFavourite = useCallback(
        (foodId: string) => {
            if (isLoading || !canPersist) return;

            setFavourites((current) =>
                current.filter((food) => food.id !== foodId)
            );
        },
        [isLoading, canPersist]
    );

    const value = useMemo(
        () => ({
            favourites,
            isLoading,
            storageError,
            isFavourite,
            toggleFavourite,
            removeFavourite,
        }),
        [
            favourites,
            isLoading,
            storageError,
            isFavourite,
            toggleFavourite,
            removeFavourite,
        ]
    );

    return (
        <FoodFavouritesContext.Provider value={value}>
            {children}
        </FoodFavouritesContext.Provider>
    );
}

export function useFoodFavourites() {
    const context = useContext(FoodFavouritesContext);

    if (!context) {
        throw new Error(
            'Wrap the app root in FoodFavouritesProvider before using useFoodFavourites.'
        );
    }

    return context;
}