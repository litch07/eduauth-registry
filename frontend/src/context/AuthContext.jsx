import React, { createContext, useState, useEffect, useContext } from 'react';

/**
 * Authentication Context
 * Provides global authentication state and methods
 */
const AuthContext = createContext();

/**
 * AuthProvider Component
 * Wraps the application and provides authentication context
 * 
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components
 */
export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    /**
     * Load authentication data from localStorage on mount
     */
    useEffect(() => {
        try {
            const token = localStorage.getItem('token');
            const storedUser = localStorage.getItem('user');

            if (token && storedUser) {
                // Parse user data from JSON
                const userData = JSON.parse(storedUser);
                setUser(userData);
            }
        } catch (error) {
            console.error('Error loading authentication data:', error);
            // Clear invalid data
            localStorage.removeItem('token');
            localStorage.removeItem('user');
        } finally {
            setLoading(false);
        }
    }, []);

    /**
     * Login user and save authentication data
     * 
     * @param {string} token - JWT authentication token
     * @param {Object} userData - User data object (id, email, role)
     */
    const login = (token, userData) => {
        // Save to localStorage
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(userData));
        
        // Update state
        setUser(userData);
    };

    /**
     * Logout user and clear authentication data
     * Redirects to login page after logout
     */
    const logout = () => {
        // Clear localStorage
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        
        // Clear state
        setUser(null);
        
        // Redirect to login page
        window.location.href = '/login';
    };

    /**
     * Update user data
     * Merges new data with existing user data
     * 
     * @param {Object} updatedData - Updated user data to merge
     */
    const updateUser = (updatedData) => {
        // Merge with existing user data
        const updatedUser = {
            ...user,
            ...updatedData
        };
        
        // Update localStorage
        localStorage.setItem('user', JSON.stringify(updatedUser));
        
        // Update state
        setUser(updatedUser);
    };

    /**
     * Context value object
     */
    const value = {
        user,
        loading,
        login,
        logout,
        updateUser
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

/**
 * useAuth Hook
 * Custom hook to access authentication context
 * 
 * @returns {Object} Authentication context (user, loading, login, logout, updateUser)
 * @throws {Error} If used outside AuthProvider
 */
export const useAuth = () => {
    const context = useContext(AuthContext);
    
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    
    return context;
};

export default AuthContext;
