const PHARMACY_IMAGES = {
    'happy health pharmacy': require(
        '../assets/pharmacies/happy-health-pharmacy.png'
    ),

    'sumudu pharmacy': require(
        '../assets/pharmacies/sumudu-pharmacy.png'
    ),

    'health ceylon pharmacy': require(
        '../assets/pharmacies/health-ceylon-pharmacy.png'
    ),
};

export function getPharmacyImage(pharmacy) {
    const imageUrl =
        typeof pharmacy?.cover_image_url === 'string'
            ? pharmacy.cover_image_url.trim()
            : '';

    if (imageUrl) {
        return { uri: imageUrl };
    }

    const name =
        typeof pharmacy?.name === 'string'
            ? pharmacy.name.trim().toLowerCase()
            : '';

    return PHARMACY_IMAGES[name] ?? null;
}