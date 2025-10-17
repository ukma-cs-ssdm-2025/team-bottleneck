import { createTheme } from '@mui/material/styles';

// Створюємо нашу кастомну тему
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2', // Основний синій колір
    },
    secondary: {
      main: '#dc004e', // Додатковий рожевий
    },
    success: {
      main: '#4caf50', // Зелений для успішних дій та вільних місць
    },
    error: {
      main: '#f44336', // Червоний для помилок та зайнятих місць
    },
    background: {
      default: '#f4f6f8', // Світло-сірий фон для сторінок
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: '2.5rem',
      fontWeight: 500,
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 500,
    },
  },
});

export default theme;