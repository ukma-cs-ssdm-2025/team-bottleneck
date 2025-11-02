import React, { createContext, useContext, useState, useEffect } from 'react';
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
        const encodedCredentials = btoa(`${username}:${password}`); // ⭐ ВИПРАВЛЕНО: Бектіки
        const response = await axios.get(`${API_BASE_URL}/users/me/`, { // ⭐ ВИПРАВЛЕНО: Бектіки
            headers: {
                Authorization: `Basic ${encodedCredentials}`, // ⭐ ВИПРАВЛЕНО: Бектіки
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


    // Function to handle successful login
    const login = (username, password, userData) => {
        localStorage.setItem('authUsername', username);
        localStorage.setItem('authPassword', password);
        setUser(userData);
        setIsAuthenticated(true);
    };

    // Function to handle logout
    const logout = () => {
        localStorage.removeItem('authUsername');
        localStorage.removeItem('authPassword');
        setUser(null);
        setIsAuthenticated(false);
    };

    const updateUser = (newUserData) => {
        setUser(prevUser => ({
            ...prevUser,
            ...newUserData
        }));
    };

    const getCredentials = () => ({
        username: localStorage.getItem('authUsername'),
        password: localStorage.getItem('authPassword')
    });

    // 1. Адміністратор: is_staff = True
    const isAdmin = user?.is_staff === true; 
    
    // 2. Оператор: повинен мати профіль оператора І НЕ БУТИ Адміном
    const isOperator = !isAdmin && !!(user?.operator_profile && user.operator_profile.lot_id); 

    return (
        <AuthContext.Provider value={{
            isAuthenticated,
            user,
            login,
            logout,
            getCredentials,
            updateUser,
            loading,
            isAdmin,
            isOperator,
        }}>
            {children}
        </AuthContext.Provider>
    );
};

// 3. Custom Hook for easier access to AuthContext values
export const useAuth = () => {
    return useContext(AuthContext);
};