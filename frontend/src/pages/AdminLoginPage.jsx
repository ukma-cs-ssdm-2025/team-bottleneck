import React, { useState } from 'react';
import {
    Container, Box, Typography, TextField, Button,
    Alert, CircularProgress, Paper
} from '@mui/material';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { loginUser } from '../api/parkingAPI';

function AdminLoginPage() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);

    const { login, logout } = useAuth(); 
    const navigate = useNavigate();

    const renderErrorMessage = (err) => {
        if (err.response && err.response.status === 401) {
            return 'Невірне ім\'я користувача або пароль.';
        }
        if (err.response && err.response.data && err.response.data.detail) {
            return err.response.data.detail;
        }
        return 'Виникла невідома помилка під час входу. Перевірте мережу та облікові дані.';
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            const userData = await loginUser({ username, password });
            
            
            if (userData.is_staff) {
                
                login(username, password, userData);
                navigate('/admin', { replace: true });
                
            } else {
                
                logout(); 
                setError('Цей обліковий запис не має прав адміністратора. Спробуйте увійти як звичайний користувач.');
            }
            
        } catch (err) {
            setError(renderErrorMessage(err));
            console.error('Login failed with error:', err.response || err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container component="main" maxWidth="xs">
            <Paper elevation={3} sx={{ mt: 8, p: 4, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <Typography component="h1" variant="h5" sx={{ mb: 3 }}>
                    Вхід для Адміністратора 
                </Typography>
                {error && <Alert severity="error" sx={{ width: '100%', mb: 2 }}>{error}</Alert>}
                <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1 }}>
                    <TextField
                        margin="normal"
                        required
                        fullWidth
                        id="username"
                        label="Ім'я користувача (Адміна)"
                        name="username"
                        autoComplete="username"
                        autoFocus
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        disabled={loading}
                    />
                    <TextField
                        margin="normal"
                        required
                        fullWidth
                        name="password"
                        label="Пароль"
                        type="password"
                        id="password"
                        autoComplete="current-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={loading}
                    />
                    <Button
                        type="submit"
                        fullWidth
                        variant="contained"
                        sx={{ mt: 3, mb: 2, py: 1.5 }}
                        disabled={loading}
                    >
                        {loading ? <CircularProgress size={24} color="inherit" /> : 'УВІЙТИ ЯК АДМІН'}
                    </Button>
                    <Box sx={{ textAlign: 'center', mt: 2 }}>
                        <Link to="/user/login" style={{ textDecoration: 'none' }}>
                            <Button variant="text" size="small">Вхід для звичайних користувачів</Button>
                        </Link>
                    </Box>
                </Box>
            </Paper>
        </Container>
    );
}

export default AdminLoginPage; 