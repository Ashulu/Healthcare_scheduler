import React, { useState, useEffect } from 'react';
import { Form, Button, Card, Alert } from 'react-bootstrap';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { appointmentApi, userApi } from '../services/api';
import moment from 'moment';

const AppointmentForm = () => {
  const { id } = useParams();
  const isEditMode = !!id;
  const { user } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    patient_id: '',
    appointment_date: '',
    appointment_time: '',
    duration_minutes: 30,
    notes: '',
    status: 'scheduled',
    version: 1
  });
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Only doctors can create/edit appointments
        if (user?.role !== 'doctor') {
          setError('Only doctors can create or edit appointments');
          setLoading(false);
          return;
        }

        // Fetch patients for dropdown
        const patientsResult = await userApi.getPatients();
        if (patientsResult.success) {
          setPatients(patientsResult.data);
        } else {
          setError(patientsResult.message);
        }

        // If editing, fetch appointment data
        if (isEditMode) {
          const appointmentResult = await appointmentApi.getAppointmentById(id);
          if (appointmentResult.success) {
            const appointment = appointmentResult.data;
            
            // Format date and time for form inputs
            const appointmentDate = moment(appointment.appointment_date);
            
            setFormData({
              patient_id: appointment.patient_id,
              appointment_date: appointmentDate.format('YYYY-MM-DD'),
              appointment_time: appointmentDate.format('HH:mm'),
              duration_minutes: appointment.duration_minutes,
              notes: appointment.notes || '',
              status: appointment.status,
              version: appointment.version
            });
          } else {
            setError(appointmentResult.message);
          }
        }
      } catch (err) {
        setError('Failed to load form data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, isEditMode, user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setError('');
      setSuccess('');
      setLoading(true);
      
      // Combine date and time
      const appointmentDateTime = moment(
        `${formData.appointment_date} ${formData.appointment_time}`,
        'YYYY-MM-DD HH:mm'
      ).toISOString();
      
      const appointmentData = {
        patient_id: formData.patient_id,
        appointment_date: appointmentDateTime,
        duration_minutes: formData.duration_minutes,
        notes: formData.notes,
        status: formData.status
      };
      
      let result;
      if (isEditMode) {
        result = await appointmentApi.updateAppointment(id, {
          ...appointmentData,
          version: formData.version
        });
        
        if (result.success) {
          setSuccess('Appointment saved successfully');
          setTimeout(() => navigate('/'), 1500);
        } else if (result.message === 'Appointment was modified by another user') {
          // Fetch the latest version
          const latestAppointment = await appointmentApi.getAppointmentById(id);
          if (latestAppointment.success) {
            setFormData(prev => ({
              ...prev,
              version: latestAppointment.data.version
            }));
            setError('This appointment was updated elsewhere. Your changes were not saved. Please try again with the latest version.');
          } else {
            setError(result.message);
          }
        } else {
          setError(result.message);
        }
      } else {
        result = await appointmentApi.createAppointment(appointmentData);
        
        if (result.success) {
          setSuccess('Appointment created successfully');
          setTimeout(() => navigate('/'), 1500);
        } else {
          setError(result.message);
        }
      }
    } catch (err) {
      setError('Failed to save appointment');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center">Loading...</div>;
  }

  if (user?.role !== 'doctor') {
    return <Alert variant="danger">Only doctors can create or edit appointments</Alert>;
  }

  return (
    <div className="d-flex justify-content-center">
      <Card style={{ width: '600px' }}>
        <Card.Body>
          <h2 className="text-center mb-4">
            {isEditMode ? 'Edit Appointment' : 'New Appointment'}
          </h2>
          
          {error && <Alert variant="danger">{error}</Alert>}
          {success && <Alert variant="success">{success}</Alert>}
          
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Patient</Form.Label>
              <Form.Select
                name="patient_id"
                value={formData.patient_id}
                onChange={handleChange}
                required
              >
                <option value="">Select Patient</option>
                {patients.map(patient => (
                  <option key={patient.id} value={patient.id}>
                    {patient.first_name} {patient.last_name} ({patient.email})
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Date</Form.Label>
              <Form.Control
                type="date"
                name="appointment_date"
                value={formData.appointment_date}
                onChange={handleChange}
                required
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Time</Form.Label>
              <Form.Control
                type="time"
                name="appointment_time"
                value={formData.appointment_time}
                onChange={handleChange}
                required
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Duration (minutes)</Form.Label>
              <Form.Control
                type="number"
                name="duration_minutes"
                value={formData.duration_minutes}
                onChange={handleChange}
                min="15"
                step="15"
                required
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Notes</Form.Label>
              <Form.Control
                as="textarea"
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows={3}
              />
            </Form.Group>
            
            {isEditMode && (
              <Form.Group className="mb-3">
                <Form.Label>Status</Form.Label>
                <Form.Select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  required
                >
                  <option value="scheduled">Scheduled</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </Form.Select>
              </Form.Group>
            )}
            
            <div className="d-flex justify-content-between">
              <Button variant="secondary" onClick={() => navigate('/')}>
                Cancel
              </Button>
              <Button variant="primary" type="submit" disabled={loading}>
                {isEditMode ? 'Update Appointment' : 'Create Appointment'}
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>
    </div>
  );
};

export default AppointmentForm; 