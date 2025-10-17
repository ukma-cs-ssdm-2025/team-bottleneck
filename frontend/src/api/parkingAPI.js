import axios from 'axios';
import { API_BASE_URL } from '../constants/apiConfig';

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