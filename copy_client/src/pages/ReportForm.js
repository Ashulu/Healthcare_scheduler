import React, { useState, useEffect } from 'react';
import { Form, Button, Card, Alert } from 'react-bootstrap';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { appointmentApi, reportApi } from '../services/api';
import moment from 'moment';

const ReportForm = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [appointment, setAppointment] = useState(null);
  const [reportText, setReportText] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const fetchAppointment = async () => {
      try {
        // Only doctors can create reports
        if (user?.role !== 'doctor') {
          setError('Only doctors can create patient reports');
          setLoading(false);
          return;
        }

        const result = await appointmentApi.getAppointmentById(id);
        if (result.success) {
          setAppointment(result.data);
        } else {
          setError(result.message);
        }
      } catch (err) {
        setError('Failed to fetch appointment details');
      } finally {
        setLoading(false);
      }
    };

    fetchAppointment();
  }, [id, user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setSubmitting(true);
      setError('');
      
      const reportData = {
        patient_id: appointment.patient_id,
        appointment_id: appointment.id,
        report_text: reportText
      };
      
      const result = await reportApi.createPatientReport(reportData);
      
      if (result.success) {
        setSuccess('Report created successfully');
        setTimeout(() => navigate('/'), 1500);
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError('Failed to create report');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="text-center">Loading...</div>;
  }

  if (user?.role !== 'doctor') {
    return <Alert variant="danger">Only doctors can create patient reports</Alert>;
  }

  if (!appointment) {
    return <Alert variant="danger">Appointment not found</Alert>;
  }

  return (
    <div className="d-flex justify-content-center">
      <Card style={{ width: '600px' }}>
        <Card.Body>
          <h2 className="text-center mb-4">Create Patient Report</h2>
          
          {error && <Alert variant="danger">{error}</Alert>}
          {success && <Alert variant="success">{success}</Alert>}
          
          <div className="mb-4">
            <h5>Appointment Details</h5>
            <p><strong>Patient:</strong> {appointment.patient.first_name} {appointment.patient.last_name}</p>
            <p><strong>Date:</strong> {moment(appointment.appointment_date).format('MMMM DD, YYYY h:mm A')}</p>
            <p><strong>Duration:</strong> {appointment.duration_minutes} minutes</p>
            <p><strong>Status:</strong> {appointment.status}</p>
          </div>
          
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Report</Form.Label>
              <Form.Control
                as="textarea"
                value={reportText}
                onChange={(e) => setReportText(e.target.value)}
                rows={6}
                required
                placeholder="Enter patient report details here..."
              />
            </Form.Group>
            
            <div className="d-flex justify-content-between">
              <Button variant="secondary" onClick={() => navigate('/')}>
                Cancel
              </Button>
              <Button variant="primary" type="submit" disabled={submitting}>
                {submitting ? 'Submitting...' : 'Submit Report'}
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>
    </div>
  );
};

export default ReportForm; 