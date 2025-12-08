import React, { useState } from 'react';
import {
    Container, Box, Typography, TextField, Button,
    CircularProgress, Paper
} from '@mui/material';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getTokensAndProfile } from '../api/parkingAPI';
import ErrorPopup from '../components/common/ErrorPopup';

function SingleLoginPage() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [errorPopup, setErrorPopup] = useState({ open: false, message: '' });
    const [loading, setLoading] = useState(false);

    const { login } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    // Get the page user was trying to access before login
    const from = location.state?.from?.pathname || '/';

    const renderErrorMessage = (err) => {
        console.error('Login error details:', err);

        // Network errors
        if (!err.response) {
            if (err.request) {
                return 'Не вдалося з\'єднатися з сервером. Перевірте ваше інтернет-з\'єднання.';
            }
            return 'Виникла невідома помилка. Спробуйте ще раз.';
        }

        // HTTP errors
        const status = err.response.status;
        const data = err.response.data;

        if (status === 401) {
            if (data?.detail) {
                if (data.detail === "No active account found with the given credentials") {
                    return 'Невірне ім\'я користувача або пароль.';
                }
                return data.detail;
            }
            return 'Невірні дані для входу. Перевірте ім\'я користувача та пароль.';
        }

        if (status === 400) {
            if (data?.username) {
                return `Помилка: ${data.username[0]}`;
            }
            if (data?.password) {
                return `Помилка: ${data.password[0]}`;
            }
            if (data?.detail) {
                return data.detail;
            }
            return 'Невірні дані. Перевірте введену інформацію.';
        }

        if (status === 500) {
            return 'Помилка сервера. Спробуйте пізніше.';
        }

        if (status === 503) {
            return 'Сервер тимчасово недоступний. Спробуйте пізніше.';
        }

        // Generic error
        if (data?.detail) {
            return data.detail;
        }

        return `Помилка входу (код ${status}). Спробуйте ще раз.`;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Client-side validation
        if (!username.trim()) {
            setErrorPopup({ open: true, message: 'Введіть ім\'я користувача.' });
            return;
        }

        if (!password) {
            setErrorPopup({ open: true, message: 'Введіть пароль.' });
            return;
        }

        setLoading(true);
        setErrorPopup({ open: false, message: '' });

        try {
            const { tokens, userData } = await getTokensAndProfile({ username, password });
            login(tokens, userData);

            // Redirect admin users to admin dashboard
            if (userData.is_staff) {
                navigate('/admin', { replace: true });
            } else {
                // Redirect to the page user was trying to access, or home
                navigate(from, { replace: true });
            }
        } catch (err) {
            const errorMessage = renderErrorMessage(err);
            setErrorPopup({ open: true, message: errorMessage });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box sx={{ minHeight: 'calc(100vh - 64px)', display: 'flex', alignItems: 'center', background: '#F4F6F8', py: { xs: 2, sm: 3, md: 4 }, px: { xs: 2, sm: 0 } }}>
            <ErrorPopup
                open={errorPopup.open}
                onClose={() => setErrorPopup({ open: false, message: '' })}
                message={errorPopup.message}
                severity="error"
            />

            <Container component="main" maxWidth="sm">
                <Paper elevation={0} sx={{ p: { xs: 3, sm: 4, md: 5 }, borderRadius: '16px', background: '#FFFFFF', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)' }}>
                    <Box sx={{ textAlign: 'center', mb: { xs: 3, sm: 4 } }}>
                        <img src="/logo.png" alt="SmartParking Logo" style={{ height: '60px', width: 'auto', marginBottom: '16px' }} />
                        <Typography variant="h4" sx={{ fontWeight: 700, color: '#111827', mb: 1, fontSize: { xs: '1.5rem', sm: '2rem' } }}>
                            Вітаємо знову
                        </Typography>
                        <Typography variant="body1" sx={{ color: '#6B7280', fontSize: { xs: '0.95rem', sm: '1rem' } }}>
                            Увійдіть до свого облікового запису
                        </Typography>
                    </Box>

                    <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3 }}>
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
                            error={errorPopup.open && !username.trim()}
                            sx={{ mb: 2, '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
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
                            error={errorPopup.open && !password}
                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
                        />

                        <Button
                            type="submit"
                            fullWidth
                            variant="contained"
                            disabled={loading}
                            sx={{
                                mt: 4,
                                mb: 2,
                                py: 1.5,
                                background: 'linear-gradient(135deg, #34D399 0%, #059669 100%)',
                                color: '#FFFFFF',
                                fontWeight: 600,
                                fontSize: '1.125rem',
                                borderRadius: '12px',
                                textTransform: 'none',
                                '&:hover': {
                                    background: 'linear-gradient(135deg, #34D399 0%, #059669 100%)',
                                },
                                '&:disabled': {
                                    background: '#9CA3AF',
                                    color: '#FFFFFF',
                                }
                            }}
                        >
                            {loading ? <CircularProgress size={24} sx={{ color: '#FFFFFF' }} /> : 'Увійти'}
                        </Button>

                        <Box sx={{ textAlign: 'center', mt: 3 }}>
                            <Typography variant="body2" sx={{ color: '#6B7280' }}>
                                Немає облікового запису?{' '}
                                <Link to="/register" style={{ color: '#10B981', textDecoration: 'none', fontWeight: 600 }}>
                                    Зареєструватися
                                </Link>
                            </Typography>
                        </Box>
                    </Box>
                </Paper>
            </Container>
        </Box>
    );
}

export default SingleLoginPage;