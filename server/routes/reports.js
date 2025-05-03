const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const auth = require('../middleware/auth');

router.get('/appointments', auth, reportController.getAppointmentReport);
router.post('/patient', auth, reportController.createPatientReport);
router.get('/patient/:id', auth, reportController.getPatientReport);

module.exports = router; 