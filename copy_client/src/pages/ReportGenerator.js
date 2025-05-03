import React, { useState, useEffect } from 'react';
import { Card, Form, Button, Alert, Table, Row, Col } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';
import { reportApi } from '../services/api';
import moment from 'moment';

const ReportGenerator = () => {
  const { user } = useAuth();
  const [filters, setFilters] = useState({
    start_date: moment().subtract(30, 'days').format('YYYY-MM-DD'),
    end_date: moment().format('YYYY-MM-DD'),
    status: ''
  });
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError('');
      
      const result = await reportApi.getAppointmentReport(filters);
      
      if (result.success) {
        setReport(result.data);
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError('Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Card className="mb-4">
        <Card.Body>
          <h2 className="mb-4">Appointment Report</h2>
          
          {error && <Alert variant="danger">{error}</Alert>}
          
          <Form onSubmit={handleSubmit}>
            <Row>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Start Date</Form.Label>
                  <Form.Control
                    type="date"
                    name="start_date"
                    value={filters.start_date}
                    onChange={handleChange}
                    required
                  />
                </Form.Group>
              </Col>
              
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>End Date</Form.Label>
                  <Form.Control
                    type="date"
                    name="end_date"
                    value={filters.end_date}
                    onChange={handleChange}
                    required
                  />
                </Form.Group>
              </Col>
              
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Status</Form.Label>
                  <Form.Select
                    name="status"
                    value={filters.status}
                    onChange={handleChange}
                  >
                    <option value="">All Statuses</option>
                    <option value="scheduled">Scheduled</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
            
            <div className="d-flex justify-content-end">
              <Button variant="primary" type="submit" disabled={loading}>
                {loading ? 'Generating...' : 'Generate Report'}
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>
      
      {report && (
        <>
          <Card className="mb-4">
            <Card.Body>
              <h3 className="mb-3">Statistics</h3>
              <Row>
                <Col md={3}>
                  <div className="text-center mb-3">
                    <h5>Total Appointments</h5>
                    <div className="fs-2 fw-bold">{report.statistics.totalAppointments}</div>
                  </div>
                </Col>
                <Col md={3}>
                  <div className="text-center mb-3">
                    <h5>Average Duration</h5>
                    <div className="fs-2 fw-bold">{report.statistics.averageDuration.toFixed(0)} min</div>
                  </div>
                </Col>
                <Col md={3}>
                  <div className="text-center mb-3">
                    <h5>Completion Rate</h5>
                    <div className="fs-2 fw-bold">{report.statistics.completionRate.toFixed(1)}%</div>
                  </div>
                </Col>
                <Col md={3}>
                  <div className="text-center mb-3">
                    <h5>Cancelled</h5>
                    <div className="fs-2 fw-bold">{report.statistics.cancelledCount}</div>
                  </div>
                </Col>
              </Row>
            </Card.Body>
          </Card>
          
          <Card>
            <Card.Body>
              <h3 className="mb-3">Appointments</h3>
              {report.appointments.length === 0 ? (
                <Alert variant="info">No appointments found for the selected criteria.</Alert>
              ) : (
                <Table responsive striped bordered hover>
                  <thead>
                    <tr>
                      <th>Date & Time</th>
                      <th>{user?.role === 'doctor' ? 'Patient' : 'Doctor'}</th>
                      <th>Duration</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.appointments.map(appointment => (
                      <tr key={appointment.id}>
                        <td>{moment(appointment.appointment_date).format('MMM DD, YYYY h:mm A')}</td>
                        <td>
                          {user?.role === 'doctor' 
                            ? `${appointment.patient_first_name} ${appointment.patient_last_name}`
                            : `${appointment.doctor_first_name} ${appointment.doctor_last_name}`
                          }
                        </td>
                        <td>{appointment.duration_minutes} minutes</td>
                        <td>{appointment.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </Card.Body>
          </Card>
        </>
      )}
    </div>
  );
};

export default ReportGenerator; 