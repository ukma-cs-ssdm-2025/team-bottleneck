import apiClient from './apiClient';

export const fetchLotBookings = async () => {
    try {
        const response = await apiClient.get('/bookings/my-lot-bookings/');
        return response.data.results || response.data;
    } catch (error) {
        throw error;
    }
};

export const cancelBookingByOperator = async (bookingId, reason) => {
    try {
        const response = await apiClient.post(`/bookings/${bookingId}/cancel-operator/`, {
            reason: reason,
        });
        return response.data;
    } catch (error) {
        throw error;
    }
};

export async function fetchLotDetails(lotId) {
    try {
        const response = await apiClient.get(`/lots/${lotId}/`);
        return response.data;
    } catch (error) {
        throw error;
    }
}

export async function deleteSpot(lotId, spotId) {
    try {
        const response = await apiClient.delete(`/lots/${lotId}/spots/${spotId}/`);
        return response.status;
    } catch (error) {
        throw error;
    }
}

export async function fetchSpotDetails(lotId, spotId) {
    try {
        const response = await apiClient.get(`/lots/${lotId}/spots/${spotId}/`);
        return response.data;
    } catch (error) {
        throw error;
    }
}

export async function updateSpot(lotId, spotId, data) {
    try {
        const response = await apiClient.patch(`/lots/${lotId}/spots/${spotId}/operator-update/`, data);
        return response.data;
    } catch (error) {
        throw error;
    }
}

export async function createSpot(lotId, spotData) {
    try {
        const response = await apiClient.post(`/lots/${lotId}/spots/create/`, spotData);
        return response.data;
    } catch (error) {
        throw error;
    }
}