const FOOD_SHOP_IMAGES = {
  'mathara bath kade': require('../assets/food-shops/mathara-bathkade.png'),
  keells: require('../assets/food-shops/keels.jpg'),
  kfc: require('../assets/food-shops/kfc.png'),
};

export function getFoodShopImage(shop) {
  // Use an online image when one is available.
  const imageUrl = shop?.cover_image_url?.trim();

  if (imageUrl) {
    return { uri: imageUrl };
  }

  // Otherwise, use the shop's local image.
  const shopName = shop?.name?.trim().toLowerCase();

  return FOOD_SHOP_IMAGES[shopName] ?? null;
}