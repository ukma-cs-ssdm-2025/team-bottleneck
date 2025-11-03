import React from 'react';
import { ThemeProvider, CssBaseline } from '@mui/material';
import theme from './styles/theme';
import AppRouter from './routes/AppRouter';



import { AuthProvider } from './context/AuthContext'; 


function App() {
  return (
  
    <ThemeProvider theme={theme}>
      <CssBaseline />
      
     
      <AuthProvider>
        <AppRouter />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;