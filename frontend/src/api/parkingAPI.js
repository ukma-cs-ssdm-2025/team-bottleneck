import axios from 'axios';
import { API_BASE_URL } from '../constants/apiConfig';
import apiClient from './apiClient';


export const getTokensAndProfile = async (credentials) => {
    const tokenResponse = await axios.post(`${API_BASE_URL}/token/`, { 
        username: credentials.username,
        password: credentials.password
    });
    const tokens = tokenResponse.data;

    const profileResponse = await axios.get(`${API_BASE_URL}/users/me/`, {
        headers: {
            Authorization: `Bearer ${tokens.access}`,
        },
    });
    const userData = profileResponse.data;

    return { tokens, userData };
};



export const loginUser = async (credentials) => {
    const { tokens, userData } = await getTokensAndProfile(credentials);
    

    localStorage.setItem('accessToken', tokens.access);
    localStorage.setItem('refreshToken', tokens.refresh);

    return userData;
};



export const fetchParkingLots = async () => {
    try {
        const response = await axios.get(`${API_BASE_URL}/lots/`);
        return response.data.results;
    } catch (error) {
        console.error('Не вдалося завантажити список паркінгів:', error);
        throw error;
    }
};

export async function fetchParkingLotDetails(lotId) {
    try {
        const response = await axios.get(`${API_BASE_URL}/lots/${lotId}/`);
        return response.data;
    } catch (error) {
        console.error(`Error fetching details for lot ${lotId}:`, error);
        throw error;
    }
}

export async function fetchAvailableSpots(lotId, start, end) {
    try {
        const response = await axios.get(`${API_BASE_URL}/lots/${lotId}/spots`, {
            params: {
                available_from: start,
                available_to: end,
            }
        });
        return response.data;
    } catch (error) {
        console.error("Error fetching available spots:", error);
        throw error;
    }
}

export const registerUser = async (userData) => {
    try {
        const response = await apiClient.post('/users/register/', userData);
        return response.data;
    } catch (error) {
        console.error('User registration error:', error);
        throw error;
    }
};

export const updateProfile = async (profileData) => {
    try {
        const response = await apiClient.patch('/users/me/', profileData);
        return response.data;
    } catch (error) {
        console.error('User profile update error:', error);
        throw error;
    }
};

export const fetchUserBookings = async () => {
    try {
        const response = await apiClient.get('/bookings/');
        return response.data.results || response.data;
    } catch (error) {
        console.error('Error fetching user bookings:', error);
        throw error;
    }
};

export const cancelBooking = async (bookingId, reason = 'Client cancellation') => {
    try {
        const response = await apiClient.post(`/bookings/${bookingId}/cancel/`, {
            reason: reason,
        });
        return response.data;
    } catch (error) {
        console.error(`Error cancelling booking ${bookingId}:`, error);
        throw error;
    }
};

export const createBooking = async (bookingData) => {
    try {
        const response = await apiClient.post('/bookings/create/', bookingData);
        return response.data;
    } catch (error) {
        console.error('Error creating booking:', error);
        throw error;
    }
};