const express = require('express');
const cors = require('cors');
require('dotenv').config();


// Routes
const authRoutes =
  require('./routes/authRoutes');

const profileRoutes =
  require('./routes/profileRoutes');

const universityRoutes =
  require('./routes/universityRoutes');
  
const boardingRoutes =
  require('./routes/boardingRoutes');


// Create Express App
const app = express();


// Middleware
app.use(express.json());

app.use(cors());


// =====================================================
// API ROUTES
// =====================================================


// Authentication
app.use(
  '/api/auth',
  authRoutes
);


// Profile
app.use(
  '/api/profile',
  profileRoutes
);


// University + Faculty
app.use(
  '/api',
  universityRoutes
);

app.use(
  '/api/boardings',
  boardingRoutes
);


// =====================================================
// TEST ROUTE
// =====================================================

app.get('/', (req, res) => {

  res.json({
    message:
      'Unimate Backend API is running'
  });

});


// =====================================================
// 404 ROUTE
// =====================================================

app.use((req, res) => {

  res.status(404).json({
    error: 'API route not found'
  });

});


// =====================================================
// SERVER START
// =====================================================

const PORT =
  process.env.PORT || 5000;


app.listen(PORT, () => {

  console.log(
    `Unimate server running on port ${PORT}`
  );

});