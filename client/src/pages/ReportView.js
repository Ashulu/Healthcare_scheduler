import React, { useState, useEffect } from 'react';
import { Card, Button, Alert } from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';
import { reportApi } from '../services/api';
import moment from 'moment';

const ReportView = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const result = await reportApi.getPatientReport(id);
        if (result.success) {
          setReport(result.data);
        } else {
          setError(result.message);
        }
      } catch (err) {
        setError('Failed to fetch report');
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, [id]);

  if (loading) {
    return <div className="text-center">Loading...</div>;
  }

  if (!report) {
    return <Alert variant="danger">Report not found</Alert>;
  }

  return (
    <div className="d-flex justify-content-center">
      <Card style={{ width: '700px' }}>
        <Card.Body>
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h2>Patient Report</h2>
            <Button variant="secondary" onClick={() => navigate('/')}>
              Back to Dashboard
            </Button>
          </div>
          
          {error && <Alert variant="danger">{error}</Alert>}
          
          <div className="mb-4">
            <p><strong>Patient:</strong> {report.patient_first_name} {report.patient_last_name}</p>
            <p><strong>Doctor:</strong> {report.doctor_first_name} {report.doctor_last_name}</p>
            <p><strong>Appointment Date:</strong> {moment(report.appointment_date).format('MMMM DD, YYYY h:mm A')}</p>
            <p><strong>Report Created:</strong> {moment(report.created_at).format('MMMM DD, YYYY h:mm A')}</p>
          </div>
          
          <div className="mt-4">
            <h4>Report Content</h4>
            <div className="p-3 bg-light rounded">
              {report.report_text}
            </div>
          </div>
        </Card.Body>
      </Card>
    </div>
  );
};

export default ReportView; 