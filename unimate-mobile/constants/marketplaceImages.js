const MARKETPLACE_IMAGES = {
    camera: require('../assets/marketplace-images/camera.png'),
    fan: require('../assets/marketplace-images/fan.png'),
    phone: require('../assets/marketplace-images/phone.png'),
};

export function getMarketplaceImage(item) {
    const imageUrl =
        typeof item?.image_url === 'string'
            ? item.image_url.trim()
            : '';

    if (imageUrl) {
        return { uri: imageUrl };
    }

    const title =
        typeof item?.title === 'string'
            ? item.title.trim().toLowerCase()
            : '';

    return MARKETPLACE_IMAGES[title] ?? null;
}