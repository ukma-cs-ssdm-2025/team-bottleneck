import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import PropTypes from 'prop-types';
import axios from 'axios';
import { API_BASE_URL } from '../constants/apiConfig';

// 1. Create the Context object
const AuthContext = createContext(null);

// Helper function to get authentication status from localStorage
const getAuthStatus = () => {
    const username = localStorage.getItem('authUsername');
    return !!username;
};

const fetchUserProfile = async (username, password) => {
    if (!username || !password) return null;
    try {
        const encodedCredentials = btoa(`${username}:${password}`);
        const response = await axios.get(`${API_BASE_URL}/users/me/`, {
            headers: {
                Authorization: `Basic ${encodedCredentials}`,
            },
        });
        return response.data;
    } catch (error) {
        console.error('Failed to restore user session:', error);
        localStorage.removeItem('authUsername');
        localStorage.removeItem('authPassword');
        return null;
    }
};


// 2. Create the Provider component (Тільки одне оголошення!)
export const AuthProvider = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(getAuthStatus());
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkSession = async () => {
            const username = localStorage.getItem('authUsername');
            const password = localStorage.getItem('authPassword');

            if (username && password) {
                const userData = await fetchUserProfile(username, password);
                if (userData) {
                    setUser(userData);
                    setIsAuthenticated(true);
                } else {
                    setIsAuthenticated(false);
                }
            }
            setLoading(false);
        };
        checkSession();
    }, []);


    const login = useCallback((username, password, userData) => {
        localStorage.setItem('authUsername', username);
        localStorage.setItem('authPassword', password);
        setUser(userData);
        setIsAuthenticated(true);
    }, []);

    const logout = useCallback(() => {
        localStorage.removeItem('authUsername');
        localStorage.removeItem('authPassword');
        setUser(null);
        setIsAuthenticated(false);
    }, []);

    const updateUser = useCallback((newUserData) => {
        setUser(prevUser => ({
            ...prevUser,
            ...newUserData
        }));
    }, []);

    const getCredentials = useCallback(() => ({
        username: localStorage.getItem('authUsername'),
        password: localStorage.getItem('authPassword')
    }), []);

    const isAdmin = user?.is_staff === true;

    const isOperator = !isAdmin && !!(user?.operator_profile && user.operator_profile.lot_id);

    const value = useMemo(() => ({
        isAuthenticated,
        user,
        login,
        logout,
        getCredentials,
        updateUser,
        loading,
        isAdmin,
        isOperator,
    }), [
        isAuthenticated,
        user,
        loading,
        isAdmin,
        isOperator,
        login,
        logout,
        getCredentials,
        updateUser
    ]);

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

AuthProvider.propTypes = {
    children: PropTypes.node.isRequired,
};


// 3. Custom Hook for easier access to AuthContext values
export const useAuth = () => {
    return useContext(AuthContext);
};