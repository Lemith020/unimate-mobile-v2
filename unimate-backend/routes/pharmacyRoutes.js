const express = require('express');
const pool = require('../config/database');

const router = express.Router();

const TIME_ZONE = 'Asia/Colombo';
const SEARCH_RADIUS_KM = 5;

// day_of_week: Sunday = 0, Monday = 1, ... Saturday = 6.
const DAY_NUMBERS = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
};

function getLocalClock(date) {
    const parts = new Intl.DateTimeFormat('en-US', {
        timeZone: TIME_ZONE,
        weekday: 'short',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hourCycle: 'h23',
    }).formatToParts(date);

    const values = Object.fromEntries(
        parts.map((part) => [part.type, part.value])
    );

    return {
        day: DAY_NUMBERS[values.weekday],
        seconds:
            Number(values.hour) * 3600 +
            Number(values.minute) * 60 +
            Number(values.second),
    };
}

function timeToSeconds(value) {
    if (typeof value !== 'string') return null;

    const match = value.match(
        /^(\d{2}):(\d{2})(?::(\d{2})(?:\.\d+)?)?$/
    );

    if (!match) return null;

    const hours = Number(match[1]);
    const minutes = Number(match[2]);
    const seconds = Number(match[3] || 0);

    if (
        hours > 23 ||
        minutes > 59 ||
        seconds > 59
    ) {
        return null;
    }

    return hours * 3600 + minutes * 60 + seconds;
}

function formatTime(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    const hourText = hours % 12 || 12;
    const minuteText =
        minutes === 0
            ? ''
            : `:${String(minutes).padStart(2, '0')}`;

    return `${hourText}${minuteText} ${
        hours >= 12 ? 'PM' : 'AM'
    }`;
}

function readSchedule(rows, day) {
    const matches = rows.filter(
        (row) => Number(row.day_of_week) === day
    );

    // This version expects one opening interval per day.
    if (matches.length !== 1) return null;

    const row = matches[0];

    if (row.is_closed === true) {
        return { closed: true };
    }

    const open = timeToSeconds(row.open_time);
    const close = timeToSeconds(row.close_time);

    // Use is_open_24h for 24-hour listings.
    if (
        open === null ||
        close === null ||
        open === close
    ) {
        return null;
    }

    return {
        closed: false,
        open,
        close,
    };
}

function getOpeningStatus(pharmacy, hours, clock) {
    if (pharmacy.is_open_24h) {
        return {
            is_open_now: true,
            opening_status: 'open',
            opening_text: 'Open 24 hours',
        };
    }

    const today = readSchedule(hours, clock.day);
    const previous = readSchedule(
        hours,
        (clock.day + 6) % 7
    );

    // Handle an opening interval that started yesterday.
    if (
        previous &&
        !previous.closed &&
        previous.open > previous.close &&
        clock.seconds < previous.close
    ) {
        return {
            is_open_now: true,
            opening_status: 'open',
            opening_text: `Open till ${formatTime(
                previous.close
            )}`,
        };
    }

    if (today && !today.closed) {
        const overnight = today.open > today.close;

        const openToday = overnight
            ? clock.seconds >= today.open
            : clock.seconds >= today.open &&
              clock.seconds < today.close;

        if (openToday) {
            return {
                is_open_now: true,
                opening_status: 'open',
                opening_text: `Open till ${formatTime(
                    today.close
                )}${overnight ? ' tomorrow' : ''}`,
            };
        }
    }

    // Missing previous hours can make early-morning status
    // uncertain, so do not guess that the pharmacy is closed.
    if (!today || !previous) {
        return {
            is_open_now: null,
            opening_status: 'unknown',
            opening_text: 'Hours unavailable',
        };
    }

    return {
        is_open_now: false,
        opening_status: 'closed',
        opening_text:
            !today.closed && clock.seconds < today.open
                ? `Opens at ${formatTime(today.open)}`
                : 'Closed',
    };
}

// GET /api/pharmacy/university/:universityId
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
                error: 'University location is unavailable',
            });
        }

        const pharmaciesResult = await pool.query(
            `
                WITH nearby_pharmacies AS (
                    SELECT
                        p.id,
                        p.name,
                        p.phone,
                        p.address,
                        p.city,
                        p.district,
                        p.latitude,
                        p.longitude,
                        p.cover_image_url,
                        p.is_open_24h,
                        c.code AS category_code,
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
                    WHERE c.code IN ('pharmacy', 'dispensary')
                        AND p.status = 'published'
                        AND p.latitude IS NOT NULL
                        AND p.longitude IS NOT NULL
                )
                SELECT *
                FROM nearby_pharmacies
                WHERE distance_km <= $3
                ORDER BY distance_km ASC, name ASC, id ASC
            `,
            [
                university.latitude,
                university.longitude,
                SEARCH_RADIUS_KM,
            ]
        );

        const pharmacies = pharmaciesResult.rows;
        const ids = pharmacies.map((pharmacy) => pharmacy.id);

        const hoursResult =
            ids.length > 0
                ? await pool.query(
                      `
                          SELECT
                              place_id,
                              day_of_week,
                              open_time,
                              close_time,
                              is_closed
                          FROM public.place_opening_hours
                          WHERE place_id = ANY($1::uuid[])
                          ORDER BY place_id, day_of_week
                      `,
                      [ids]
                  )
                : { rows: [] };

        const hoursByPlace = new Map();

        for (const row of hoursResult.rows) {
            if (!hoursByPlace.has(row.place_id)) {
                hoursByPlace.set(row.place_id, []);
            }

            hoursByPlace.get(row.place_id).push(row);
        }

        const checkedAt = new Date();
        const clock = getLocalClock(checkedAt);

        return res.json({
            university,
            radius_km: SEARCH_RADIUS_KM,
            timezone: TIME_ZONE,
            checked_at: checkedAt.toISOString(),
            pharmacies: pharmacies.map((pharmacy) => ({
                ...pharmacy,
                ...getOpeningStatus(
                    pharmacy,
                    hoursByPlace.get(pharmacy.id) || [],
                    clock
                ),
            })),
        });
    } catch (error) {
        console.error('Pharmacies load error:', error);

        return res.status(500).json({
            error: 'Failed to load nearby pharmacies',
        });
    }
});

module.exports = router;