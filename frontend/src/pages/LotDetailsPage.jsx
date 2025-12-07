import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Container, Typography, Grid, Card, CardContent, TextField, Button, Box, CircularProgress, Chip
} from '@mui/material';
import { fetchParkingLotDetails } from '../api/parkingAPI';
import { useAuth } from '../context/AuthContext';
import ErrorPopup from '../components/common/ErrorPopup';

function LotDetailsPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();
    const [lot, setLot] = useState(null);
    const [loading, setLoading] = useState(true);
    const [errorPopup, setErrorPopup] = useState({ open: false, message: '' });
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');

    useEffect(() => {
        if (!isAuthenticated) {
            navigate('/login', { state: { from: { pathname: `/lots/${id}` } } });
            return;
        }

        const loadDetails = async () => {
            try {
                const data = await fetchParkingLotDetails(id);
                setLot(data);
            } catch (err) {
                console.error('Error loading lot details:', err);

                let errorMessage = 'Не вдалося завантажити деталі парковки.';

                if (!err.response) {
                    if (err.request) {
                        errorMessage = 'Не вдалося з\'єднатися з сервером. Перевірте ваше інтернет-з\'єднання.';
                    }
                } else {
                    const status = err.response.status;

                    if (status === 404) {
                        errorMessage = 'Парковку не знайдено.';
                    } else if (status === 500) {
                        errorMessage = 'Помилка сервера. Спробуйте пізніше.';
                    } else if (status === 503) {
                        errorMessage = 'Сервер тимчасово недоступний. Спробуйте пізніше.';
                    } else if (err.response.data?.detail) {
                        errorMessage = err.response.data.detail;
                    }
                }

                setErrorPopup({ open: true, message: errorMessage });
            } finally {
                setLoading(false);
            }
        };

        loadDetails();
    }, [id, isAuthenticated, navigate]);

    // Quick time presets
    const handleQuickSelect = (hours) => {
        const now = new Date();
        const start = new Date(now.getTime() + 10 * 60000); // +10 minutes from now
        const end = new Date(start.getTime() + hours * 60 * 60000);

        // Format to datetime-local format
        const formatDateTime = (date) => {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            const hours = String(date.getHours()).padStart(2, '0');
            const minutes = String(date.getMinutes()).padStart(2, '0');
            return `${year}-${month}-${day}T${hours}:${minutes}`;
        };

        setStartTime(formatDateTime(start));
        setEndTime(formatDateTime(end));
    };

    const handleSearchSpots = (e) => {
        e.preventDefault();
        if (!startTime || !endTime) {
            setErrorPopup({
                open: true,
                message: 'Будь ласка, вкажіть час початку та кінця бронювання.'
            });
            return;
        }

        const start = new Date(startTime);
        const end = new Date(endTime);

        if (start >= end) {
            setErrorPopup({
                open: true,
                message: 'Час початку має бути раніше часу закінчення.'
            });
            return;
        }

        navigate(`/lots/${id}/spots?start_at=${startTime}&end_at=${endTime}`);
    };

    if (!isAuthenticated) {
        return null;
    }

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    if (!lot) {
        return (
            <Container sx={{ mt: 4 }}>
                <Typography>Парковку не знайдено</Typography>
            </Container>
        );
    }

    const googleMapsUrl = lot.latitude && lot.longitude
        ? `https://www.google.com/maps/search/?api=1&query=${lot.latitude},${lot.longitude}`
        : null;

    return (
        <Container sx={{ mt: 4, mb: 4 }}>
            <ErrorPopup
                open={errorPopup.open}
                onClose={() => setErrorPopup({ open: false, message: '' })}
                message={errorPopup.message}
                severity="error"
            />

            <Typography variant="h4" gutterBottom sx={{ fontWeight: 700, color: '#111827' }}>
                {lot.name}
            </Typography>

            <Grid container spacing={3} sx={{ mt: 2 }}>
                <Grid item xs={12} md={6}>
                    <Card sx={{ borderRadius: '16px', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)' }}>
                        <CardContent>
                            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                                Адреса
                            </Typography>
                            <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                                {lot.city}, {lot.street} {lot.building}
                            </Typography>

                            {googleMapsUrl && (
                                <Button
                                    variant="outlined"
                                    href={googleMapsUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    sx={{
                                        color: '#10B981',
                                        borderColor: '#10B981',
                                        textTransform: 'none',
                                        '&:hover': {
                                            borderColor: '#059669',
                                            backgroundColor: 'rgba(16, 185, 129, 0.04)',
                                        }
                                    }}
                                >
                                    Відкрити в Google Maps
                                </Button>
                            )}
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} md={6}>
                    <Card sx={{ borderRadius: '16px', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)' }}>
                        <CardContent>
                            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                                Ціна
                            </Typography>
                            <Typography variant="h5" sx={{ color: '#10B981', fontWeight: 700 }}>
                                {lot.base_price_per_hour} грн/год
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>

                {lot.description && (
                    <Grid item xs={12}>
                        <Card sx={{ borderRadius: '16px', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)' }}>
                            <CardContent>
                                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                                    Опис
                                </Typography>
                                <Typography variant="body1" color="text.secondary">
                                    {lot.description}
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                )}
            </Grid>

            <Box
                component="form"
                onSubmit={handleSearchSpots}
                sx={{
                    mt: 4,
                    p: 3,
                    background: '#FFFFFF',
                    borderRadius: '16px',
                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)'
                }}
            >
                <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
                    Знайти вільні місця
                </Typography>

                {/* Quick select buttons */}
                <Box sx={{ mb: 3 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                        Швидкий вибір:
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        <Chip
                            label="1 година"
                            onClick={() => handleQuickSelect(1)}
                            sx={{
                                cursor: 'pointer',
                                '&:hover': { backgroundColor: '#E0F2FE' }
                            }}
                        />
                        <Chip
                            label="2 години"
                            onClick={() => handleQuickSelect(2)}
                            sx={{
                                cursor: 'pointer',
                                '&:hover': { backgroundColor: '#E0F2FE' }
                            }}
                        />
                        <Chip
                            label="3 години"
                            onClick={() => handleQuickSelect(3)}
                            sx={{
                                cursor: 'pointer',
                                '&:hover': { backgroundColor: '#E0F2FE' }
                            }}
                        />
                        <Chip
                            label="Весь день (8 год)"
                            onClick={() => handleQuickSelect(8)}
                            sx={{
                                cursor: 'pointer',
                                '&:hover': { backgroundColor: '#E0F2FE' }
                            }}
                        />
                    </Box>
                </Box>

                <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                        <TextField
                            label="Початок бронювання"
                            type="datetime-local"
                            fullWidth
                            value={startTime}
                            onChange={(e) => setStartTime(e.target.value)}
                            InputLabelProps={{ shrink: true }}
                            required
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    borderRadius: '12px',
                                }
                            }}
                        />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <TextField
                            label="Кінець бронювання"
                            type="datetime-local"
                            fullWidth
                            value={endTime}
                            onChange={(e) => setEndTime(e.target.value)}
                            InputLabelProps={{ shrink: true }}
                            required
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    borderRadius: '12px',
                                }
                            }}
                        />
                    </Grid>
                    <Grid item xs={12}>
                        <Button
                            type="submit"
                            variant="contained"
                            fullWidth
                            sx={{
                                mt: 2,
                                py: 1.5,
                                background: 'linear-gradient(135deg, #34D399 0%, #059669 100%)',
                                color: '#FFFFFF',
                                fontWeight: 600,
                                fontSize: '1rem',
                                borderRadius: '12px',
                                textTransform: 'none',
                                '&:hover': {
                                    background: 'linear-gradient(135deg, #34D399 0%, #059669 100%)',
                                }
                            }}
                        >
                            Пошук доступних місць
                        </Button>
                    </Grid>
                </Grid>
            </Box>
        </Container>
    );
}

export default LotDetailsPage;