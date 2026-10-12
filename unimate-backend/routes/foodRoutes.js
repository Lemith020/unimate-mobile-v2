const express = require('express');
const pool = require('../config/database');

const router = express.Router();

const UUID_PATTERN =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isUuid(value) {
    return (
        typeof value === 'string' &&
        UUID_PATTERN.test(value)
    );
}

// =====================================================
// SHOPS NEAR UNIVERSITY
// GET /api/food/university/:universityId
// =====================================================

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

// =====================================================
// PLACE A PICKUP ORDER — LOCAL DEMO
// POST /api/food/orders
//
// Body:
// {
//   student_id: "...",
//   place_id: "...",
//   menu_item_id: "...",
//   quantity: 1,
//   contact_phone: "0771234567",
//   note: "",
//   expected_unit_price: 550
// }
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

    const phone = contact_phone
        .trim()
        .replace(/[\s()-]/g, '');

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

    const cleanNote =
        typeof note === 'string' ? note.trim() : '';

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

        if (studentResult.rows.length === 0) {
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

        if (shopResult.rows.length === 0) {
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
                    AND is_available = true
                FOR SHARE
            `,
            [menu_item_id, place_id]
        );

        if (foodResult.rows.length === 0) {
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

        // Prevent placing an order at a newly changed price.
        if (
            Math.round(price * 100) !==
            Math.round(expected_unit_price * 100)
        ) {
            await client.query('ROLLBACK');
            transactionStarted = false;

            return res.status(409).json({
                error: 'The price has changed. Reload checkout and review it before ordering.',
            });
        }

        // Calculate the total in PostgreSQL using its numeric type.
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

        // Both records must be saved before reporting success.
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
                console.error(
                    'Order rollback error:',
                    rollbackError
                );
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