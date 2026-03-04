import { apiClient } from '../utils/api';

export const authService = {
  // Register new user
  register: async (userData) => {
    const response = await apiClient('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
    
    if (response.token) {
      localStorage.setItem('jocky_token', response.token);
      localStorage.setItem('jocky_user', JSON.stringify(response.user));
    }
    
    return response;
  },

  // Login
  login: async (email, password) => {
    const response = await apiClient('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    
    if (response.token) {
      localStorage.setItem('jocky_token', response.token);
      localStorage.setItem('jocky_user', JSON.stringify(response.user));
    }
    
    return response;
  },

  // Logout
  logout: () => {
    localStorage.removeItem('jocky_token');
    localStorage.removeItem('jocky_user');
  },

  // Get current user
  getCurrentUser: () => {
    const userStr = localStorage.getItem('jocky_user');
    return userStr ? JSON.parse(userStr) : null;
  },

  // Check if user is authenticated
  isAuthenticated: () => {
    return !!localStorage.getItem('jocky_token');
  },
};
