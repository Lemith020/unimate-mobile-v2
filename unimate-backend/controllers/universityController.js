const pool = require('../config/database');


// =====================================================
// GET ALL UNIVERSITIES
// GET /api/universities
// =====================================================

const getUniversities = async (req, res) => {

  try {

    const result = await pool.query(
      `
      SELECT
        id,
        name

      FROM universities

      ORDER BY name
      `
    );


    res.status(200).json(
      result.rows
    );


  } catch (error) {

    console.error(
      'Get universities error:',
      error
    );


    res.status(500).json({
      error: 'Failed to load universities'
    });

  }

};



// =====================================================
// GET FACULTIES BY UNIVERSITY
// GET /api/universities/:universityId/faculties
// =====================================================

const getFacultiesByUniversity = async (
  req,
  res
) => {

  try {

    const {
      universityId
    } = req.params;


    const result = await pool.query(
      `
      SELECT
        id,
        name

      FROM faculties

      WHERE university_id = $1

      ORDER BY name
      `,
      [universityId]
    );


    res.status(200).json(
      result.rows
    );


  } catch (error) {

    console.error(
      'Get faculties error:',
      error
    );


    res.status(500).json({
      error: 'Failed to load faculties'
    });

  }

};


module.exports = {
  getUniversities,
  getFacultiesByUniversity
};