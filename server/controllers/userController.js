const { User } = require('../models');

// Get all doctors (for dropdown lists)
exports.getDoctors = async (req, res) => {
  try {
    const doctors = await User.findAll({
      where: { role: 'doctor' },
      attributes: ['id', 'first_name', 'last_name', 'email'],
      order: [['last_name', 'ASC']]
    });

    res.json(doctors);
  } catch (error) {
    console.error('Error fetching doctors:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get all patients (for dropdown lists)
exports.getPatients = async (req, res) => {
  try {
    const patients = await User.findAll({
      where: { role: 'patient' },
      attributes: ['id', 'first_name', 'last_name', 'email'],
      order: [['last_name', 'ASC']]
    });

    res.json(patients);
  } catch (error) {
    console.error('Error fetching patients:', error);
    res.status(500).json({ message: 'Server error' });
  }
}; 