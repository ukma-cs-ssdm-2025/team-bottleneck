import apiClient from './apiClient';

export const fetchLotBookings = async (lotId = null) => {
    const params = lotId ? { lot_id: lotId } : {};
    const response = await apiClient.get('/bookings/my-lot-bookings/', { params });
    return response.data.results || response.data;
};

export const cancelBookingByOperator = async (bookingId, reason) => {
    const response = await apiClient.post(`/bookings/${bookingId}/cancel-operator/`, {
        reason: reason,
    });
    return response.data;
};

export async function fetchLotDetails(lotId) {
    const response = await apiClient.get(`/lots/${lotId}/`);
    return response.data;
}

export async function deleteSpot(lotId, spotId) {
    const response = await apiClient.delete(`/lots/${lotId}/spots/${spotId}/`);
    return response.status;
}

export async function fetchSpotDetails(lotId, spotId) {
    const response = await apiClient.get(`/lots/${lotId}/spots/${spotId}/`);
    return response.data;
}

export async function updateSpot(lotId, spotId, data) {
    const response = await apiClient.patch(`/lots/${lotId}/spots/${spotId}/operator-update/`, data);
    return response.data;
}

export async function createSpot(lotId, spotData) {
    const response = await apiClient.post(`/lots/${lotId}/spots/create/`, spotData);
    return response.data;
}