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

const STORAGE_KEY = '@unimate/marketplace-favourites/v1';

export type MarketplaceItem = {
    id: string;
    seller_id: string;
    title: string;
    price: number;
    description?: string | null;
    category_id?: number | null;
    category_name?: string | null;
    condition?: 'new' | 'used';
    is_negotiable?: boolean;
    city?: string | null;
    status?: 'active' | 'sold' | 'hidden';
    image_url?: string | null;
    seller_name?: string | null;
    seller_phone?: string | null;
};

type MarketplaceFavouritesValue = {
    favourites: MarketplaceItem[];
    isLoading: boolean;
    storageError: string | null;
    isFavourite: (itemId: string) => boolean;
    toggleFavourite: (item: MarketplaceItem) => void;
    removeFavourite: (itemId: string) => void;
};

const MarketplaceFavouritesContext =
    createContext<MarketplaceFavouritesValue | undefined>(
        undefined
    );

function isValidItem(
    value: unknown
): value is MarketplaceItem {
    if (!value || typeof value !== 'object') {
        return false;
    }

    const item = value as Partial<MarketplaceItem>;

    return (
        typeof item.id === 'string' &&
        item.id.length > 0 &&
        typeof item.seller_id === 'string' &&
        item.seller_id.length > 0 &&
        typeof item.title === 'string' &&
        typeof item.price === 'number' &&
        Number.isFinite(item.price) &&
        item.price >= 0
    );
}

// Store only the information needed by favourite cards.
function createSnapshot(item: MarketplaceItem): MarketplaceItem {
    return {
        id: item.id,
        seller_id: item.seller_id,
        title: item.title,
        price: item.price,
        category_id: item.category_id,
        category_name: item.category_name,
        condition: item.condition,
        is_negotiable: item.is_negotiable,
        city: item.city,
        status: item.status,
        image_url: item.image_url,
        seller_name: item.seller_name,
    };
}

export function MarketplaceFavouritesProvider({
    children,
}: {
    children: React.ReactNode;
}) {
    const [favourites, setFavourites] = useState<
        MarketplaceItem[]
    >([]);
    const [isLoading, setIsLoading] = useState(true);
    const [storageError, setStorageError] = useState<
        string | null
    >(null);
    const [canPersist, setCanPersist] = useState(false);

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
                            'Invalid marketplace favourites data'
                        );
                    }

                    const uniqueItems = new Map<
                        string,
                        MarketplaceItem
                    >();

                    parsed.filter(isValidItem).forEach((item) => {
                        uniqueItems.set(
                            item.id,
                            createSnapshot(item)
                        );
                    });

                    setFavourites(
                        Array.from(uniqueItems.values())
                    );
                }

                setCanPersist(true);
            } catch (error) {
                if (!active) return;

                console.warn(
                    'Unable to load marketplace favourites:',
                    error
                );

                setStorageError(
                    'Saved favourites could not be loaded. Please restart the app.'
                );
            } finally {
                if (active) setIsLoading(false);
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

        // Keep quick favourite changes in the correct save order.
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
                    'Unable to save marketplace favourites:',
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
        (itemId: string) =>
            favourites.some((item) => item.id === itemId),
        [favourites]
    );

    const toggleFavourite = useCallback(
        (item: MarketplaceItem) => {
            if (isLoading || !canPersist) return;

            if (!isValidItem(item)) {
                console.warn(
                    'Cannot favourite an invalid marketplace item.'
                );
                return;
            }

            setFavourites((current) => {
                const exists = current.some(
                    (saved) => saved.id === item.id
                );

                return exists
                    ? current.filter(
                          (saved) => saved.id !== item.id
                      )
                    : [createSnapshot(item), ...current];
            });
        },
        [isLoading, canPersist]
    );

    const removeFavourite = useCallback(
        (itemId: string) => {
            if (isLoading || !canPersist) return;

            setFavourites((current) =>
                current.filter((item) => item.id !== itemId)
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
        <MarketplaceFavouritesContext.Provider value={value}>
            {children}
        </MarketplaceFavouritesContext.Provider>
    );
}

export function useMarketplaceFavourites() {
    const context = useContext(
        MarketplaceFavouritesContext
    );

    if (!context) {
        throw new Error(
            'Wrap the app root in MarketplaceFavouritesProvider before using useMarketplaceFavourites.'
        );
    }

    return context;
}
