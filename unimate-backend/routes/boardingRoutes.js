const express = require('express');

const {
    getBoardingsByUniversity,
    getBoardingById,
} = require('../controllers/boardingController');

const router = express.Router();

// List boardings for a university.
router.get(
    '/university/:universityId',
    getBoardingsByUniversity
);

// Get one boarding's details.
router.get(
    '/:id',
    getBoardingById
);

module.exports = router;