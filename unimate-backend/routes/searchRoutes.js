const express = require('express');
const pool = require('../config/database');

const router = express.Router();

const CATEGORIES = [
    'all',
    'boarding',
    'food',
    'pharmacy',
    'marketplace',
];

// Mobile app page routes.
function getDestination(item) {
    switch (item.type) {
        case 'boarding':
            return {
                route: `/boardings/${item.id}`,
                params: {},
            };

        case 'food':
            return {
                route: `/food/${item.id}`,
                params: {},
            };

        case 'pharmacy':
            return {
                route: '/pharmacy',
                params: {},
            };

        case 'marketplace':
            return {
                route: `/marketplace/${item.id}`,
                params: {},
            };

        default:
            return {
                route: '/home_page',
                params: {},
            };
    }
}

// GET /api/search?q=rice&category=all&university_id=2
router.get('/', async (req, res) => {
    const {
        q,
        category = 'all',
        university_id,
    } = req.query;

    if (typeof q !== 'string' || q.length > 100) {
        return res.status(400).json({
            error: 'Search must be text up to 100 characters',
        });
    }

    if (
        typeof category !== 'string' ||
        !CATEGORIES.includes(category)
    ) {
        return res.status(400).json({
            error: 'Invalid search category',
        });
    }

    if (
        university_id !== undefined &&
        (
            typeof university_id !== 'string' ||
            !/^[1-9]\d*$/.test(university_id) ||
            !Number.isSafeInteger(Number(university_id)) ||
            Number(university_id) > 2147483647
        )
    ) {
        return res.status(400).json({
            error: 'Invalid university ID',
        });
    }

    const searchText = q.trim();

    if (!searchText) {
        return res.json({
            results: [],
            count: 0,
        });
    }

    const universityId =
        university_id === undefined
            ? null
            : Number(university_id);

    // Treat %, _ and backslash as normal search characters.
    const escapedText = searchText.replace(
        /[\\%_]/g,
        (character) => `\\${character}`
    );

    const pattern = `%${escapedText}%`;

    try {
        if (universityId !== null) {
            const universityResult = await pool.query(
                `
                    SELECT id, latitude, longitude
                    FROM public.universities
                    WHERE id = $1
                `,
                [universityId]
            );

            if (universityResult.rows.length === 0) {
                return res.status(404).json({
                    error: 'University not found',
                });
            }

            const university = universityResult.rows[0];

            if (
                (category === 'all' ||
                    category === 'food' ||
                    category === 'pharmacy') &&
                (
                    university.latitude === null ||
                    university.longitude === null
                )
            ) {
                return res.status(400).json({
                    error: 'University location is unavailable',
                });
            }
        }

        const result = await pool.query(
            `
                WITH campus AS (
                    SELECT latitude, longitude
                    FROM public.universities
                    WHERE id = $3::integer
                ),

                matching_places AS (
                    SELECT
                        p.id,
                        CASE
                            WHEN c.group_name = 'food'
                                THEN 'food'
                            ELSE 'pharmacy'
                        END AS type,
                        p.name AS title,
                        CONCAT_WS(
                            ' · ',
                            NULLIF(p.city, ''),
                            c.name
                        ) AS subtitle,
                        p.cover_image_url AS image_url,
                        NULL::numeric AS price,

                        CASE
                            WHEN $3::integer IS NULL THEN NULL
                            ELSE (
                                SELECT
                                    6371.0 * ACOS(
                                        LEAST(
                                            1.0,
                                            GREATEST(
                                                -1.0,
                                                SIN(
                                                    RADIANS(
                                                        campus.latitude::double precision
                                                    )
                                                )
                                                * SIN(
                                                    RADIANS(
                                                        p.latitude::double precision
                                                    )
                                                )
                                                + COS(
                                                    RADIANS(
                                                        campus.latitude::double precision
                                                    )
                                                )
                                                * COS(
                                                    RADIANS(
                                                        p.latitude::double precision
                                                    )
                                                )
                                                * COS(
                                                    RADIANS(
                                                        p.longitude::double precision
                                                    )
                                                    - RADIANS(
                                                        campus.longitude::double precision
                                                    )
                                                )
                                            )
                                        )
                                    )
                                FROM campus
                            )
                        END AS distance_km

                    FROM public.places p
                    JOIN public.place_categories c
                        ON c.id = p.category_id

                    WHERE p.status = 'published'
                        AND (
                            c.group_name = 'food'
                            OR c.code IN ('pharmacy', 'dispensary')
                        )
                        AND (
                            $3::integer IS NULL
                            OR (
                                p.latitude IS NOT NULL
                                AND p.longitude IS NOT NULL
                            )
                        )
                        AND (
                            p.name ILIKE $1
                            OR p.description ILIKE $1
                            OR p.city ILIKE $1
                            OR c.name ILIKE $1
                        )
                ),

                matches AS (
                    SELECT
                        b.id,
                        'boarding'::text AS type,
                        b.title,
                        CONCAT_WS(
                            ' · ',
                            NULLIF(b.city, ''),
                            'Student boarding'
                        ) AS subtitle,

                        (
                            SELECT photo.image_url
                            FROM public.boarding_images photo
                            WHERE photo.boarding_id = b.id
                            ORDER BY photo.sort_order ASC, photo.id ASC
                            LIMIT 1
                        ) AS image_url,

                        b.monthly_rent AS price

                    FROM public.boardings b

                    WHERE b.status = 'published'
                        AND (
                            $3::integer IS NULL
                            OR b.university_id = $3::integer
                        )
                        AND (
                            b.title ILIKE $1
                            OR b.description ILIKE $1
                            OR b.city ILIKE $1
                        )

                    UNION ALL

                    SELECT
                        id,
                        type,
                        title,
                        subtitle,
                        image_url,
                        price
                    FROM matching_places
                    WHERE
                        $3::integer IS NULL
                        OR distance_km <= 5

                    UNION ALL

                    SELECT
                        item.id,
                        'marketplace'::text AS type,
                        item.title,

                        CONCAT_WS(
                            ' · ',
                            NULLIF(item.city, ''),
                            category.name
                        ) AS subtitle,

                        (
                            SELECT photo.image_url
                            FROM public.marketplace_item_images photo
                            WHERE photo.item_id = item.id
                            ORDER BY photo.sort_order ASC, photo.id ASC
                            LIMIT 1
                        ) AS image_url,

                        item.price

                    FROM public.marketplace_items item

                    JOIN public.users seller
                        ON seller.id = item.seller_id

                    LEFT JOIN public.marketplace_categories category
                        ON category.id = item.category_id

                    WHERE item.status = 'active'
                        AND seller.status = 'approved'
                        AND (
                            item.title ILIKE $1
                            OR item.description ILIKE $1
                            OR item.city ILIKE $1
                            OR category.name ILIKE $1
                        )
                )

                SELECT
                    id,
                    type,
                    title,
                    subtitle,
                    image_url,
                    price

                FROM matches

                WHERE
                    $2::text = 'all'
                    OR type = $2::text

                ORDER BY
                    CASE
                        WHEN LOWER(title) = LOWER($4::text)
                            THEN 0
                        ELSE 1
                    END,
                    LOWER(title),
                    type,
                    id

                LIMIT 60
            `,
            [
                pattern,
                category,
                universityId,
                searchText,
            ]
        );

        const results = result.rows.map((item) => ({
            ...item,
            price:
                item.price === null
                    ? null
                    : Number(item.price),
            ...getDestination(item),
        }));

        return res.json({
            results,
            count: results.length,
            limit: 60,
        });
    } catch (error) {
        console.error('Search error:', error);

        return res.status(500).json({
            error: 'Unable to search right now. Please try again.',
        });
    }
});

module.exports = router;