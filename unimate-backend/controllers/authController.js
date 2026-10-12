const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../config/database');

// =====================================================
// REGISTER USER
// POST /api/auth/register
// =====================================================

const registerUser = async (req, res) => {
  let client;
  let transactionStarted = false;

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
      district,
    } = req.body || {};

    if (
      typeof email !== 'string' ||
      !email.trim() ||
      typeof password !== 'string' ||
      !password ||
      typeof full_name !== 'string' ||
      !full_name.trim()
    ) {
      return res.status(400).json({
        error: 'Email, password and full name are required',
      });
    }

    if (Buffer.byteLength(password, 'utf8') > 72) {
      return res.status(400).json({
        error: 'Password is too long',
      });
    }

    const cleanEmail = email.trim();

    client = await pool.connect();

    const existingUser = await client.query(
      `
                SELECT id
                FROM users
                WHERE email = $1
            `,
      [cleanEmail]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({
        error: 'Email already registered',
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    await client.query('BEGIN');
    transactionStarted = true;

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
      [cleanEmail, passwordHash]
    );

    const user = userResult.rows[0];

    await client.query(
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
                    $1, $2, $3, $4, $5,
                    $6, $7, $8, $9
                )
            `,
      [
        user.id,
        full_name.trim(),
        phone || null,
        university_id || null,
        faculty_id || null,
        year_of_study || null,
        current_address || null,
        city || null,
        district || null,
      ]
    );

    await client.query('COMMIT');
    transactionStarted = false;

    return res.status(201).json({
      message: 'User registered successfully!',
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    if (client && transactionStarted) {
      try {
        await client.query('ROLLBACK');
      } catch (rollbackError) {
        console.error(
          'Registration rollback error:',
          rollbackError
        );
      }
    }

    console.error('Register error:', error);

    return res.status(500).json({
      error: 'Server error during registration',
    });
  } finally {
    if (client) {
      client.release();
    }
  }
};

// =====================================================
// LOGIN USER
// POST /api/auth/login
// =====================================================

const loginUser = async (req, res) => {
  const { email, password } = req.body || {};

  if (
    typeof email !== 'string' ||
    !email.trim() ||
    typeof password !== 'string' ||
    !password
  ) {
    return res.status(400).json({
      error: 'Email and password are required',
    });
  }

  if (Buffer.byteLength(password, 'utf8') > 72) {
    return res.status(401).json({
      error: 'Invalid email or password',
    });
  }

  const secret = process.env.JWT_SECRET;

  if (!secret || Buffer.byteLength(secret, 'utf8') < 32) {
    console.error('A valid JWT_SECRET is required.');

    return res.status(500).json({
      error: 'Authentication is not configured.',
    });
  }

  try {
    const userResult = await pool.query(
      `
                SELECT
                    id,
                    email,
                    role,
                    status,
                    password_hash
                FROM users
                WHERE email = $1
            `,
      [email.trim()]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({
        error: 'Invalid email or password',
      });
    }

    const user = userResult.rows[0];

    const isPasswordValid = await bcrypt.compare(
      password,
      user.password_hash
    );

    if (!isPasswordValid) {
      return res.status(401).json({
        error: 'Invalid email or password',
      });
    }

    if (user.status !== 'approved') {
      return res.status(403).json({
        error: 'Your account is not approved for login.',
      });
    }

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

    const profile = profileResult.rows[0] || null;

    // Matches the verification settings in authMiddleware.js.
    const token = jwt.sign({}, secret, {
      algorithm: 'HS256',
      subject: String(user.id),
      issuer: 'unimate-api',
      audience: 'unimate-mobile',
      expiresIn: '7d',
    });

    return res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        profile,
      },
    });
  } catch (error) {
    console.error('Login error:', error);

    return res.status(500).json({
      error: 'Server error during login',
    });
  }
};

module.exports = {
  registerUser,
  loginUser,
};