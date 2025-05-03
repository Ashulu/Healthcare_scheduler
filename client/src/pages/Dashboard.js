import React, { useState, useEffect } from 'react';
import { Card, Button, Table, Badge, Alert } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { appointmentApi } from '../services/api';
import moment from 'moment';

const Dashboard = () => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        const result = await appointmentApi.getAppointments();
        if (result.success) {
          setAppointments(result.data);
        } else {
          setError(result.message);
        }
      } catch (err) {
        setError('Failed to fetch appointments');
      } finally {
        setLoading(false);
      }
    };

    fetchAppointments();
  }, []);

  const handleDeleteAppointment = async (id) => {
    if (window.confirm('Are you sure you want to delete this appointment?')) {
      try {
        const result = await appointmentApi.deleteAppointment(id);
        if (result.success) {
          setAppointments(appointments.filter(appointment => appointment.id !== id));
        } else {
          setError(result.message);
        }
      } catch (err) {
        setError('Failed to delete appointment');
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

  return (
    <div>
      <Card>
        <Card.Body>
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h2>My {user?.role === 'doctor' ? 'Patients' : 'Appointments'}</h2>
            {user?.role === 'doctor' && (
              <Link to="/appointments/new">
                <Button variant="primary">New Appointment</Button>
              </Link>
            )}
          </div>

          {error && <Alert variant="danger">{error}</Alert>}

          {appointments.length === 0 ? (
            <Alert variant="info">
              No appointments found. {user?.role === 'doctor' && 'Create a new appointment to get started.'}
            </Alert>
          ) : (
            <Table responsive striped bordered hover>
              <thead>
                <tr>
                  <th>Date & Time</th>
                  <th>{user?.role === 'doctor' ? 'Patient' : 'Doctor'}</th>
                  <th>Duration</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {appointments.map(appointment => (
                  <tr key={appointment.id}>
                    <td>{moment(appointment.appointment_date).format('MMM DD, YYYY h:mm A')}</td>
                    <td>
                      {user?.role === 'doctor' 
                        ? `${appointment.patient.first_name} ${appointment.patient.last_name}`
                        : `${appointment.doctor.first_name} ${appointment.doctor.last_name}`
                      }
                    </td>
                    <td>{appointment.duration_minutes} minutes</td>
                    <td>{getStatusBadge(appointment.status)}</td>
                    <td>
                      <Link to={`/appointments/${appointment.id}`}>
                        <Button variant="info" size="sm" className="me-2">View</Button>
                      </Link>
                      
                      {user?.role === 'doctor' && (
                        <>
                          <Link to={`/appointments/${appointment.id}/edit`}>
                            <Button variant="warning" size="sm" className="me-2">Edit</Button>
                          </Link>
                          
                          {appointment.status === 'scheduled' && (
                            <Link to={`/appointments/${appointment.id}/report`}>
                              <Button variant="success" size="sm" className="me-2">Add Report</Button>
                            </Link>
                          )}
                          
                          <Button 
                            variant="danger" 
                            size="sm"
                            onClick={() => handleDeleteAppointment(appointment.id)}
                          >
                            Delete
                          </Button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>
    </div>
  );
};

export default Dashboard; 