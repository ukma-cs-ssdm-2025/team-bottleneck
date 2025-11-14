import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import PropTypes from 'prop-types';
import axios from 'axios';
import { API_BASE_URL } from '../constants/apiConfig';


const AuthContext = createContext(null);


const getAuthStatus = () => {
    return !!localStorage.getItem('accessToken');
};


const fetchUserProfile = async () => {
    const accessToken = localStorage.getItem('accessToken');
    if (!accessToken) return null;
    
    try {

        const response = await axios.get(`${API_BASE_URL}/users/me/`, { 
             headers: {
                 Authorization: `Bearer ${accessToken}`, 
             },
        });
        return response.data;
    } catch (error) {
        return null;
    }
};


export const AuthProvider = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(getAuthStatus());
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [authTokens, setAuthTokens] = useState(null); 
    useEffect(() => {
        const checkSession = async () => {
            const accessToken = localStorage.getItem('accessToken');
            const refreshToken = localStorage.getItem('refreshToken');

            if (accessToken && refreshToken) {
                const userData = await fetchUserProfile(); 
                if (userData) {
                    setAuthTokens({ access: accessToken, refresh: refreshToken });
                    setUser(userData);
                    setIsAuthenticated(true);
                } else {
                  
                    logout(); 
                }
            }
            setLoading(false);
        };
        checkSession();
    }, []);



    const login = useCallback((tokens, userData) => {
        localStorage.setItem('accessToken', tokens.access);
        localStorage.setItem('refreshToken', tokens.refresh);
        setAuthTokens(tokens);
        setUser(userData);
        setIsAuthenticated(true);
    }, []);

    const logout = useCallback(() => {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        setAuthTokens(null);
        setUser(null);
        setIsAuthenticated(false);
    }, []);
    
    const updateUser = useCallback((newUserData) => {
        setUser(prevUser => ({
            ...prevUser,
            ...newUserData
        }));
    }, []);


    const isAdmin = user?.is_staff === true;
    const isOperator = !isAdmin && !!(user?.operator_profile && user.operator_profile.lot_id);

    const value = useMemo(() => ({
        isAuthenticated,
        user,
        login,
        logout,
        updateUser,
        loading,
        isAdmin,
        isOperator,
        authTokens, 
        setAuthTokens, 
    }), [
        isAuthenticated,
        user,
        loading,
        isAdmin,
        isOperator,
        login,
        logout,
        updateUser,
        authTokens,
        setAuthTokens
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


export const useAuth = () => {
    return useContext(AuthContext);
};