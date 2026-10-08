const express = require('express');

const {
  getBoardingsByUniversity
} = require('../controllers/boardingController');


const router = express.Router();


// GET
// /api/boardings/university/:universityId

router.get(
  '/university/:universityId',
  getBoardingsByUniversity
);


module.exports = router;