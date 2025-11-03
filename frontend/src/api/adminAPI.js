

import apiClient from './apiClient';

export const createParkingLot = async (lotData) => {
    try {
        const response = await apiClient.post('/lots/', lotData);
        return response.data;
    } catch (error) {
        throw error;
    }
};

export const getAdminParkingLots = async () => {
    try {
        const response = await apiClient.get('/lots/');
        if (response.data && Array.isArray(response.data.results)) {
            return response.data.results;
        }
        return response.data;
    } catch (error) {
        throw error;
    }
};

export const getParkingLotDetails = async (lotId) => {
    try {
        const response = await apiClient.get(`/lots/${lotId}/`);
        return response.data;
    } catch (error) {
        throw error;
    }
};

export const updateParkingLot = async (lotId, lotData) => {
    try {
        const response = await apiClient.patch(`/lots/${lotId}/`, lotData);
        return response.data;
    } catch (error) {
        throw error;
    }
};

export const deleteParkingLot = async (lotId) => {
    try {
        await apiClient.delete(`/lots/${lotId}/`);
    } catch (error) {
        throw error;
    }
};

export const getAllUsers = async () => {
    try {
        const response = await apiClient.get('/users/');
        if (response.data && Array.isArray(response.data.results)) {
            return response.data.results;
        }
        return response.data;
    } catch (error) {
        throw error;
    }
};

export const makeOperator = async (userId, lotId) => {
    const response = await apiClient.post(`/users/${userId}/make-operator/`, { lot_id: lotId });
    return response.data;
};

export const removeOperator = async (userId) => {
    const response = await apiClient.delete(`/users/${userId}/remove-operator/`);
    return response.data;
};

export const makeAdmin = async (userId) => {
    const response = await apiClient.post(`/users/${userId}/make-admin/`);
    return response.data;
};

export const removeAdmin = async (userId) => {
    const response = await apiClient.delete(`/users/${userId}/remove-admin/`);
    return response.data;
};
