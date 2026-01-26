import axios from 'axios';

/**
 * Axios instance for API communication
 * Configured with base URL, interceptors, and authentication handling
 */
const api = axios.create({
    baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
    headers: {
        'Content-Type': 'application/json'
    },
    timeout: 30000
});

/**
 * Request interceptor
 * Adds JWT token to Authorization header if available
 */
api.interceptors.request.use(
    (config) => {
        // Get token from localStorage
        const token = localStorage.getItem('token');
        
        // If token exists, add Authorization header
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

/**
 * Response interceptor
 * Handles authentication errors and token expiration
 */
api.interceptors.response.use(
    (response) => {
        // Return response data on success
        return response;
    },
    (error) => {
        const status = error.response?.status;
        const requestUrl = error.config?.url || '';

        // Only redirect on auth failures outside of login attempts
        const isAuthEndpoint = requestUrl.includes('/auth/login');

        if (status === 401 && !isAuthEndpoint) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
        }

        return Promise.reject(error);
    }
);

export default api;
