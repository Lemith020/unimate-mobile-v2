const pool = require('../config/database');

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const isValidUniversityId = (value) => {
  return (
    /^[1-9]\d*$/.test(value) &&
    Number.isSafeInteger(Number(value)) &&
    Number(value) <= 2147483647
  );
};

const BOARDING_FIELDS = `
  b.id,
  b.owner_id,
  b.university_id,
  b.title,
  b.description,
  b.monthly_rent,
  b.deposit,
  b.gender_type,
  b.room_type,
  b.total_rooms,
  b.available_rooms,
  b.address,
  b.city,
  b.district,
  b.latitude,
  b.longitude,
  b.contact_phone,
  b.is_featured,
  b.status,
  u.name AS university_name,

  (
    SELECT bi.image_url
    FROM boarding_images bi
    WHERE bi.boarding_id = b.id
    ORDER BY
      bi.sort_order ASC NULLS LAST,
      bi.image_url ASC
    LIMIT 1
  ) AS image_url,

  CASE
    WHEN b.latitude IS NOT NULL
      AND b.longitude IS NOT NULL
      AND u.latitude IS NOT NULL
      AND u.longitude IS NOT NULL
    THEN
      6371 * ACOS(
        LEAST(
          1,
          GREATEST(
            -1,
            COS(RADIANS(u.latitude))
              * COS(RADIANS(b.latitude))
              * COS(
                  RADIANS(b.longitude)
                  - RADIANS(u.longitude)
                )
            + SIN(RADIANS(u.latitude))
              * SIN(RADIANS(b.latitude))
          )
        )
      )
    ELSE NULL
  END AS distance_km
`;

// GET /api/boardings/university/:universityId
const getBoardingsByUniversity = async (req, res) => {
  const { universityId } = req.params;

  if (!isValidUniversityId(universityId)) {
    return res.status(400).json({
      error: 'Invalid university ID',
    });
  }

  try {
    const result = await pool.query(
      `
        SELECT ${BOARDING_FIELDS}
        FROM boardings b
        INNER JOIN universities u
          ON b.university_id = u.id
        WHERE b.university_id = $1
        ORDER BY
          distance_km ASC NULLS LAST,
          b.title ASC,
          b.id ASC
      `,
      [Number(universityId)]
    );

    return res.status(200).json({
      count: result.rows.length,
      boardings: result.rows,
    });
  } catch (error) {
    console.error('Get boardings error:', error);

    return res.status(500).json({
      error: 'Failed to load boardings',
    });
  }
};

// GET /api/boardings/featured/university/:universityId
const getFeaturedBoardingsByUniversity = async (req, res) => {
  const { universityId } = req.params;

  if (!isValidUniversityId(universityId)) {
    return res.status(400).json({
      error: 'Invalid university ID',
    });
  }

  try {
    const result = await pool.query(
      `
        SELECT ${BOARDING_FIELDS}
        FROM boardings b
        INNER JOIN universities u
          ON b.university_id = u.id
        WHERE b.university_id = $1
          AND b.is_featured = TRUE
          AND b.status = 'published'
        ORDER BY
          distance_km ASC NULLS LAST,
          b.title ASC,
          b.id ASC
        LIMIT 6
      `,
      [Number(universityId)]
    );

    return res.status(200).json({
      count: result.rows.length,
      boardings: result.rows,
    });
  } catch (error) {
    console.error('Get featured boardings error:', error);

    return res.status(500).json({
      error: 'Failed to load featured boardings',
    });
  }
};

// GET /api/boardings/:id
const getBoardingById = async (req, res) => {
  const { id } = req.params;

  if (!UUID_PATTERN.test(id)) {
    return res.status(400).json({
      error: 'Invalid boarding ID',
    });
  }

  try {
    const result = await pool.query(
      `
        SELECT ${BOARDING_FIELDS}
        FROM boardings b
        LEFT JOIN universities u
          ON b.university_id = u.id
        WHERE b.id = $1
      `,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Boarding not found',
      });
    }

    const imagesResult = await pool.query(
      `
        SELECT image_url, sort_order
        FROM boarding_images
        WHERE boarding_id = $1
        ORDER BY
          sort_order ASC NULLS LAST,
          image_url ASC
      `,
      [id]
    );

    return res.status(200).json({
      boarding: {
        ...result.rows[0],
        images: imagesResult.rows,
      },
    });
  } catch (error) {
    console.error('Get boarding details error:', error);

    return res.status(500).json({
      error: 'Failed to load boarding details',
    });
  }
};

module.exports = {
  getBoardingsByUniversity,
  getFeaturedBoardingsByUniversity,
  getBoardingById,
};