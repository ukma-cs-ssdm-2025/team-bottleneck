import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
    Typography, Container, Button, CircularProgress, Alert,
    Box, Card, CardContent, Grid,
} from '@mui/material';
import { createBooking } from '../api/parkingAPI';
import { useAuth } from '../context/AuthContext';

const calculateTotal = (startTime, endTime, pricePerHour) => {
    const start = new Date(startTime);
    const end = new Date(endTime);
    const durationMs = end - start;

    if (durationMs <= 0) {
        return "0.00";
    }

    const durationHours = durationMs / (1000 * 60 * 60);
    const total = durationHours * pricePerHour;

    return total.toFixed(2);
};

function BookingCreatePage() {
    const location = useLocation();
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();

    const { spotId, spotNumber, lotName, startTime, endTime, price: pricePerHour = 50, lotId } = location.state || {};

    const [loading, setLoading] = useState(false);
    const [bookingSuccess, setBookingSuccess] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!spotId || !startTime || !endTime) {
            setError('Помилка: Недостатньо даних для бронювання. Поверніться до вибору місця.');
        }
        if (!isAuthenticated) {
            navigate('/me', { state: { from: location.pathname } });
        }
    }, [spotId, startTime, endTime, isAuthenticated, navigate, location.pathname]);

    const totalCost = calculateTotal(startTime, endTime, pricePerHour);

    const handleConfirmBooking = async () => {
        setError(null);
        setLoading(true);

        const bookingData = {
            spot: spotId,
            start_at: startTime,
            end_at: endTime,
        };

        try {
            const response = await createBooking(bookingData);

            setBookingSuccess(response.id);

        } catch (err) {
            console.error('Booking creation error:', err.response || err);

            if (err.response && err.response.status === 409) {
                setError('Це місце вже заброньовано на обраний час. Оберіть інше місце або інший час.');
            } else if (err.response && err.response.status === 400) {
                const detail = err.response?.data?.detail || 'Некоректні дані бронювання.';
                setError(`Помилка: ${detail}. Перевірте обраний час бронювання.`);
            } else if (err.response && err.response.status === 401) {
                setError('Ваша сесія закінчилася. Увійдіть до системи знову.');
            } else if (err.response && err.response.status === 500) {
                setError('Сервер тимчасово недоступний. Спробуйте створити бронювання пізніше.');
            } else if (err.request) {
                setError('Не вдалося з\'єднатися з сервером. Перевірте ваше інтернет-з\'єднання.');
            } else {
                setError('Не вдалося створити бронювання. Спробуйте ще раз або оберіть інше місце.');
            }
        } finally {
            setLoading(false);
        }
    };

    if (!spotId || !startTime || !endTime) {
        return (
            <Container sx={{ mt: 4 }}>
                <Alert severity="error">{error || 'Недостатньо даних для бронювання.'}</Alert>
                <Button onClick={() => navigate(`/lots/${lotId}`)} sx={{ mt: 2 }} variant="outlined">
                    Повернутися до вибору часу
                </Button>
            </Container>
        );
    }

    if (bookingSuccess) {
        return (
            <Container sx={{ mt: 5, textAlign: 'center' }}>
                <Alert severity="success" variant="filled" sx={{ mb: 3 }}>
                    🎉 Бронювання #{bookingSuccess} успішно створено!
                </Alert>
                <Typography variant="h5" gutterBottom>
                    Дякуємо за використання "Розумної Парковки"!
                </Typography>
                <Button
                    variant="contained"
                    color="primary"
                    onClick={() => navigate('/profile')}
                    sx={{ mr: 2 }}
                >
                    Переглянути мої бронювання
                </Button>
                <Button
                    variant="outlined"
                    onClick={() => navigate('/')}
                >
                    На головну
                </Button>
            </Container>
        );
    }

    return (
        <Container sx={{ mt: 4, maxWidth: 600 }}>
            <Typography variant="h4" gutterBottom>
                Підтвердження Бронювання
            </Typography>

            {error && <Alert severity="error" sx={{ mb: 2 }}>{Array.isArray(error) ? error.join(', ') : error}</Alert>}

            <Card variant="outlined" sx={{ p: 3, mb: 3 }}>
                <CardContent>
                    <Typography variant="h6" gutterBottom>
                        Деталі бронювання
                    </Typography>
                    <Grid container spacing={1}>
                        <Grid item xs={12}><Typography><strong>Лот:</strong> {lotName}</Typography></Grid>
                        <Grid item xs={12}><Typography><strong>Місце:</strong> #{spotNumber} (ID: {spotId})</Typography></Grid>
                        <Grid item xs={12}><Typography><strong>Початок:</strong> {new Date(startTime).toLocaleString()}</Typography></Grid>
                        <Grid item xs={12}><Typography><strong>Кінець:</strong> {new Date(endTime).toLocaleString()}</Typography></Grid>
                    </Grid>

                    <Box sx={{ mt: 3, p: 2, borderTop: '2px solid #ccc', display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="h5">
                            Загальна вартість:
                        </Typography>
                        <Typography variant="h5" color="success.main" sx={{ fontWeight: 'bold' }}>
                            {totalCost} UAH
                        </Typography>
                    </Box>
                </CardContent>
            </Card>

            <Button
                variant="contained"
                color="success"
                fullWidth
                size="large"
                onClick={handleConfirmBooking}
                disabled={loading || !!error}
                startIcon={loading && <CircularProgress size={20} color="inherit" />}
            >
                {loading ? 'Обробка платежу...' : `Підтвердити та оплатити ${totalCost} UAH`}
            </Button>

            <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 2, textAlign: 'center' }}>
                Натискаючи кнопку, ви погоджуєтеся з умовами та створюєте бронювання.
            </Typography>

        </Container>
    );
}

export default BookingCreatePage;