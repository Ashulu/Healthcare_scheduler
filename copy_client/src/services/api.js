import axios from 'axios';

// Set base URL
axios.defaults.baseURL = 'http://localhost:5001';

// Appointments API
export const appointmentApi = {
  // Get all appointments
  getAppointments: async () => {
    try {
      const res = await axios.get('/api/appointments');
      return { success: true, data: res.data };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch appointments'
      };
    }
  },

  // Get appointment by ID
  getAppointmentById: async (id) => {
    try {
      const res = await axios.get(`/api/appointments/${id}`);
      return { success: true, data: res.data };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch appointment'
      };
    }
  },

  // Create appointment
  createAppointment: async (appointmentData) => {
    try {
      const res = await axios.post('/api/appointments', appointmentData);
      return { success: true, data: res.data };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to create appointment'
      };
    }
  },

  // Update appointment
  updateAppointment: async (id, appointmentData) => {
    try {
      const res = await axios.put(`/api/appointments/${id}`, appointmentData);
      return { success: true, data: res.data };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to update appointment'
      };
    }
  },

  // Delete appointment
  deleteAppointment: async (id) => {
    try {
      await axios.delete(`/api/appointments/${id}`);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to delete appointment'
      };
    }
  }
};

// Reports API
export const reportApi = {
  // Get appointment report
  getAppointmentReport: async (filters) => {
    try {
      const res = await axios.get('/api/reports/appointments', { params: filters });
      return { success: true, data: res.data };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to generate report'
      };
    }
  },

  // Create patient report
  createPatientReport: async (reportData) => {
    try {
      const res = await axios.post('/api/reports/patient', reportData);
      return { success: true, data: res.data };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to create report'
      };
    }
  },

  // Get patient report by appointment ID
  getPatientReport: async (appointmentId) => {
    try {
      const res = await axios.get(`/api/reports/patient/${appointmentId}`);
      return { success: true, data: res.data };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch report'
      };
    }
  }
};

// Users API
export const userApi = {
  // Get all doctors
  getDoctors: async () => {
    try {
      const res = await axios.get('/api/users/doctors');
      return { success: true, data: res.data };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch doctors'
      };
    }
  },

  // Get all patients
  getPatients: async () => {
    try {
      const res = await axios.get('/api/users/patients');
      return { success: true, data: res.data };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch patients'
      };
    }
  }
}; 