const { sequelize } = require('../models');
const { QueryTypes } = require('sequelize');
const { PatientReport, Appointment, User } = require('../models');

// Get appointment report with filters
exports.getAppointmentReport = async (req, res) => {
  const t = await sequelize.transaction({
    isolationLevel: sequelize.Sequelize.Transaction.ISOLATION_LEVELS.REPEATABLE_READ
  });

  try {
    const { id, role } = req.user;
    const { start_date, end_date, status } = req.query;

    // Get appointments with direct query
    const appointmentsQuery = `
      SELECT 
        a.id,
        a.appointment_date,
        a.duration_minutes,
        a.status,
        a.notes,
        dp.first_name as doctor_first_name,
        dp.last_name as doctor_last_name,
        pt.first_name as patient_first_name,
        pt.last_name as patient_last_name
      FROM 
        appointments a
      JOIN 
        users dp ON a.doctor_id = dp.id
      JOIN 
        users pt ON a.patient_id = pt.id
      WHERE 
        ${role === 'doctor' ? 'a.doctor_id = :user_id' : 'a.patient_id = :user_id'}
        AND (:start_date IS NULL OR a.appointment_date >= :start_date)
        AND (:end_date IS NULL OR a.appointment_date <= :end_date)
        AND (:status IS NULL OR a.status = :status)
      ORDER BY 
        a.appointment_date DESC
    `;

    const appointments = await sequelize.query(appointmentsQuery, {
      replacements: {
        user_id: id,
        start_date: start_date || null,
        end_date: end_date || null,
        status: status || null
      },
      type: QueryTypes.SELECT,
      transaction: t
    });

    // Get statistics with prepared statement
    const statsQuery = `
      SELECT 
        COUNT(*) as total_appointments,
        AVG(duration_minutes) as avg_duration,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_count,
        COUNT(CASE WHEN status = 'scheduled' THEN 1 END) as scheduled_count,
        COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_count
      FROM 
        appointments a
      WHERE 
        ${role === 'doctor' ? 'a.doctor_id = :user_id' : 'a.patient_id = :user_id'}
        AND (:start_date IS NULL OR a.appointment_date >= :start_date)
        AND (:end_date IS NULL OR a.appointment_date <= :end_date)
        AND (:status IS NULL OR a.status = :status)
    `;

    const [stats] = await sequelize.query(statsQuery, {
      replacements: {
        user_id: id,
        start_date: start_date || null,
        end_date: end_date || null,
        status: status || null
      },
      type: QueryTypes.SELECT,
      transaction: t
    });

    await t.commit();
    res.json({
      appointments,
      statistics: {
        totalAppointments: parseInt(stats.total_appointments),
        averageDuration: parseFloat(stats.avg_duration) || 0,
        completedCount: parseInt(stats.completed_count),
        scheduledCount: parseInt(stats.scheduled_count),
        cancelledCount: parseInt(stats.cancelled_count),
        completionRate: stats.total_appointments > 0 
          ? (parseInt(stats.completed_count) / parseInt(stats.total_appointments)) * 100 
          : 0
      }
    });
  } catch (error) {
    await t.rollback();
    console.error('Error generating appointment report:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Create patient report (doctors only)
exports.createPatientReport = async (req, res) => {
  try {
    const { id, role } = req.user;
    const { patient_id, appointment_id, report_text } = req.body;

    // Only doctors can create reports
    if (role !== 'doctor') {
      return res.status(403).json({ message: 'Only doctors can create patient reports' });
    }

    // Verify the appointment exists and belongs to this doctor
    const appointment = await Appointment.findOne({
      where: { 
        id: appointment_id,
        doctor_id: id,
        patient_id
      }
    });

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found or not authorized' });
    }

    // Check if report already exists
    const existingReport = await PatientReport.findOne({
      where: { appointment_id }
    });

    if (existingReport) {
      return res.status(400).json({ message: 'Report already exists for this appointment' });
    }

    // Create the report
    const report = await PatientReport.create({
      patient_id,
      doctor_id: id,
      appointment_id,
      report_text
    });

    // Update appointment status to completed
    await appointment.update({ status: 'completed' });

    res.status(201).json(report);
  } catch (error) {
    console.error('Error creating patient report:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get patient report by appointment ID (using prepared statement)
exports.getPatientReport = async (req, res) => {
  const t = await sequelize.transaction({
    isolationLevel: sequelize.Sequelize.Transaction.ISOLATION_LEVELS.REPEATABLE_READ
  });

  try {
    const { id, role } = req.user;
    const appointmentId = req.params.id;

    // Use prepared statement for security
    const query = `
      SELECT 
        pr.id,
        pr.report_text,
        pr.created_at,
        a.appointment_date,
        a.status,
        dp.first_name as doctor_first_name,
        dp.last_name as doctor_last_name,
        pt.first_name as patient_first_name,
        pt.last_name as patient_last_name
      FROM 
        patient_reports pr
      JOIN 
        appointments a ON pr.appointment_id = a.id
      JOIN 
        users dp ON pr.doctor_id = dp.id
      JOIN 
        users pt ON pr.patient_id = pt.id
      WHERE 
        pr.appointment_id = :appointment_id
        AND (
          (pr.doctor_id = :user_id AND :role = 'doctor')
          OR 
          (pr.patient_id = :user_id AND :role = 'patient')
        )
    `;

    const [report] = await sequelize.query(query, {
      replacements: { 
        appointment_id: appointmentId,
        user_id: id,
        role
      },
      type: QueryTypes.SELECT,
      transaction: t
    });

    if (!report) {
      await t.rollback();
      return res.status(404).json({ message: 'Report not found or not authorized' });
    }

    await t.commit();
    res.json(report);
  } catch (error) {
    await t.rollback();
    console.error('Error fetching patient report:', error);
    res.status(500).json({ message: 'Server error' });
  }
}; 