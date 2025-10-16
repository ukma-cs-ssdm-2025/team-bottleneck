import React from 'react';
import { ThemeProvider, CssBaseline } from '@mui/material';
import theme from './styles/theme';
import AppRouter from './routes/AppRouter';

function App() {
    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <AppRouter />
        </ThemeProvider>
    );
}
export default App;