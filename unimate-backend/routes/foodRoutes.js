const express = require('express');
const pool = require('../config/database');

const router = express.Router();

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isUuid(value) {
  return typeof value === 'string' && UUID_PATTERN.test(value);
}

function isUniversityId(value) {
  return (
    /^[1-9]\d*$/.test(value) &&
    Number.isSafeInteger(Number(value)) &&
    Number(value) <= 2147483647
  );
}

// =====================================================
// SHOPS NEAR UNIVERSITY + OPENING STATUS
// GET /api/food/university/:universityId
// =====================================================

router.get('/university/:universityId', async (req, res) => {
  const { universityId } = req.params;

  if (!isUniversityId(universityId)) {
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

    if (!universityResult.rows.length) {
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
        WITH local_clock AS (
          SELECT
            EXTRACT(
              DOW FROM CURRENT_TIMESTAMP
                AT TIME ZONE 'Asia/Colombo'
            )::integer AS day_number,
            (
              CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Colombo'
            )::time AS current_time
        ),
        nearby_shops AS (
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
        SELECT
          shop.*,
          (
            shop.is_open_24h IS TRUE
            OR open_hours.close_time IS NOT NULL
          ) AS is_open_now,
          CASE
            WHEN shop.is_open_24h IS TRUE THEN NULL
            ELSE open_hours.close_time
          END AS closing_time,
          CASE
            WHEN shop.is_open_24h IS TRUE THEN FALSE
            ELSE COALESCE(open_hours.closes_tomorrow, FALSE)
          END AS closes_tomorrow

        FROM nearby_shops shop
        CROSS JOIN local_clock clock

        LEFT JOIN LATERAL (
          SELECT
            hours.close_time,
            (
              hours.day_of_week = clock.day_number
              AND hours.open_time > hours.close_time
            ) AS closes_tomorrow

          FROM public.place_opening_hours hours
          WHERE hours.place_id = shop.id
            AND hours.is_closed IS FALSE
            AND hours.open_time IS NOT NULL
            AND hours.close_time IS NOT NULL
            AND (
              (
                hours.day_of_week = clock.day_number
                AND hours.open_time < hours.close_time
                AND clock.current_time >= hours.open_time
                AND clock.current_time < hours.close_time
              )
              OR
              (
                hours.day_of_week = clock.day_number
                AND hours.open_time > hours.close_time
                AND clock.current_time >= hours.open_time
              )
              OR
              (
                hours.day_of_week =
                  (clock.day_number + 6) % 7
                AND hours.open_time > hours.close_time
                AND clock.current_time < hours.close_time
              )
            )
          ORDER BY hours.day_of_week, hours.open_time, hours.id
          LIMIT 1
        ) open_hours ON TRUE

        WHERE shop.distance_km <= $3
        ORDER BY shop.distance_km, shop.name, shop.id
      `,
      [university.latitude, university.longitude, 5]
    );

    return res.json({
      university,
      radius_km: 5,
      timezone: 'Asia/Colombo',
      checked_at: new Date().toISOString(),
      shops: shopsResult.rows,
    });
  } catch (error) {
    console.error('Food shops load error:', error);

    return res.status(500).json({
      error: 'Failed to load food shops',
    });
  }
});

// =====================================================
// SHOP MENU
// GET /api/food/shops/:shopId
// =====================================================

router.get('/shops/:shopId', async (req, res) => {
  const { shopId } = req.params;

  if (!isUuid(shopId)) {
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

    if (!shopResult.rows.length) {
      return res.status(404).json({
        error: 'Food shop not found',
      });
    }

    const categoriesResult = await pool.query(
      `
        SELECT id, place_id, name, sort_order
        FROM public.menu_categories
        WHERE place_id = $1
        ORDER BY sort_order, name, id
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
          AND food.is_available = TRUE
        ORDER BY
          category.sort_order ASC NULLS LAST,
          food.name,
          food.id
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

// =====================================================
// PLACE A PICKUP ORDER — LOCAL DEMO
// POST /api/food/orders
// =====================================================

router.post('/orders', async (req, res) => {
  const {
    student_id,
    place_id,
    menu_item_id,
    quantity,
    contact_phone,
    note,
    expected_unit_price,
  } = req.body || {};

  if (
    !isUuid(student_id) ||
    !isUuid(place_id) ||
    !isUuid(menu_item_id)
  ) {
    return res.status(400).json({
      error: 'Invalid user, shop or food ID',
    });
  }

  if (
    !Number.isInteger(quantity) ||
    quantity < 1 ||
    quantity > 20
  ) {
    return res.status(400).json({
      error: 'Quantity must be between 1 and 20',
    });
  }

  if (typeof contact_phone !== 'string') {
    return res.status(400).json({
      error: 'A contact phone number is required',
    });
  }

  const phone = contact_phone.trim().replace(/[\s()-]/g, '');

  if (!/^\+?\d{9,15}$/.test(phone)) {
    return res.status(400).json({
      error: 'Please enter a valid contact phone number',
    });
  }

  if (
    note !== undefined &&
    note !== null &&
    typeof note !== 'string'
  ) {
    return res.status(400).json({
      error: 'Order note must be text',
    });
  }

  const cleanNote = typeof note === 'string' ? note.trim() : '';

  if (cleanNote.length > 500) {
    return res.status(400).json({
      error: 'Order note cannot exceed 500 characters',
    });
  }

  if (
    typeof expected_unit_price !== 'number' ||
    !Number.isFinite(expected_unit_price) ||
    expected_unit_price < 0
  ) {
    return res.status(400).json({
      error: 'Please reload checkout to check the price',
    });
  }

  let client;
  let transactionStarted = false;

  try {
    client = await pool.connect();

    await client.query('BEGIN');
    transactionStarted = true;

    const studentResult = await client.query(
      `
        SELECT id
        FROM public.users
        WHERE id = $1
          AND role = 'student'
          AND status = 'approved'
        FOR SHARE
      `,
      [student_id]
    );

    if (!studentResult.rows.length) {
      await client.query('ROLLBACK');
      transactionStarted = false;

      return res.status(403).json({
        error: 'An approved student account is required',
      });
    }

    const shopResult = await client.query(
      `
        SELECT p.id, p.pickup_available
        FROM public.places p
        JOIN public.place_categories c
          ON c.id = p.category_id
        WHERE p.id = $1
          AND p.status = 'published'
          AND c.group_name = 'food'
        FOR SHARE OF p
      `,
      [place_id]
    );

    if (!shopResult.rows.length) {
      await client.query('ROLLBACK');
      transactionStarted = false;

      return res.status(404).json({
        error: 'Food shop is no longer available',
      });
    }

    if (!shopResult.rows[0].pickup_available) {
      await client.query('ROLLBACK');
      transactionStarted = false;

      return res.status(400).json({
        error: 'Pickup is not available at this shop',
      });
    }

    const foodResult = await client.query(
      `
        SELECT id, name, price
        FROM public.menu_items
        WHERE id = $1
          AND place_id = $2
          AND is_available = TRUE
        FOR SHARE
      `,
      [menu_item_id, place_id]
    );

    if (!foodResult.rows.length) {
      await client.query('ROLLBACK');
      transactionStarted = false;

      return res.status(409).json({
        error: 'This food is no longer available',
      });
    }

    const food = foodResult.rows[0];
    const price = Number(food.price);

    if (!Number.isFinite(price) || price < 0) {
      throw new Error('Invalid database food price');
    }

    if (
      Math.round(price * 100) !==
      Math.round(expected_unit_price * 100)
    ) {
      await client.query('ROLLBACK');
      transactionStarted = false;

      return res.status(409).json({
        error:
          'The price has changed. Reload checkout and review it before ordering.',
      });
    }

    const orderResult = await client.query(
      `
        INSERT INTO public.orders (
          student_id,
          place_id,
          order_type,
          status,
          total_amount,
          contact_phone,
          note
        )
        VALUES (
          $1,
          $2,
          'pickup',
          'placed',
          $3::numeric * $4::integer,
          $5,
          $6
        )
        RETURNING
          id,
          student_id,
          place_id,
          order_type,
          status,
          total_amount,
          contact_phone,
          created_at
      `,
      [
        student_id,
        place_id,
        food.price,
        quantity,
        phone,
        cleanNote || null,
      ]
    );

    const order = orderResult.rows[0];

    await client.query(
      `
        INSERT INTO public.order_items (
          order_id,
          menu_item_id,
          item_name,
          unit_price,
          quantity
        )
        VALUES ($1, $2, $3, $4, $5)
      `,
      [
        order.id,
        food.id,
        food.name,
        food.price,
        quantity,
      ]
    );

    await client.query('COMMIT');
    transactionStarted = false;

    return res.status(201).json({
      message: 'Order placed successfully',
      order: {
        ...order,
        total_amount: Number(order.total_amount),
      },
    });
  } catch (error) {
    if (client && transactionStarted) {
      try {
        await client.query('ROLLBACK');
      } catch (rollbackError) {
        console.error('Order rollback error:', rollbackError);
      }
    }

    console.error('Place order error:', error);

    return res.status(500).json({
      error: 'Unable to place your order',
    });
  } finally {
    if (client) {
      client.release();
    }
  }
});

module.exports = router;