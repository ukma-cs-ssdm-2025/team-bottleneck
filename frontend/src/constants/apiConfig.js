const isDevelopment = process.env.NODE_ENV === 'development';
const LOCAL_API_URL = "http://127.0.0.1:8000/api/v1";
const PRODUCTION_API_URL = "/api/v1";
export const API_BASE_URL = isDevelopment ? LOCAL_API_URL : PRODUCTION_API_URL;