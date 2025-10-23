import axios from 'axios';
import { API_BASE_URL } from '../constants/apiConfig';
import apiClient from './apiClient';

/**
 * Асинхронна функція для отримання списку всіх паркінгів з API.
 * @returns {Promise<Array>} Повертає масив об'єктів паркінгів.
 * @throws {Error} Викидає помилку, якщо запит не вдався.
 */
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
        // GET /api/v1/lots/{id}/
        const response = await axios.get(`${API_BASE_URL}/lots/${lotId}/`);
        return response.data;
    } catch (error) {
        console.error(`Error fetching details for lot ${lotId}:`, error);
        throw error;
    }
}
//  Отримання доступних місць
export async function fetchAvailableSpots(lotId, start, end) {
    try {
        // GET /api/v1/lots/{lotId}/spots?available_from=...&available_to=...
        const response = await axios.get(`${API_BASE_URL}/lots/${lotId}/spots`, {
            params: {
                available_from: start,
                available_to: end,
                // Тут можна додати фільтри is_ev, is_disabled
            }
        });
        return response.data;
    } catch (error) {
        console.error("Error fetching available spots:", error);
        throw error;
    }
}

/**
 * Asynchronously registers a new user by sending data to the backend.
 * Corresponds to: UserViewSet.register
 * @param {object} userData - User data object: { username, email, password }.
 * @returns {Promise<object>} Returns the created user object upon success (status 201).
 * @throws {Error} Throws an error if registration fails (e.g., 400 Bad Request/validation error).
 */
export const registerUser = async (userData) => {
  try {
    // Use apiClient instead of axios
    const response = await apiClient.post('/users/register/', userData);
    // Note: /users/register/ is a relative path to API_BASE_URL

    return response.data;
  } catch (error) {
    console.error('User registration error:', error);
    // Throw the error to be handled by the RegisterPage component (FR-004)
    throw error;
  }
};

/**
 * Asynchronously handles user login using Basic Authentication.
 * Corresponds to: GET /api/v1/users/me/
 * @param {object} credentials - User credentials: { username, password }.
 * @returns {Promise<object>} Returns the authenticated user object upon success (status 200).
 * @throws {Error} Throws an error if login fails (e.g., 401 Unauthorized).
 */
export const loginUser = async (credentials) => {
  try {
    const response = await apiClient.get('/users/me/', {
      headers: {
        Authorization: `Basic ${btoa(
          `${credentials.username}:${credentials.password}`
        )}`,
      },
    });

    // A successful response means credentials are valid
    return response.data; // Returns the user object
  } catch (error) {
    console.error('User login error (Basic Auth failed):', error);
    throw error;
  }
};

/**
 * Asynchronously updates the authenticated user's profile (first_name, last_name).
 * Corresponds to: PATCH /api/v1/users/me/
 * @param {object} profileData - Partial user data: { first_name, last_name }.
 * @returns {Promise<object>} Returns the updated user object.
 * @throws {Error} Throws an error if update fails (e.g., 401 Unauthorized, 400 Bad Request).
 */
export const updateProfile = async (profileData) => {
    try {
        // PATCH request to /users/me/ to update fields
        const response = await apiClient.patch('/users/me/', profileData);
        return response.data;
    } catch (error) {
        console.error('User profile update error:', error);
        throw error;
    }
};

/**
 * Asynchronously fetches the authenticated user's bookings.
 * Corresponds to: GET /api/v1/bookings/
 * @returns {Promise<Array>} Returns an array of booking objects.
 * @throws {Error} Throws an error if fetching fails (e.g., 401 Unauthorized).
 */
export const fetchUserBookings = async () => {
    try {
        // GET request to /bookings/ which returns current user's bookings
        const response = await apiClient.get('/bookings/');
        return response.data.results || response.data;
    } catch (error) {
        console.error('Error fetching user bookings:', error);
        throw error;
    }
};

/**
 * Asynchronously cancels a specific user booking.
 * Corresponds to: POST /api/v1/bookings/{id}/cancel/
 * @param {number} bookingId - ID of the booking to cancel.
 * @param {string} [reason='Client cancellation'] - Optional cancellation reason.
 * @returns {Promise<object>} Returns the updated (cancelled) booking object.
 * @throws {Error} Throws an error if cancellation fails (e.g., 401, 404, 400).
 */
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

/**
 * Asynchronously creates a new parking spot booking.
 * Corresponds to: POST /api/v1/bookings/create/
 * @param {object} bookingData - Booking data: { spot: number, start_at: string (ISO 8601), end_at: string (ISO 8601) }.
 * @returns {Promise<object>} Returns the created booking object with payment details.
 * @throws {Error} Throws an error if creation fails (e.g., 401, 409 Conflict).
 */
export const createBooking = async (bookingData) => {
    try {
        // POST request to /bookings/create/ (requires Basic Auth via interceptor)
        const response = await apiClient.post('/bookings/create/', bookingData);
        return response.data;
    } catch (error) {
        console.error('Error creating booking:', error);
        throw error;
    }
};