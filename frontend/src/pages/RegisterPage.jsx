
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom'; // Added Link for navigation
import { registerUser } from '../api/parkingAPI'; 
import { Button, TextField, Typography, Box, Alert } from '@mui/material'; // Assuming MUI is used for better styling

const RegisterPage = () => {
    const [formData, setFormData] = useState({
        email: '',
        username: '',
        password: '',
        password2: '',
    });
    // error can now be an object to store field-specific validation errors
    const [error, setError] = useState(null); 
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        if (formData.password !== formData.password2) {
            setError({ non_field_errors: ['Паролі не співпадають! Будь ласка, переконайтеся, що обидва паролі однакові.'] });
            setIsLoading(false);
            return;
        }

        if (formData.password.length < 8) {
            setError({ non_field_errors: ['Пароль має містити принаймні 8 символів.'] });
            setIsLoading(false);
            return;
        }

        try {
            const { password2, ...dataToSend } = formData;

            await registerUser(dataToSend);

            alert('Реєстрація успішна! Тепер ви можете увійти до системи.');
            navigate('/user/login');
        } catch (err) {
            if (err.response && err.response.data) {
                if (err.response.status === 400) {
                    const errors = err.response.data;
                    const friendlyErrors = {};

                    if (errors.username) {
                        friendlyErrors.username = ['Це ім\'я користувача вже зайняте. Оберіть інше.'];
                    }
                    if (errors.email) {
                        friendlyErrors.email = ['Ця електронна адреса вже використовується. Спробуйте іншу або увійдіть до існуючого акаунту.'];
                    }
                    if (errors.password) {
                        friendlyErrors.password = ['Пароль занадто простий або не відповідає вимогам. Використайте комбінацію літер, цифр та спеціальних символів.'];
                    }
                    if (errors.non_field_errors) {
                        friendlyErrors.non_field_errors = errors.non_field_errors;
                    }

                    if (Object.keys(friendlyErrors).length === 0) {
                        friendlyErrors.non_field_errors = ['Помилка при реєстрації. Перевірте правильність введених даних.'];
                    }

                    setError(friendlyErrors);
                } else if (err.response.status === 500) {
                    setError({ non_field_errors: ['Сервер тимчасово недоступний. Спробуйте пізніше або зв\'яжіться з підтримкою.'] });
                } else {
                    const genericError = err.response.data.detail || 'Виникла помилка на сервері. Спробуйте пізніше.';
                    setError({ non_field_errors: [genericError] });
                }
            } else if (err.request) {
                setError({ non_field_errors: ['Не вдалося з\'єднатися з сервером. Перевірте ваше інтернет-з\'єднання.'] });
            } else {
                setError({ non_field_errors: ['Виникла невідома помилка. Спробуйте ще раз.'] });
            }
            console.error("Registration error details:", err.response?.data || err);
        } finally {
            setIsLoading(false);
        }
    };

    // Function to display field-specific error messages
    const renderError = (field) => {
        if (error && error[field]) {
            return (
                <Typography variant="caption" color="error" display="block" sx={{ mt: 0.5 }}>
                    {error[field].join(' ')}
                </Typography>
            );
        }
        return null;
    };
    
    // Function to display general (non-field) error messages
    const renderNonFieldErrors = () => {
        if (error && error.non_field_errors) {
            return (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error.non_field_errors.join(' ')}
                </Alert>
            );
        }
        return null;
    };


    return (
        <Box className="register-container" sx={{ maxWidth: 400, margin: '50px auto', p: 3, border: '1px solid #ddd', borderRadius: 1 }}>
            <Typography variant="h5" component="h2" gutterBottom>Створити обліковий запис</Typography>
            
            {renderNonFieldErrors()}
            
            <form onSubmit={handleSubmit}>
                <TextField 
                    label="Email" 
                    type="email" 
                    name="email" 
                    value={formData.email} 
                    onChange={handleChange} 
                    required 
                    fullWidth 
                    margin="normal" 
                    error={!!error?.email}
                    helperText={renderError('email')}
                    disabled={isLoading}
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
                    error={!!error?.username}
                    helperText={renderError('username')}
                    disabled={isLoading}
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
                    error={!!error?.password}
                    helperText={renderError('password')}
                    disabled={isLoading}
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
                    disabled={isLoading}
                />
                
                <Button 
                    type="submit" 
                    variant="contained" 
                    color="primary" 
                    fullWidth 
                    sx={{ mt: 3 }}
                    disabled={isLoading}
                >
                    {isLoading ? 'Зачекайте...' : 'Зареєструватися'}
                </Button>
                
                <Typography variant="body2" align="center" sx={{ mt: 2 }}>
                    Вже маєте обліковий запис? <Link to="/login">Увійти</Link>
                </Typography>
            </form>
        </Box>
    );
};

export default RegisterPage;