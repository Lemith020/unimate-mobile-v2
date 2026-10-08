const bcrypt = require('bcrypt');
const pool = require('../config/database');


// =====================================================
// REGISTER USER
// POST /api/auth/register
// =====================================================

const registerUser = async (req, res) => {

  const client = await pool.connect();

  try {

    const {
      email,
      password,
      full_name,
      phone,
      university_id,
      faculty_id,
      year_of_study,
      current_address,
      city,
      district
    } = req.body;


    // Basic validation
    if (!email || !password || !full_name) {

      return res.status(400).json({
        error: 'Email, password and full name are required'
      });

    }


    // Check if email already exists
    const existingUser = await client.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );


    if (existingUser.rows.length > 0) {

      return res.status(409).json({
        error: 'Email already registered'
      });

    }


    await client.query('BEGIN');


    // Hash password
    const saltRounds = 10;

    const passwordHash = await bcrypt.hash(
      password,
      saltRounds
    );


    // Insert user
    const userResult = await client.query(
      `
      INSERT INTO users (
        email,
        password_hash,
        role,
        status
      )
      VALUES ($1, $2, 'student', 'approved')
      RETURNING id, email, role
      `,
      [
        email,
        passwordHash
      ]
    );


    const userId = userResult.rows[0].id;


    // Insert student profile
    const profileResult = await client.query(
      `
      INSERT INTO student_profiles (
        user_id,
        full_name,
        phone,
        university_id,
        faculty_id,
        year_of_study,
        current_address,
        city,
        district
      )
      VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9
      )
      RETURNING *
      `,
      [
        userId,
        full_name,
        phone || null,
        university_id || null,
        faculty_id || null,
        year_of_study || null,
        current_address || null,
        city || null,
        district || null
      ]
    );


    await client.query('COMMIT');


    console.log(
      'PROFILE INSERTED:',
      profileResult.rows[0]
    );


    res.status(201).json({

      message: 'User registered successfully!',

      user: {
        id: userResult.rows[0].id,
        email: userResult.rows[0].email,
        role: userResult.rows[0].role
      }

    });


  } catch (error) {

    await client.query('ROLLBACK');

    console.error(
      'Register error:',
      error
    );


    res.status(500).json({
      error: 'Server error during registration'
    });


  } finally {

    client.release();

  }

};



// =====================================================
// LOGIN USER
// POST /api/auth/login
// =====================================================

const loginUser = async (req, res) => {

  const {
    email,
    password
  } = req.body;


  if (!email || !password) {

    return res.status(400).json({
      error: 'Email and password are required'
    });

  }


  try {

    // Find user
    const userResult = await pool.query(
      `
      SELECT *
      FROM users
      WHERE email = $1
      `,
      [email]
    );


    if (userResult.rows.length === 0) {

      return res.status(401).json({
        error: 'Invalid email or password'
      });

    }


    const user = userResult.rows[0];


    // Check password
    const isPasswordValid =
      await bcrypt.compare(
        password,
        user.password_hash
      );


    if (!isPasswordValid) {

      return res.status(401).json({
        error: 'Invalid email or password'
      });

    }


    // Get student profile
    // university_name + faculty_name
    const profileResult = await pool.query(
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
      [user.id]
    );


    const profile =
      profileResult.rows.length > 0
        ? profileResult.rows[0]
        : null;


    res.status(200).json({

      message: 'Login successful',

      user: {

        id: user.id,

        email: user.email,

        role: user.role,

        profile: profile

      }

    });


  } catch (error) {

    console.error(
      'Login error:',
      error
    );


    res.status(500).json({
      error: 'Server error during login'
    });

  }

};


module.exports = {
  registerUser,
  loginUser
};