import axios from 'axios';
import { API_BASE_URL } from '../constants/apiConfig'; 
import { getCredentialsFromStorage } from '../context/AuthContext'; 

const apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Interceptor for adding Basic Auth headers to protected requests
apiClient.interceptors.request.use(
    (config) => {
        const username = localStorage.getItem('authUsername');
        const password = localStorage.getItem('authPassword');
        
        // If credentials exist and the request is not for registration/login,
        // add the Basic Auth header
        if (username && password) {
            const encodedCredentials = btoa(`${username}:${password}`);
            config.headers.Authorization = `Basic ${encodedCredentials}`;
        }
        
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export default apiClient;
