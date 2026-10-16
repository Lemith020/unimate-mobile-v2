const express = require('express');
const pool = require('../config/database');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// GET /api/orders/my
router.get('/my', authMiddleware, async (req, res) => {
    const { limit, offset } = req.query;

    const pageLimit = limit === undefined ? 20 : Number(limit);
    const pageOffset = offset === undefined ? 0 : Number(offset);

    if (
        limit !== undefined &&
        (
            typeof limit !== 'string' ||
            !/^[1-9]\d*$/.test(limit) ||
            !Number.isInteger(pageLimit) ||
            pageLimit > 50
        )
    ) {
        return res.status(400).json({
            error: 'Limit must be between 1 and 50',
        });
    }

    if (
        offset !== undefined &&
        (
            typeof offset !== 'string' ||
            !/^\d+$/.test(offset) ||
            !Number.isSafeInteger(pageOffset) ||
            pageOffset > 2147483647
        )
    ) {
        return res.status(400).json({
            error: 'Invalid offset',
        });
    }

    const userId = req.user?.id;

    if (!userId) {
        return res.status(401).json({
            error: 'Please log in to view your orders',
        });
    }

    try {
        const userResult = await pool.query(
            `
                SELECT id
                FROM public.users
                WHERE id = $1
                    AND status = 'approved'
            `,
            [userId]
        );

        if (userResult.rows.length === 0) {
            return res.status(403).json({
                error: 'Your account is unavailable',
            });
        }

        const result = await pool.query(
            `
                SELECT
                    o.id,
                    o.place_id,
                    o.order_type,
                    o.status,
                    o.total_amount,
                    o.contact_phone,
                    o.delivery_address,
                    o.note,
                    o.created_at,
                    o.updated_at,

                    p.name AS shop_name,
                    p.address AS shop_address,

                    COALESCE(
                        (
                            SELECT jsonb_agg(
                                jsonb_build_object(
                                    'id', oi.id,
                                    'item_name', oi.item_name,
                                    'unit_price', oi.unit_price,
                                    'quantity', oi.quantity
                                )
                                ORDER BY oi.id
                            )
                            FROM public.order_items oi
                            WHERE oi.order_id = o.id
                        ),
                        '[]'::jsonb
                    ) AS items

                FROM public.orders o

                LEFT JOIN public.places p
                    ON p.id = o.place_id

                WHERE o.student_id = $1

                ORDER BY o.created_at DESC, o.id DESC

                LIMIT $2
                OFFSET $3
            `,
            [userId, pageLimit + 1, pageOffset]
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
        console.error('My orders load error:', error);

        return res.status(500).json({
            error: 'Unable to load your orders. Please try again.',
        });
    }
});

module.exports = router;