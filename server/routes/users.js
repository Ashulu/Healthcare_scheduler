const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const auth = require('../middleware/auth');

router.get('/doctors', auth, userController.getDoctors);
router.get('/patients', auth, userController.getPatients);

module.exports = router; 