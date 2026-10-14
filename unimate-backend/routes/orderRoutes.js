const express = require('express');
const pool = require('../config/database');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

router.use(authMiddleware);

// Confirm that the account is still approved.
router.use(async (req, res, next) => {
  try {
    const result = await pool.query(
      `
        SELECT id
        FROM public.users
        WHERE id = $1
          AND status = 'approved'
      `,
      [req.user.id]
    );

    if (!result.rows.length) {
      return res.status(403).json({
        error: 'Your account is not available.',
      });
    }

    return next();
  } catch (error) {
    console.error('Order account check error:', error);

    return res.status(500).json({
      error: 'Unable to verify your account.',
    });
  }
});

// GET /api/orders/my
// Optional: ?limit=20&offset=0
router.get('/my', async (req, res) => {
  const { limit, offset } = req.query;

  if (
    limit !== undefined &&
    (
      typeof limit !== 'string' ||
      !/^[1-9]\d*$/.test(limit) ||
      !Number.isSafeInteger(Number(limit)) ||
      Number(limit) > 50
    )
  ) {
    return res.status(400).json({
      error: 'Limit must be between 1 and 50.',
    });
  }

  if (
    offset !== undefined &&
    (
      typeof offset !== 'string' ||
      !/^\d+$/.test(offset) ||
      !Number.isSafeInteger(Number(offset)) ||
      Number(offset) > 2147483647
    )
  ) {
    return res.status(400).json({
      error: 'Invalid offset.',
    });
  }

  const pageLimit = limit === undefined ? 20 : Number(limit);
  const pageOffset = offset === undefined ? 0 : Number(offset);

  try {
    // Fetch one extra record to determine whether another page exists.
    const result = await pool.query(
      `
        SELECT
          orders.id,
          orders.place_id,
          orders.order_type,
          orders.status,
          orders.total_amount,
          orders.contact_phone,
          orders.delivery_address,
          orders.note,
          orders.created_at,
          orders.updated_at,

          shop.name AS shop_name,
          shop.phone AS shop_phone,
          shop.address AS shop_address,
          shop.cover_image_url AS shop_image_url,

          COALESCE(
            (
              SELECT jsonb_agg(
                jsonb_build_object(
                  'id', item.id,
                  'menu_item_id', item.menu_item_id,
                  'item_name', item.item_name,
                  'unit_price', item.unit_price,
                  'quantity', item.quantity
                )
                ORDER BY item.id
              )
              FROM public.order_items item
              WHERE item.order_id = orders.id
            ),
            '[]'::jsonb
          ) AS items

        FROM public.orders orders
        LEFT JOIN public.places shop
          ON shop.id = orders.place_id

        WHERE orders.student_id = $1

        ORDER BY
          orders.created_at DESC,
          orders.id DESC

        LIMIT $2
        OFFSET $3
      `,
      [req.user.id, pageLimit + 1, pageOffset]
    );

    const hasMore = result.rows.length > pageLimit;

    const orders = result.rows
      .slice(0, pageLimit)
      .map((order) => ({
        ...order,
        total_amount: Number(order.total_amount),
        items: order.items.map((item) => ({
          ...item,
          unit_price: Number(item.unit_price),
          quantity: Number(item.quantity),
        })),
      }));

    return res.json({
      orders,
      count: orders.length,
      limit: pageLimit,
      offset: pageOffset,
      has_more: hasMore,
    });
  } catch (error) {
    console.error('Load my orders error:', error);

    return res.status(500).json({
      error: 'Unable to load your orders.',
    });
  }
});

module.exports = router;