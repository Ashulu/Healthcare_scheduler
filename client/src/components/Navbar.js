import React from 'react';
import { Navbar as BootstrapNavbar, Nav, Container, Button } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <BootstrapNavbar bg="primary" variant="dark" expand="lg">
      <Container>
        <BootstrapNavbar.Brand as={Link} to="/">Healthcare Scheduler</BootstrapNavbar.Brand>
        <BootstrapNavbar.Toggle aria-controls="basic-navbar-nav" />
        <BootstrapNavbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto">
            {isAuthenticated && (
              <>
                <Nav.Link as={Link} to="/">Dashboard</Nav.Link>
                {user?.role === 'doctor' && (
                  <Nav.Link as={Link} to="/appointments/new">New Appointment</Nav.Link>
                )}
                <Nav.Link as={Link} to="/reports">Reports</Nav.Link>
              </>
            )}
          </Nav>
          <Nav>
            {isAuthenticated ? (
              <>
                <Nav.Item className="d-flex align-items-center text-white me-3">
                  {user?.first_name} {user?.last_name} ({user?.role})
                </Nav.Item>
                <Button variant="outline-light" onClick={handleLogout}>Logout</Button>
              </>
            ) : (
              <>
                <Nav.Link as={Link} to="/login">Login</Nav.Link>
                <Nav.Link as={Link} to="/register">Register</Nav.Link>
              </>
            )}
          </Nav>
        </BootstrapNavbar.Collapse>
      </Container>
    </BootstrapNavbar>
  );
};

export default Navbar; 