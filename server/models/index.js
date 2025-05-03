const { Sequelize } = require('sequelize');
const dotenv = require('dotenv');

dotenv.config();

const sequelize = new Sequelize(
  process.env.DB_NAME || 'healthcare_scheduler',
  process.env.DB_USER || 'postgres',
  process.env.DB_PASSWORD || 'postgres',
  {
    host: process.env.DB_HOST || 'localhost',
    dialect: 'postgres',
    logging: false,
    isolationLevel: Sequelize.Transaction.ISOLATION_LEVELS.REPEATABLE_READ,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
);

const db = {
  sequelize,
  Sequelize,
  User: require('./User')(sequelize, Sequelize),
  Appointment: require('./Appointment')(sequelize, Sequelize),
  PatientReport: require('./PatientReport')(sequelize, Sequelize),
};

// Define relationships
db.User.hasMany(db.Appointment, { foreignKey: 'patient_id', as: 'patientAppointments' });
db.User.hasMany(db.Appointment, { foreignKey: 'doctor_id', as: 'doctorAppointments' });
db.Appointment.belongsTo(db.User, { foreignKey: 'patient_id', as: 'patient' });
db.Appointment.belongsTo(db.User, { foreignKey: 'doctor_id', as: 'doctor' });

db.Appointment.hasOne(db.PatientReport, { foreignKey: 'appointment_id' });
db.PatientReport.belongsTo(db.Appointment, { foreignKey: 'appointment_id' });

db.User.hasMany(db.PatientReport, { foreignKey: 'patient_id', as: 'patientReports' });
db.User.hasMany(db.PatientReport, { foreignKey: 'doctor_id', as: 'doctorReports' });
db.PatientReport.belongsTo(db.User, { foreignKey: 'patient_id', as: 'patient' });
db.PatientReport.belongsTo(db.User, { foreignKey: 'doctor_id', as: 'doctor' });

module.exports = db; 