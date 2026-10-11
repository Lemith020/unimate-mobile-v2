const express = require('express');
const pool = require('../config/database');

const router = express.Router();

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Get published food shops within 5 km of a university.
// GET /api/food/university/2
router.get('/university/:universityId', async (req, res) => {
  const { universityId } = req.params;

  if (
    !/^[1-9]\d*$/.test(universityId) ||
    !Number.isSafeInteger(Number(universityId)) ||
    Number(universityId) > 2147483647
  ) {
    return res.status(400).json({
      error: 'Invalid university ID',
    });
  }

  try {
    const universityResult = await pool.query(
      `
        SELECT id, name, latitude, longitude
        FROM public.universities
        WHERE id = $1
      `,
      [Number(universityId)]
    );

    if (universityResult.rows.length === 0) {
      return res.status(404).json({
        error: 'University not found',
      });
    }

    const university = universityResult.rows[0];

    if (
      university.latitude === null ||
      university.longitude === null
    ) {
      return res.status(400).json({
        error: 'University location is not available',
      });
    }

    const shopsResult = await pool.query(
      `
        WITH nearby_shops AS (
          SELECT
            p.id,
            p.name,
            p.description,
            p.phone,
            p.address,
            p.city,
            p.district,
            p.latitude,
            p.longitude,
            p.cover_image_url,
            p.is_open_24h,
            p.delivery_available,
            p.pickup_available,
            p.is_featured,
            c.name AS category_name,
            6371.0 * ACOS(
              LEAST(
                1.0,
                GREATEST(
                  -1.0,
                  SIN(RADIANS($1::double precision))
                    * SIN(RADIANS(p.latitude))
                  + COS(RADIANS($1::double precision))
                    * COS(RADIANS(p.latitude))
                    * COS(
                        RADIANS(p.longitude)
                        - RADIANS($2::double precision)
                      )
                )
              )
            ) AS distance_km
          FROM public.places p
          JOIN public.place_categories c
            ON c.id = p.category_id
          WHERE c.group_name = 'food'
            AND p.status = 'published'
            AND p.latitude IS NOT NULL
            AND p.longitude IS NOT NULL
        )
        SELECT *
        FROM nearby_shops
        WHERE distance_km <= $3
        ORDER BY distance_km ASC, name ASC, id ASC
      `,
      [university.latitude, university.longitude, 5]
    );

    return res.json({
      university,
      radius_km: 5,
      shops: shopsResult.rows,
    });
  } catch (error) {
    console.error('Food shops load error:', error);

    return res.status(500).json({
      error: 'Failed to load food shops',
    });
  }
});

// Get a food shop, its categories and available foods.
// GET /api/food/shops/<shop-id>
router.get('/shops/:shopId', async (req, res) => {
  const { shopId } = req.params;

  if (!UUID_PATTERN.test(shopId)) {
    return res.status(400).json({
      error: 'Invalid shop ID',
    });
  }

  try {
    const shopResult = await pool.query(
      `
        SELECT
          p.id,
          p.name,
          p.description,
          p.phone,
          p.address,
          p.city,
          p.district,
          p.latitude,
          p.longitude,
          p.cover_image_url,
          p.is_open_24h,
          p.delivery_available,
          p.pickup_available,
          c.name AS category_name
        FROM public.places p
        JOIN public.place_categories c
          ON c.id = p.category_id
        WHERE p.id = $1
          AND p.status = 'published'
          AND c.group_name = 'food'
      `,
      [shopId]
    );

    if (shopResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Food shop not found',
      });
    }

    const categoriesResult = await pool.query(
      `
        SELECT id, place_id, name, sort_order
        FROM public.menu_categories
        WHERE place_id = $1
        ORDER BY sort_order ASC, name ASC, id ASC
      `,
      [shopId]
    );

    const foodsResult = await pool.query(
      `
        SELECT
          food.id,
          food.place_id,
          food.menu_category_id,
          food.name,
          food.description,
          food.price,
          food.image_url,
          food.is_available,
          category.name AS category_name
        FROM public.menu_items food
        LEFT JOIN public.menu_categories category
          ON category.id = food.menu_category_id
          AND category.place_id = food.place_id
        WHERE food.place_id = $1
          AND food.is_available = true
        ORDER BY
          category.sort_order ASC NULLS LAST,
          food.name ASC,
          food.id ASC
      `,
      [shopId]
    );

    return res.json({
      shop: shopResult.rows[0],
      categories: categoriesResult.rows,
      foods: foodsResult.rows.map((food) => ({
        ...food,
        price: Number(food.price),
      })),
    });
  } catch (error) {
    console.error('Food shop menu load error:', error);

    return res.status(500).json({
      error: 'Failed to load shop menu',
    });
  }
});

module.exports = router;