const pool = require('../config/database');


// =====================================================
// UPDATE STUDENT PROFILE
// PUT /api/profile/:userId
// =====================================================

const updateProfile = async (req, res) => {

  try {

    const {
      userId
    } = req.params;


    const {
      full_name,
      phone,
      university_id,
      faculty_id,
      year_of_study,
      current_address,
      city,
      district,
      latitude,
      longitude
    } = req.body;


    if (!full_name) {

      return res.status(400).json({
        error: 'Full name is required'
      });

    }


    const result = await pool.query(
      `
      UPDATE student_profiles

      SET
        full_name = $1,
        phone = $2,
        university_id = $3,
        faculty_id = $4,
        year_of_study = $5,
        current_address = $6,
        city = $7,
        district = $8,
        latitude = $9,
        longitude = $10,

        location_updated_at =
          CASE
            WHEN $9 IS NOT NULL
             AND $10 IS NOT NULL
            THEN NOW()
            ELSE location_updated_at
          END,

        updated_at = NOW()

      WHERE user_id = $11

      RETURNING *
      `,
      [
        full_name,
        phone || null,
        university_id || null,
        faculty_id || null,
        year_of_study || null,
        current_address || null,
        city || null,
        district || null,
        latitude ?? null,
        longitude ?? null,
        userId
      ]
    );


    if (result.rows.length === 0) {

      return res.status(404).json({
        error: 'Profile not found'
      });

    }


    // Get updated profile
    // including university + faculty name
    const updatedProfileResult =
      await pool.query(
        `
        SELECT
          sp.*,
          u.name AS university_name,
          f.name AS faculty_name

        FROM student_profiles sp

        LEFT JOIN universities u
          ON sp.university_id = u.id

        LEFT JOIN faculties f
          ON sp.faculty_id = f.id

        WHERE sp.user_id = $1
        `,
        [userId]
      );


    res.status(200).json({

      message:
        'Profile updated successfully',

      profile:
        updatedProfileResult.rows[0]

    });


  } catch (error) {

    console.error(
      'Profile update error:',
      error
    );


    res.status(500).json({
      error: 'Failed to update profile'
    });

  }

};


module.exports = {
  updateProfile
};