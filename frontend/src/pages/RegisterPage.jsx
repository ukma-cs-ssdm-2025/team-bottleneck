import React, { useState } from 'react';
import { Container, Box, Typography, TextField, Button, Paper, CircularProgress } from '@mui/material';
import { Link, useNavigate } from 'react-router-dom';
import { registerUser } from '../api/parkingAPI';
import ErrorPopup from '../components/common/ErrorPopup';

const RegisterPage = () => {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const [errorPopup, setErrorPopup] = useState({ open: false, message: '', severity: 'error' });

    const [formData, setFormData] = useState({
        email: '',
        username: '',
        password: '',
        password2: '',
    });

    const [validationErrors, setValidationErrors] = useState({});

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));

        // Clear validation error for this field
        if (validationErrors[name]) {
            setValidationErrors(prev => ({ ...prev, [name]: '' }));
        }

        // Clear general error popup
        if (errorPopup.open) {
            setErrorPopup({ open: false, message: '', severity: 'error' });
        }
    };

    const validateForm = () => {
        const errors = {};

        // Email validation
        if (!formData.email.trim()) {
            errors.email = 'Email обов\'язковий';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            errors.email = 'Невірний формат email';
        }

        // Username validation
        if (!formData.username.trim()) {
            errors.username = 'Ім\'я користувача обов\'язкове';
        } else if (formData.username.length < 3) {
            errors.username = 'Ім\'я користувача має містити мінімум 3 символи';
        } else if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
            errors.username = 'Ім\'я користувача може містити тільки літери, цифри та підкреслення';
        }

        // Password validation
        if (!formData.password) {
            errors.password = 'Пароль обов\'язковий';
        } else if (formData.password.length < 8) {
            errors.password = 'Пароль має містити мінімум 8 символів';
        }

        // Password confirmation
        if (!formData.password2) {
            errors.password2 = 'Підтвердження пароля обов\'язкове';
        } else if (formData.password !== formData.password2) {
            errors.password2 = 'Паролі не співпадають';
        }

        return errors;
    };

    const parseServerErrors = (serverErrors) => {
        const newValidationErrors = {};
        let errorMessage = 'Виникла помилка під час реєстрації.';

        if (typeof serverErrors === 'string') {
            return { errorMessage: serverErrors, validationErrors: {} };
        }

        if (typeof serverErrors === 'object') {
            // Handle field-specific errors
            Object.keys(serverErrors).forEach(key => {
                const errorValue = serverErrors[key];

                if (Array.isArray(errorValue) && errorValue.length > 0) {
                    // Django typically returns errors as arrays
                    const firstError = errorValue[0];

                    if (key === 'username') {
                        if (typeof firstError === 'string' && firstError.includes('already exists')) {
                            newValidationErrors[key] = 'Користувач з таким ім\'ям вже існує';
                        } else {
                            newValidationErrors[key] = firstError;
                        }
                    } else if (key === 'email') {
                        if (typeof firstError === 'string' && firstError.includes('already exists')) {
                            newValidationErrors[key] = 'Користувач з таким email вже існує';
                        } else {
                            newValidationErrors[key] = firstError;
                        }
                    } else if (key === 'password') {
                        newValidationErrors[key] = firstError;
                    } else if (key === 'non_field_errors') {
                        errorMessage = firstError;
                    } else {
                        newValidationErrors[key] = firstError;
                    }
                } else if (typeof errorValue === 'string') {
                    newValidationErrors[key] = errorValue;
                }
            });

            // Use first validation error as main message if available
            if (Object.keys(newValidationErrors).length > 0) {
                errorMessage = Object.values(newValidationErrors)[0];
            }

            // Check for detail field
            if (serverErrors.detail) {
                errorMessage = serverErrors.detail;
            }
        }

        return { errorMessage, validationErrors: newValidationErrors };
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Client-side validation
        const errors = validateForm();
        if (Object.keys(errors).length > 0) {
            setValidationErrors(errors);
            const firstError = Object.values(errors)[0];
            setErrorPopup({ open: true, message: firstError, severity: 'error' });
            return;
        }

        setIsLoading(true);
        setErrorPopup({ open: false, message: '', severity: 'error' });
        setValidationErrors({});

        try {
            await registerUser(formData);

            // Success!
            setErrorPopup({
                open: true,
                message: 'Реєстрація успішна! Перенаправлення на сторінку входу...',
                severity: 'success'
            });

            setTimeout(() => {
                navigate('/login');
            }, 2000);
        } catch (err) {
            console.error('Registration error:', err);

            let errorMessage = 'Виникла невідома помилка під час реєстрації. Спробуйте ще раз.';
            let newValidationErrors = {};

            // Network error
            if (!err.response) {
                if (err.request) {
                    errorMessage = 'Не вдалося з\'єднатися з сервером. Перевірте ваше інтернет-з\'єднання.';
                }
            } else {
                // Server responded with error
                const status = err.response.status;
                const data = err.response.data;

                if (status === 400) {
                    // Validation errors
                    const parsed = parseServerErrors(data);
                    errorMessage = parsed.errorMessage;
                    newValidationErrors = parsed.validationErrors;
                } else if (status === 500) {
                    errorMessage = 'Помилка сервера. Спробуйте пізніше.';
                } else if (status === 503) {
                    errorMessage = 'Сервер тимчасово недоступний. Спробуйте пізніше.';
                } else if (data?.detail) {
                    errorMessage = data.detail;
                }
            }

            setValidationErrors(newValidationErrors);
            setErrorPopup({ open: true, message: errorMessage, severity: 'error' });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Box sx={{ minHeight: 'calc(100vh - 64px)', display: 'flex', alignItems: 'center', background: '#F4F6F8', py: 4 }}>
            <ErrorPopup
                open={errorPopup.open}
                onClose={() => setErrorPopup({ open: false, message: '', severity: 'error' })}
                message={errorPopup.message}
                severity={errorPopup.severity}
            />

            <Container component="main" maxWidth="sm">
                <Paper elevation={0} sx={{ p: 5, borderRadius: '16px', background: '#FFFFFF', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)' }}>
                    <Box sx={{ textAlign: 'center', mb: 4 }}>
                        <img src="/logo.png" alt="SmartParking Logo" style={{ height: '60px', width: 'auto', marginBottom: '16px' }} />
                        <Typography variant="h4" sx={{ fontWeight: 700, color: '#111827', mb: 1 }}>
                            Створити обліковий запис
                        </Typography>
                        <Typography variant="body1" sx={{ color: '#6B7280' }}>
                            Приєднуйтесь до SmartParking
                        </Typography>
                    </Box>

                    <Box component="form" onSubmit={handleSubmit}>
                        <TextField
                            label="Email"
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            required
                            fullWidth
                            margin="normal"
                            error={!!validationErrors?.email}
                            helperText={validationErrors?.email}
                            disabled={isLoading}
                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
                        />

                        <TextField
                            label="Ім'я користувача"
                            type="text"
                            name="username"
                            value={formData.username}
                            onChange={handleChange}
                            required
                            fullWidth
                            margin="normal"
                            error={!!validationErrors?.username}
                            helperText={validationErrors?.username}
                            disabled={isLoading}
                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
                        />

                        <TextField
                            label="Пароль"
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            required
                            fullWidth
                            margin="normal"
                            error={!!validationErrors?.password}
                            helperText={validationErrors?.password}
                            disabled={isLoading}
                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
                        />

                        <TextField
                            label="Повторіть пароль"
                            type="password"
                            name="password2"
                            value={formData.password2}
                            onChange={handleChange}
                            required
                            fullWidth
                            margin="normal"
                            error={!!validationErrors?.password2}
                            helperText={validationErrors?.password2}
                            disabled={isLoading}
                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
                        />

                        <Button
                            type="submit"
                            fullWidth
                            variant="contained"
                            disabled={isLoading}
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
                            {isLoading ? <CircularProgress size={24} sx={{ color: '#FFFFFF' }} /> : 'Зареєструватися'}
                        </Button>

                        <Box sx={{ textAlign: 'center', mt: 3 }}>
                            <Typography variant="body2" sx={{ color: '#6B7280' }}>
                                Вже маєте обліковий запис?{' '}
                                <Link to="/login" style={{ color: '#10B981', textDecoration: 'none', fontWeight: 600 }}>
                                    Увійти
                                </Link>
                            </Typography>
                        </Box>
                    </Box>
                </Paper>
            </Container>
        </Box>
    );
};

export default RegisterPage;