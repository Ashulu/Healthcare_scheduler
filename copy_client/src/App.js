import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Container } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';

// Components
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import AppointmentForm from './pages/AppointmentForm';
import AppointmentDetails from './pages/AppointmentDetails';
import ReportForm from './pages/ReportForm';
import ReportView from './pages/ReportView';
import ReportGenerator from './pages/ReportGenerator';

// Auth context
import { AuthProvider, useAuth } from './context/AuthContext';

// Protected route component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }
  
  return children;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Navbar />
        <Container className="py-4">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />
            <Route path="/appointments/new" element={
              <ProtectedRoute>
                <AppointmentForm />
              </ProtectedRoute>
            } />
            <Route path="/appointments/:id" element={
              <ProtectedRoute>
                <AppointmentDetails />
              </ProtectedRoute>
            } />
            <Route path="/appointments/:id/edit" element={
              <ProtectedRoute>
                <AppointmentForm />
              </ProtectedRoute>
            } />
            <Route path="/appointments/:id/report" element={
              <ProtectedRoute>
                <ReportForm />
              </ProtectedRoute>
            } />
            <Route path="/reports/:id" element={
              <ProtectedRoute>
                <ReportView />
              </ProtectedRoute>
            } />
            <Route path="/reports" element={
              <ProtectedRoute>
                <ReportGenerator />
              </ProtectedRoute>
            } />
          </Routes>
        </Container>
      </Router>
    </AuthProvider>
  );
}

export default App;
