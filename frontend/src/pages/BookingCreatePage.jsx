import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
    Typography, Container, Button, CircularProgress,
    Box, Card, CardContent, Grid, Divider, Chip, Skeleton
} from '@mui/material';
import { createBooking, fetchParkingLotDetails } from '../api/parkingAPI';
import apiClient from '../api/apiClient';
import { useAuth } from '../context/AuthContext';
import ErrorPopup from '../components/common/ErrorPopup';

function BookingCreatePage() {
    const location = useLocation();
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();

    const { spotId, spotNumber, lotId, startTime, endTime, isEv, isDisabled } = location.state || {};

    const [loading, setLoading] = useState(false);
    const [lotLoading, setLotLoading] = useState(true);
    const [priceLoading, setPriceLoading] = useState(true);
    const [lot, setLot] = useState(null);
    const [realPrice, setRealPrice] = useState(null);
    const [bookingSuccess, setBookingSuccess] = useState(null);
    const [errorPopup, setErrorPopup] = useState({ open: false, message: '', severity: 'error' });

    useEffect(() => {
        if (!isAuthenticated) {
            navigate('/login', { state: { from: location.pathname } });
            return;
        }

        if (!spotId || !startTime || !endTime || !lotId) {
            setErrorPopup({
                open: true,
                message: 'Недостатньо даних для бронювання. Поверніться до вибору місця.',
                severity: 'error'
            });
            setLotLoading(false);
            setPriceLoading(false);
            return;
        }

        // Load lot details
        const loadLot = async () => {
            try {
                const lotData = await fetchParkingLotDetails(lotId);
                setLot(lotData);
            } catch (err) {
                console.error('Error loading lot details:', err);
                setErrorPopup({
                    open: true,
                    message: 'Не вдалося завантажити інформацію про парковку.',
                    severity: 'error'
                });
            } finally {
                setLotLoading(false);
            }
        };

        // Get REAL price from backend
        const loadPrice = async () => {
            try {
                const response = await apiClient.post('/bookings/preview-price/', {
                    spot: spotId,
                    start_at: startTime,
                    end_at: endTime
                });

                setRealPrice(response.data.price);
            } catch (err) {
                console.error('Error calculating price:', err);

                let errorMessage = 'Не вдалося розрахувати ціну бронювання.';

                if (!err.response) {
                    errorMessage = 'Не вдалося з\'єднатися з сервером.';
                } else if (err.response.status === 404) {
                    errorMessage = 'Місце не знайдено.';
                } else if (err.response.status === 400) {
                    errorMessage = err.response.data?.detail || 'Некоректні дані для розрахунку ціни.';
                }

                setErrorPopup({
                    open: true,
                    message: errorMessage,
                    severity: 'error'
                });
            } finally {
                setPriceLoading(false);
            }
        };

        loadLot();
        loadPrice();
    }, [spotId, startTime, endTime, lotId, isAuthenticated, navigate, location.pathname]);

    const durationHours = Math.round((new Date(endTime) - new Date(startTime)) / (1000 * 60 * 60));

    const handleConfirmBooking = async () => {
        setLoading(true);
        setErrorPopup({ open: false, message: '', severity: 'error' });

        const bookingData = {
            spot: spotId,
            start_at: new Date(startTime).toISOString(),
            end_at: new Date(endTime).toISOString(),
        };

        try {
            const response = await createBooking(bookingData);
            setBookingSuccess(response.id);
            setErrorPopup({
                open: true,
                message: 'Бронювання успішно створено!',
                severity: 'success'
            });

            setTimeout(() => {
                navigate('/profile');
            }, 2000);
        } catch (err) {
            console.error('Booking creation error:', err);

            let errorMessage = 'Не вдалося створити бронювання.';

            if (!err.response) {
                errorMessage = 'Не вдалося з\'єднатися з сервером. Перевірте ваше інтернет-з\'єднання.';
            } else {
                const status = err.response.status;
                const data = err.response.data;

                if (status === 409) {
                    errorMessage = 'Це місце вже заброньовано на обраний час. Оберіть інше місце або інший час.';
                } else if (status === 400) {
                    errorMessage = data?.detail || 'Некоректні дані бронювання. Перевірте обраний час.';
                } else if (status === 401) {
                    errorMessage = 'Ваша сесія закінчилася. Будь ласка, увійдіть знову.';
                } else if (status === 500) {
                    errorMessage = 'Помилка сервера. Спробуйте пізніше.';
                } else if (data?.detail) {
                    errorMessage = data.detail;
                }
            }

            setErrorPopup({ open: true, message: errorMessage, severity: 'error' });
        } finally {
            setLoading(false);
        }
    };

    if (lotLoading || priceLoading) {
        return (
            <Box sx={{ background: '#F4F6F8', minHeight: '100vh', py: 4 }}>
                <Container maxWidth="md">
                    <Card sx={{ borderRadius: '16px', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)', mb: 3 }}>
                        <CardContent sx={{ p: 4 }}>
                            <Skeleton variant="text" width="60%" height={40} />
                            <Skeleton variant="text" width="40%" height={24} sx={{ mt: 1 }} />
                        </CardContent>
                    </Card>
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
                        <CircularProgress />
                    </Box>
                </Container>
            </Box>
        );
    }

    if (!spotId || !startTime || !endTime || !lot || !realPrice) {
        return (
            <Box sx={{ background: '#F4F6F8', minHeight: '100vh', py: 4 }}>
                <ErrorPopup
                    open={errorPopup.open}
                    onClose={() => setErrorPopup({ open: false, message: '', severity: 'error' })}
                    message={errorPopup.message}
                    severity={errorPopup.severity}
                />
                <Container maxWidth="md">
                    <Card sx={{ borderRadius: '16px', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)', p: 4, textAlign: 'center' }}>
                        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                            Недостатньо даних для створення бронювання
                        </Typography>
                        <Button
                            variant="contained"
                            onClick={() => navigate('/')}
                            sx={{
                                background: 'linear-gradient(135deg, #34D399 0%, #059669 100%)',
                                color: '#FFFFFF',
                                textTransform: 'none',
                                fontWeight: 600,
                            }}
                        >
                            Повернутися на головну
                        </Button>
                    </Card>
                </Container>
            </Box>
        );
    }

    return (
        <Box sx={{ background: '#F4F6F8', minHeight: '100vh', py: 4 }}>
            <ErrorPopup
                open={errorPopup.open}
                onClose={() => setErrorPopup({ open: false, message: '', severity: 'error' })}
                message={errorPopup.message}
                severity={errorPopup.severity}
            />

            <Container maxWidth="md">
                <Card sx={{ borderRadius: '16px', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)', mb: 3 }}>
                    <CardContent sx={{ p: 4 }}>
                        <Typography variant="h4" sx={{ fontWeight: 700, color: '#111827', mb: 1 }}>
                            Підтвердження бронювання
                        </Typography>
                        <Typography variant="body1" sx={{ color: '#6B7280' }}>
                            Перевірте деталі перед підтвердженням
                        </Typography>
                    </CardContent>
                </Card>

                <Grid container spacing={3}>
                    {/* Booking Details */}
                    <Grid item xs={12} md={7}>
                        <Card sx={{ borderRadius: '16px', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)' }}>
                            <CardContent sx={{ p: 3 }}>
                                <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                                    Деталі бронювання
                                </Typography>

                                <Box sx={{ mb: 3 }}>
                                    <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                                        Парковка
                                    </Typography>
                                    <Typography variant="body1" sx={{ fontWeight: 500, color: '#111827', mb: 0.5 }}>
                                        {lot.name}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        {lot.city}, {lot.street} {lot.building}
                                    </Typography>
                                </Box>

                                <Box sx={{ mb: 3 }}>
                                    <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                                        Місце
                                    </Typography>
                                    <Typography variant="h6" sx={{ fontWeight: 600, color: '#111827' }}>
                                        #{spotNumber}
                                    </Typography>
                                </Box>

                                {(isEv || isDisabled) && (
                                    <Box sx={{ mb: 3 }}>
                                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                            Особливості місця
                                        </Typography>
                                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                            {isEv && (
                                                <Chip
                                                    label="⚡ З зарядкою для електромобілів (+30%)"
                                                    sx={{
                                                        backgroundColor: '#FEF3C7',
                                                        color: '#F59E0B',
                                                        fontWeight: 600
                                                    }}
                                                />
                                            )}
                                            {isDisabled && (
                                                <Chip
                                                    label="♿ Для людей з обмеженими можливостями (-20%)"
                                                    sx={{
                                                        backgroundColor: '#DBEAFE',
                                                        color: '#3B82F6',
                                                        fontWeight: 600
                                                    }}
                                                />
                                            )}
                                        </Box>
                                    </Box>
                                )}

                                <Divider sx={{ my: 3 }} />

                                <Box sx={{ mb: 2 }}>
                                    <Typography variant="body2" color="text.secondary">
                                        Початок
                                    </Typography>
                                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                        {new Date(startTime).toLocaleString('uk-UA', {
                                            day: '2-digit',
                                            month: '2-digit',
                                            year: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                    </Typography>
                                </Box>

                                <Box>
                                    <Typography variant="body2" color="text.secondary">
                                        Кінець
                                    </Typography>
                                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                        {new Date(endTime).toLocaleString('uk-UA', {
                                            day: '2-digit',
                                            month: '2-digit',
                                            year: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                    </Typography>
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* Price Summary */}
                    <Grid item xs={12} md={5}>
                        <Card sx={{ borderRadius: '16px', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)', mb: 3 }}>
                            <CardContent sx={{ p: 3 }}>
                                <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                                    Підсумок
                                </Typography>

                                <Box sx={{ mb: 2 }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                        <Typography variant="body2" color="text.secondary">
                                            Тривалість
                                        </Typography>
                                        <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                            {durationHours} год
                                        </Typography>
                                    </Box>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                        <Typography variant="body2" color="text.secondary">
                                            Базова ціна за годину
                                        </Typography>
                                        <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                            {lot.base_price_per_hour} грн
                                        </Typography>
                                    </Box>
                                    {(isEv || isDisabled) && (
                                        <Box sx={{ mt: 2, p: 2, backgroundColor: '#F0FDF4', borderRadius: '8px' }}>
                                            <Typography variant="body2" sx={{ color: '#166534', fontWeight: 500, mb: 1 }}>
                                                Застосовано модифікатори:
                                            </Typography>
                                            {isEv && (
                                                <Typography variant="body2" sx={{ color: '#15803D', fontSize: '0.875rem' }}>
                                                    • EV зарядка: +30%
                                                </Typography>
                                            )}
                                            {isDisabled && (
                                                <Typography variant="body2" sx={{ color: '#15803D', fontSize: '0.875rem' }}>
                                                    • Спеціальне місце: -20%
                                                </Typography>
                                            )}
                                        </Box>
                                    )}
                                </Box>

                                <Divider sx={{ my: 2 }} />

                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                        До сплати
                                    </Typography>
                                    <Typography variant="h5" sx={{ fontWeight: 700, color: '#10B981' }}>
                                        {realPrice} грн
                                    </Typography>
                                </Box>

                                <Button
                                    variant="contained"
                                    fullWidth
                                    onClick={handleConfirmBooking}
                                    disabled={loading || bookingSuccess}
                                    sx={{
                                        py: 1.5,
                                        background: 'linear-gradient(135deg, #34D399 0%, #059669 100%)',
                                        color: '#FFFFFF',
                                        fontWeight: 600,
                                        fontSize: '1rem',
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
                                    {loading ? <CircularProgress size={24} sx={{ color: '#FFFFFF' }} /> :
                                        bookingSuccess ? 'Бронювання створено!' :
                                            'Підтвердити бронювання'}
                                </Button>

                                <Button
                                    variant="text"
                                    fullWidth
                                    onClick={() => navigate(-1)}
                                    disabled={loading}
                                    sx={{
                                        mt: 2,
                                        color: '#6B7280',
                                        textTransform: 'none',
                                        fontWeight: 600,
                                    }}
                                >
                                    Повернутися назад
                                </Button>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
            </Container>
        </Box>
    );
}

export default BookingCreatePage;