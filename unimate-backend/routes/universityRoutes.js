const express = require('express');

const {
    getUniversities,
    getFacultiesByUniversity
} = require('../controllers/universityController');


const router = express.Router();


// GET /api/universities
router.get(
    '/universities',
    getUniversities
);


// GET /api/universities/:universityId/faculties
router.get(
    '/universities/:universityId/faculties',
    getFacultiesByUniversity
);


module.exports = router;