const express = require('express');
const pool = require('../config/database');

const router = express.Router();

const UUID_PATTERN =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const ITEM_FIELDS = `
    item.id,
    item.seller_id,
    item.category_id,
    item.title,
    item.description,
    item.price,
    item.condition,
    item.is_negotiable,
    item.city,
    item.status,
    item.created_at,
    item.updated_at,

    category.name AS category_name,
    profile.full_name AS seller_name,
    profile.phone AS seller_phone,

    (
        SELECT photo.image_url
        FROM public.marketplace_item_images photo
        WHERE photo.item_id = item.id
        ORDER BY photo.sort_order ASC, photo.id ASC
        LIMIT 1
    ) AS image_url
`;

const ITEM_JOINS = `
    FROM public.marketplace_items item
    LEFT JOIN public.marketplace_categories category
        ON category.id = item.category_id
    JOIN public.users seller
        ON seller.id = item.seller_id
    LEFT JOIN public.student_profiles profile
        ON profile.user_id = item.seller_id
`;

function formatItem(item) {
    return {
        ...item,
        price: Number(item.price),
    };
}

// =====================================================
// GET CATEGORIES
// GET /api/marketplace/categories
// =====================================================

router.get('/categories', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT id, name
            FROM public.marketplace_categories
            ORDER BY name ASC, id ASC
        `);

        return res.json({
            categories: result.rows,
        });
    } catch (error) {
        console.error('Marketplace categories error:', error);

        return res.status(500).json({
            error: 'Failed to load marketplace categories',
        });
    }
});

// =====================================================
// GET ACTIVE ITEMS
// GET /api/marketplace/items
//
// Optional query parameters:
// ?search=camera
// ?categoryId=1
// ?limit=30&offset=0
// =====================================================

router.get('/items', async (req, res) => {
    const {
        search,
        categoryId,
        limit,
        offset,
    } = req.query;

    if (
        search !== undefined &&
        (typeof search !== 'string' || search.length > 100)
    ) {
        return res.status(400).json({
            error: 'Search must be text up to 100 characters',
        });
    }

    if (
        categoryId !== undefined &&
        (
            typeof categoryId !== 'string' ||
            !/^[1-9]\d*$/.test(categoryId) ||
            !Number.isSafeInteger(Number(categoryId)) ||
            Number(categoryId) > 2147483647
        )
    ) {
        return res.status(400).json({
            error: 'Invalid category ID',
        });
    }

    if (
        limit !== undefined &&
        (
            typeof limit !== 'string' ||
            !/^[1-9]\d*$/.test(limit) ||
            !Number.isInteger(Number(limit)) ||
            Number(limit) > 100
        )
    ) {
        return res.status(400).json({
            error: 'Limit must be between 1 and 100',
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
            error: 'Invalid offset',
        });
    }

    const pageLimit = limit === undefined ? 30 : Number(limit);
    const pageOffset =
        offset === undefined ? 0 : Number(offset);

    const conditions = [
        "item.status = 'active'",
        "seller.status = 'approved'",
    ];

    const values = [];

    if (categoryId !== undefined) {
        values.push(Number(categoryId));
        conditions.push(
            `item.category_id = $${values.length}`
        );
    }

    const query = search?.trim();

    if (query) {
        // Treat %, _ and backslash as literal search characters.
        const escaped = query.replace(
            /[\\%_]/g,
            (character) => `\\${character}`
        );

        values.push(`%${escaped}%`);
        const parameter = `$${values.length}`;

        conditions.push(`
            (
                item.title ILIKE ${parameter}
                OR item.description ILIKE ${parameter}
                OR item.city ILIKE ${parameter}
            )
        `);
    }

    values.push(pageLimit);
    const limitParameter = `$${values.length}`;

    values.push(pageOffset);
    const offsetParameter = `$${values.length}`;

    try {
        const result = await pool.query(
            `
                SELECT ${ITEM_FIELDS}
                ${ITEM_JOINS}
                WHERE ${conditions.join(' AND ')}
                ORDER BY item.created_at DESC, item.id ASC
                LIMIT ${limitParameter}
                OFFSET ${offsetParameter}
            `,
            values
        );

        return res.json({
            count: result.rows.length,
            limit: pageLimit,
            offset: pageOffset,
            items: result.rows.map(formatItem),
        });
    } catch (error) {
        console.error('Marketplace items error:', error);

        return res.status(500).json({
            error: 'Failed to load marketplace items',
        });
    }
});

// =====================================================
// GET ITEM DETAILS
// GET /api/marketplace/items/:id
// =====================================================

router.get('/items/:id', async (req, res) => {
    const { id } = req.params;

    if (!UUID_PATTERN.test(id)) {
        return res.status(400).json({
            error: 'Invalid item ID',
        });
    }

    try {
        const result = await pool.query(
            `
                SELECT ${ITEM_FIELDS}
                ${ITEM_JOINS}
                WHERE item.id = $1
                    AND item.status IN ('active', 'sold')
                    AND seller.status = 'approved'
            `,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                error: 'Marketplace item not found',
            });
        }

        const imagesResult = await pool.query(
            `
                SELECT id, image_url, sort_order
                FROM public.marketplace_item_images
                WHERE item_id = $1
                ORDER BY sort_order ASC, id ASC
            `,
            [id]
        );

        const item = formatItem(result.rows[0]);

        return res.json({
            item: {
                ...item,
                images: imagesResult.rows,
            },
        });
    } catch (error) {
        console.error('Marketplace item details error:', error);

        return res.status(500).json({
            error: 'Failed to load marketplace item details',
        });
    }
});

module.exports = router;