const pool = require('../config/database');


// =====================================================
// GET BOARDINGS BY UNIVERSITY
// GET /api/boardings/university/:universityId
// =====================================================

const getBoardingsByUniversity = async (req, res) => {

  try {

    const { universityId } = req.params;


    if (!universityId) {

      return res.status(400).json({
        error: 'University ID is required'
      });

    }


    const result = await pool.query(
      `
      SELECT
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

        u.name AS university_name,

        (
          SELECT bi.image_url
          FROM boarding_images bi
          WHERE bi.boarding_id = b.id
          ORDER BY bi.sort_order ASC
          LIMIT 1
        ) AS image_url,

        CASE
          WHEN
            b.latitude IS NOT NULL
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
                  +
                  SIN(RADIANS(u.latitude))
                  * SIN(RADIANS(b.latitude))
                )
              )
            )

          ELSE NULL
        END AS distance_km

      FROM boardings b

      INNER JOIN universities u
        ON b.university_id = u.id

      WHERE b.university_id = $1

      ORDER BY

        CASE
          WHEN b.latitude IS NULL
            OR b.longitude IS NULL
          THEN 1
          ELSE 0
        END,

        distance_km ASC NULLS LAST,

        b.title ASC
      `,
      [universityId]
    );


    res.status(200).json({

      count: result.rows.length,

      boardings: result.rows

    });


  } catch (error) {

    console.error(
      'Get boardings error:',
      error
    );


    res.status(500).json({
      error: 'Failed to load boardings'
    });

  }

};


module.exports = {
  getBoardingsByUniversity
};