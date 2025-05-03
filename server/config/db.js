const { sequelize } = require('../models');
const bcrypt = require('bcrypt');
const { User } = require('../models');

const initializeDatabase = async () => {
  try {
    // Sync all models with database
    await sequelize.sync({ force: true });
    console.log('Database synchronized');

    // Create sample users
    const salt = await bcrypt.genSalt(10);
    
    // Create a doctor
    await User.create({
      email: 'doctor@example.com',
      password: await bcrypt.hash('password123', salt),
      first_name: 'John',
      last_name: 'Smith',
      role: 'doctor'
    });

    // Create a patient
    await User.create({
      email: 'patient@example.com',
      password: await bcrypt.hash('password123', salt),
      first_name: 'Jane',
      last_name: 'Doe',
      role: 'patient'
    });

    console.log('Sample users created');
    
    console.log('Database initialization complete');
  } catch (error) {
    console.error('Database initialization error:', error);
  }
};

module.exports = { initializeDatabase }; 