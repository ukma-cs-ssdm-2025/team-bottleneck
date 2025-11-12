import React, { useState } from 'react';
import {
    Container, Box, Typography, TextField, Button,
    Alert, CircularProgress, Paper
} from '@mui/material';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getTokensAndProfile } from '../api/parkingAPI'; 

function SingleLoginPage() { 
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);

    const { login } = useAuth();
    const navigate = useNavigate();

    const renderErrorMessage = (err) => {
        if (err.response?.status === 401) {
            if (err.response.data?.detail === "No active account found with the given credentials") {
                return 'Невірне ім\'я користувача або пароль.';
            }
        }
        if (err.response?.data?.detail) {
            return err.response.data.detail;
        }
        return 'Виникла невідома помилка під час входу. Перевірте мережу та облікові дані.';
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            const { tokens, userData } = await getTokensAndProfile({ username, password }); 
            
            login(tokens, userData);
            
            if (userData.is_staff) {
                navigate('/admin', { replace: true });
                
            } else if (userData.operator_profile && userData.operator_profile.lot_id) {
                navigate('/operator', { replace: true });

            } else {
                navigate('/profile', { replace: true }); 
            }
            
        } catch (err) {
            setError(renderErrorMessage(err));
            console.error('Login failed with error:', err.response?.data || err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container component="main" maxWidth="xs">
            <Paper elevation={3} sx={{ mt: 8, p: 4, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <Typography component="h1" variant="h5" sx={{ mb: 3 }}>
                    УВІЙТИ
                </Typography>
                {error && <Alert severity="error" sx={{ width: '100%', mb: 2 }}>{error}</Alert>}
                <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1 }}>
                    <TextField
                        margin="normal"
                        required
                        fullWidth
                        id="username"
                        label="Ім'я користувача"
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
                        {loading ? <CircularProgress size={24} color="inherit" /> : 'УВІЙТИ'}
                    </Button>
                    <Box sx={{ textAlign: 'center', mt: 2 }}>
                        <Typography variant="body2" sx={{ mt: 1 }}>
                            Немає облікового запису? <Link to="/register">Зареєструватися</Link>
                        </Typography>
                    </Box>
                </Box>
            </Paper>
        </Container>
    );
}

export default SingleLoginPage;