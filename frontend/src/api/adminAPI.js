

import apiClient from './apiClient';

export const createParkingLot = async (lotData) => {
    const response = await apiClient.post('/lots/', lotData);
    return response.data;
};

export const getAdminParkingLots = async () => {
    const response = await apiClient.get('/lots/');
    if (response.data && Array.isArray(response.data.results)) {
        return response.data.results;
    }
    return response.data;

};

export const getParkingLotDetails = async (lotId) => {
    const response = await apiClient.get(`/lots/${lotId}/`);
    return response.data;
};

export const updateParkingLot = async (lotId, lotData) => {
    const response = await apiClient.patch(`/lots/${lotId}/`, lotData);
    return response.data;
};

export const deleteParkingLot = async (lotId) => {
    await apiClient.delete(`/lots/${lotId}/`);
};

export const getAllUsers = async () => {
    const response = await apiClient.get('/users/');
    if (response.data && Array.isArray(response.data.results)) {
        return response.data.results;
    }
    return response.data;
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
