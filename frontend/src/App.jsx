

import React from 'react';
import { ThemeProvider, CssBaseline } from '@mui/material';
import theme from './styles/theme';
import AppRouter from './routes/AppRouter';


// 1. Import AuthProvider from your context file
import { AuthProvider } from './context/AuthContext'; 


function App() {
  return (
    // 2. Wrap the application with ThemeProvider (for MUI styling)
    <ThemeProvider theme={theme}>
      <CssBaseline />
      
      {/* 3. Wrap the application with AuthProvider (for global authentication state) */}
      <AuthProvider>
        <AppRouter />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;