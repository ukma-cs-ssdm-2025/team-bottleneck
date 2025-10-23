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
    // Instead of POST to /auth/token/, we directly test access to the protected endpoint
    const response = await apiClient.get('/users/me/', {
      // Use 'Authorization' header for Basic Auth
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
