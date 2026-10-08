const express = require('express');

const {
    updateProfile
} = require('../controllers/profileController');


const router = express.Router();


// PUT /api/profile/:userId
router.put(
    '/:userId',
    updateProfile
);


module.exports = router;