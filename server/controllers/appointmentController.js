const { Appointment, User, sequelize } = require('../models');
const { QueryTypes } = require('sequelize');

// Get appointments based on user role
exports.getAppointments = async (req, res) => {
  try {
    const { id, role } = req.user;
    let appointments;

    if (role === 'doctor') {
      appointments = await Appointment.findAll({
        where: { doctor_id: id },
        include: [
          { model: User, as: 'patient', attributes: ['id', 'first_name', 'last_name', 'email'] }
        ],
        order: [['appointment_date', 'ASC']]
      });
    } else {
      appointments = await Appointment.findAll({
        where: { patient_id: id },
        include: [
          { model: User, as: 'doctor', attributes: ['id', 'first_name', 'last_name', 'email'] }
        ],
        order: [['appointment_date', 'ASC']]
      });
    }

    res.json(appointments);
  } catch (error) {
    console.error('Error fetching appointments:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get appointment by ID
exports.getAppointmentById = async (req, res) => {
  try {
    const { id, role } = req.user;
    const appointmentId = req.params.id;

    const appointment = await Appointment.findByPk(appointmentId, {
      attributes: ['id', 'doctor_id', 'patient_id', 'appointment_date', 'duration_minutes', 'status', 'notes', 'version'],
      include: [
        { model: User, as: 'patient', attributes: ['id', 'first_name', 'last_name', 'email'] },
        { model: User, as: 'doctor', attributes: ['id', 'first_name', 'last_name', 'email'] }
      ]
    });

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    // Check if user has permission to view this appointment
    if (role === 'doctor' && appointment.doctor_id !== id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (role === 'patient' && appointment.patient_id !== id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    res.json(appointment);
  } catch (error) {
    console.error('Error fetching appointment:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Create new appointment with transaction
exports.createAppointment = async (req, res) => {
  const t = await sequelize.transaction({
    isolationLevel: sequelize.Sequelize.Transaction.ISOLATION_LEVELS.REPEATABLE_READ
  });

  try {
    const { id: doctor_id, role } = req.user;
    const { patient_id, appointment_date, duration_minutes, notes } = req.body;

    // Only doctors can create appointments
    if (role !== 'doctor') {
      await t.rollback();
      return res.status(403).json({ message: 'Only doctors can create appointments' });
    }

    // Check for conflicting appointments
    const conflictingAppointment = await Appointment.findOne({
      where: {
        doctor_id,
        appointment_date,
        status: 'scheduled'
      },
      transaction: t
    });

    if (conflictingAppointment) {
      await t.rollback();
      return res.status(400).json({ message: 'Time slot not available' });
    }

    // Create appointment
    const appointment = await Appointment.create({
      doctor_id,
      patient_id,
      appointment_date,
      duration_minutes,
      notes,
      status: 'scheduled'
    }, { 
      transaction: t,
      include: [
        { model: User, as: 'patient', attributes: ['id', 'first_name', 'last_name', 'email'] },
        { model: User, as: 'doctor', attributes: ['id', 'first_name', 'last_name', 'email'] }
      ]
    });

    await t.commit();
    res.status(201).json(appointment);
  } catch (error) {
    await t.rollback();
    console.error('Error creating appointment:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update appointment with transaction and version check
exports.updateAppointment = async (req, res) => {
  const t = await sequelize.transaction({
    isolationLevel: sequelize.Sequelize.Transaction.ISOLATION_LEVELS.REPEATABLE_READ
  });

  try {
    const appointmentId = req.params.id;
    const { version, ...updateData } = req.body;

    // Find appointment with lock
    const appointment = await Appointment.findByPk(appointmentId, {
      transaction: t,
      lock: t.LOCK.UPDATE
    });

    if (!appointment) {
      await t.rollback();
      return res.status(404).json({ message: 'Appointment not found' });
    }

    // Check version to prevent lost updates
    if (appointment.version !== version) {
      await t.rollback();
      return res.status(409).json({ 
        message: 'Appointment was modified by another user',
        currentVersion: appointment.version
      });
    }

    // If updating appointment date, check for conflicts
    if (updateData.appointment_date && updateData.appointment_date !== appointment.appointment_date) {
      const conflictingAppointment = await Appointment.findOne({
        where: {
          doctor_id: appointment.doctor_id,
          appointment_date: updateData.appointment_date,
          status: 'scheduled',
          id: { [sequelize.Sequelize.Op.ne]: appointmentId }
        },
        transaction: t
      });

      if (conflictingAppointment) {
        await t.rollback();
        return res.status(400).json({ message: 'Time slot not available' });
      }
    }

    // Update appointment with version increment
    const updatedAppointment = await appointment.update({
      ...updateData,
      version: appointment.version + 1
    }, { 
      transaction: t,
      returning: true
    });

    await t.commit();
    res.json(updatedAppointment);
  } catch (error) {
    await t.rollback();
    console.error('Error updating appointment:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete appointment with transaction
exports.deleteAppointment = async (req, res) => {
  const t = await sequelize.transaction({
    isolationLevel: sequelize.Sequelize.Transaction.ISOLATION_LEVELS.REPEATABLE_READ
  });

  try {
    const appointmentId = req.params.id;
    const appointment = await Appointment.findByPk(appointmentId, {
      transaction: t,
      lock: t.LOCK.UPDATE
    });

    if (!appointment) {
      await t.rollback();
      return res.status(404).json({ message: 'Appointment not found' });
    }

    await appointment.destroy({ transaction: t });
    await t.commit();
    res.json({ message: 'Appointment deleted successfully' });
  } catch (error) {
    await t.rollback();
    console.error('Error deleting appointment:', error);
    res.status(500).json({ message: 'Server error' });
  }
}; 