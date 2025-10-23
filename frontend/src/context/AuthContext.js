import React, { createContext, useContext, useState, useEffect } from 'react';

// 1. Create the Context object
const AuthContext = createContext(null);

// Helper function to get authentication status from localStorage
const getAuthStatus = () => {
    const username = localStorage.getItem('authUsername');
    // Consider the user authenticated if a username is stored
    return !!username; 
};

// 2. Create the Provider component
export const AuthProvider = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(getAuthStatus());
    // Add state to store user data
    const [user, setUser] = useState(null); 

    // Function to handle successful login (store credentials and user data)
    const login = (username, password, userData) => {
        localStorage.setItem('authUsername', username);
        localStorage.setItem('authPassword', password);
        setUser(userData);
        setIsAuthenticated(true);
    };

    const updateUser = (newUserData) => {
        setUser(prevUser => ({
            ...prevUser,
            ...newUserData
        }));
    };

    // Function to handle logout
    const logout = () => {
        localStorage.removeItem('authUsername');
        localStorage.removeItem('authPassword');
        setUser(null);
        setIsAuthenticated(false);
    };

    // Function to retrieve stored credentials for API requests
    const getCredentials = () => ({
        username: localStorage.getItem('authUsername'),
        password: localStorage.getItem('authPassword')
    });

    return (
        <AuthContext.Provider value={{
            isAuthenticated,
            user,
            login,
            logout,
            getCredentials,
            updateUser,
        }}>
            {children}
        </AuthContext.Provider>
    );
};

// 3. Custom Hook for easier access to AuthContext values
export const useAuth = () => {
    return useContext(AuthContext);
};
