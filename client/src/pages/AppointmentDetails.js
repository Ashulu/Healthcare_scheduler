import React, { useState, useEffect } from 'react';
import { Card, Button, Alert, Badge, Row, Col } from 'react-bootstrap';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { appointmentApi, reportApi } from '../services/api';
import moment from 'moment';

const AppointmentDetails = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [appointment, setAppointment] = useState(null);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch appointment details
        const appointmentResult = await appointmentApi.getAppointmentById(id);
        if (appointmentResult.success) {
          setAppointment(appointmentResult.data);
          
          // Try to fetch report if it exists
          const reportResult = await reportApi.getPatientReport(id);
          if (reportResult.success) {
            setReport(reportResult.data);
          }
        } else {
          setError(appointmentResult.message);
        }
      } catch (err) {
        setError('Failed to fetch appointment details');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const handleCancelAppointment = async () => {
    if (window.confirm('Are you sure you want to cancel this appointment?')) {
      try {
        const result = await appointmentApi.updateAppointment(id, { status: 'cancelled' });
        if (result.success) {
          setAppointment({ ...appointment, status: 'cancelled' });
        } else {
          setError(result.message);
        }
      } catch (err) {
        setError('Failed to cancel appointment');
      }
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'scheduled':
        return <Badge bg="primary">Scheduled</Badge>;
      case 'completed':
        return <Badge bg="success">Completed</Badge>;
      case 'cancelled':
        return <Badge bg="danger">Cancelled</Badge>;
      default:
        return <Badge bg="secondary">{status}</Badge>;
    }
  };

  if (loading) {
    return <div className="text-center">Loading...</div>;
  }

  if (!appointment) {
    return <Alert variant="danger">Appointment not found</Alert>;
  }

  return (
    <div>
      <Card className="mb-4">
        <Card.Body>
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h2>Appointment Details</h2>
            <Button variant="secondary" onClick={() => navigate('/')}>
              Back to Dashboard
            </Button>
          </div>
          
          {error && <Alert variant="danger">{error}</Alert>}
          
          <Row>
            <Col md={6}>
              <p><strong>Date & Time:</strong> {moment(appointment.appointment_date).format('MMMM DD, YYYY h:mm A')}</p>
              <p><strong>Duration:</strong> {appointment.duration_minutes} minutes</p>
              <p><strong>Status:</strong> {getStatusBadge(appointment.status)}</p>
            </Col>
            <Col md={6}>
              <p>
                <strong>{user?.role === 'doctor' ? 'Patient:' : 'Doctor:'}</strong>{' '}
                {user?.role === 'doctor' 
                  ? `${appointment.patient.first_name} ${appointment.patient.last_name}`
                  : `${appointment.doctor.first_name} ${appointment.doctor.last_name}`
                }
              </p>
              <p>
                <strong>Email:</strong>{' '}
                {user?.role === 'doctor' 
                  ? appointment.patient.email
                  : appointment.doctor.email
                }
              </p>
            </Col>
          </Row>
          
          {appointment.notes && (
            <div className="mt-3">
              <h5>Notes</h5>
              <p>{appointment.notes}</p>
            </div>
          )}
          
          <div className="mt-4">
            {user?.role === 'doctor' ? (
              <div className="d-flex gap-2">
                {appointment.status === 'scheduled' && (
                  <>
                    <Link to={`/appointments/${id}/edit`}>
                      <Button variant="warning">Edit Appointment</Button>
                    </Link>
                    <Link to={`/appointments/${id}/report`}>
                      <Button variant="success">Add Report</Button>
                    </Link>
                    <Button variant="danger" onClick={handleCancelAppointment}>
                      Cancel Appointment
                    </Button>
                  </>
                )}
              </div>
            ) : (
              <>
                {appointment.status === 'scheduled' && (
                  <Button variant="danger" onClick={handleCancelAppointment}>
                    Cancel Appointment
                  </Button>
                )}
              </>
            )}
          </div>
        </Card.Body>
      </Card>
      
      {report && (
        <Card>
          <Card.Body>
            <h3 className="mb-3">Patient Report</h3>
            <p><strong>Created:</strong> {moment(report.created_at).format('MMMM DD, YYYY h:mm A')}</p>
            <div className="mt-3">
              <h5>Report Content</h5>
              <p>{report.report_text}</p>
            </div>
          </Card.Body>
        </Card>
      )}
    </div>
  );
};

export default AppointmentDetails; 