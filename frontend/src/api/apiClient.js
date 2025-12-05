import axios from 'axios';
import { API_BASE_URL } from '../constants/apiConfig';

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
    failedQueue.forEach(prom => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });
    failedQueue = [];
};

const apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 30000,
});


apiClient.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('accessToken');
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

apiClient.interceptors.response.use(
    (response) => {
        return response;
    },
    async (error) => {
        const originalRequest = error.config;
        
        if (error.response?.status === 401 && originalRequest.url !== '/token/refresh/') {
            
            if (originalRequest._retry) {
                 return Promise.reject(error);
            }
            
            if (isRefreshing) {
                return new Promise(function(resolve, reject) {
                    failedQueue.push({ resolve, reject });
                }).then(token => {
                    originalRequest.headers['Authorization'] = 'Bearer ' + token;
                    return apiClient(originalRequest);
                }).catch(err => {
                    return Promise.reject(err);
                });
            }
            
            originalRequest._retry = true; 
            isRefreshing = true;
            
            const refreshToken = localStorage.getItem('refreshToken');

            if (refreshToken) {
                try {
                    const response = await axios.post(`${API_BASE_URL}/token/refresh/`, {
                        refresh: refreshToken,
                    }, { timeout: 5000 });

                    const newAccessToken = response.data.access;
                    localStorage.setItem('accessToken', newAccessToken);

                    originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;
                    processQueue(null, newAccessToken); 
                    
                    isRefreshing = false;
                    
                    return apiClient(originalRequest); 
                } catch (_error) {
                    isRefreshing = false;
                    processQueue(_error, null); 
                    
                    localStorage.removeItem('accessToken');
                    localStorage.removeItem('refreshToken');
                    
                    if (typeof window !== 'undefined') {
                        window.location.href = '/login'; 
                    }
                    
                    return Promise.reject(_error);
                }
            } else {
                 if (typeof window !== 'undefined') {
                    window.location.href = '/login'; 
                 }
            }
        }
        
        return Promise.reject(error);
    }
);

export default apiClient;