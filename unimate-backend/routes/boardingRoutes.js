const express = require('express');

const {
  getBoardingsByUniversity,
  getFeaturedBoardingsByUniversity,
  getBoardingById,
} = require('../controllers/boardingController');

const router = express.Router();

// Featured boardings for a university.
router.get(
  '/featured/university/:universityId',
  getFeaturedBoardingsByUniversity
);

// All boardings for a university.
router.get(
  '/university/:universityId',
  getBoardingsByUniversity
);

// One boarding's details.
router.get(
  '/:id',
  getBoardingById
);

module.exports = router;