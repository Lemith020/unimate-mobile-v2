const express = require('express');
const cors = require('cors');

require('dotenv').config();

// Import routes
const authRoutes = require('./routes/authRoutes');
const profileRoutes = require('./routes/profileRoutes');
const universityRoutes = require('./routes/universityRoutes');
const boardingRoutes = require('./routes/boardingRoutes');
const foodRoutes = require('./routes/foodRoutes');
const pharmacyRoutes = require('./routes/pharmacyRoutes');

// Create app
const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api', universityRoutes);
app.use('/api/boardings', boardingRoutes);
app.use('/api/food', foodRoutes);
app.use('/api/pharmacy', pharmacyRoutes);

// Test endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Unimate Backend API is running',
  });
});

// Handle unknown routes
// Keep this after all API routes.
app.use((req, res) => {
  res.status(404).json({
    error: 'API route not found',
  });
});

// Start server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Unimate server running on port ${PORT}`);
});