import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Typography,
    Container,
    Button,
    TextField,
    CircularProgress,
    Alert,
    Box,
    Card,
    Grid,
    Switch,
    FormControlLabel,
    Chip
} from '@mui/material';
import { fetchParkingLotDetails, fetchAvailableSpots } from '../api/parkingAPI';
import { getFormattedDateTime } from '../utils/dateTimeUtils';

const gradientGreen = 'linear-gradient(135deg, #34D399 0%, #059669 100%)';

function ParkingSpotsPage() {
    const { lotId } = useParams();
    const navigate = useNavigate();

    const [lot, setLot] = useState(null);
    const [spots, setSpots] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');
    const [filterEv, setFilterEv] = useState(false);
    const [filterDisabled, setFilterDisabled] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);

    useEffect(() => {
        const loadLotDetails = async () => {
            try {
                const data = await fetchParkingLotDetails(lotId);
                setLot(data);

                const now = new Date();
                const twoHoursLater = new Date(now.getTime() + 2 * 60 * 60 * 1000);
                setStartTime(getFormattedDateTime(now));
                setEndTime(getFormattedDateTime(twoHoursLater));

            } catch (err) {
                console.error('Error loading lot details:', err);
                if (err.response?.status === 404) {
                    setError('Парковку не знайдено. Можливо, вона була видалена.');
                } else if (err.response?.status === 500) {
                    setError('Сервер тимчасово недоступний. Спробуйте пізніше.');
                } else if (err.request) {
                    setError('Не вдалося з\'єднатися з сервером. Перевірте ваше інтернет-з\'єднання.');
                } else {
                    setError('Не вдалося завантажити деталі парковки. Спробуйте оновити сторінку.');
                }
            } finally {
                setLoading(false);
            }
        };

        loadLotDetails();
    }, [lotId]);

    const loadSpots = useCallback(async () => {
        if (!startTime || !endTime) {
            setError('Будь ласка, оберіть час початку та кінця.');
            return;
        }

        if (new Date(startTime) >= new Date(endTime)) {
            setError('Час початку має бути раніше часу закінчення.');
            return;
        }

        if (new Date(startTime) < new Date()) {
            setError('Неможливо забронювати місце в минулому.');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const data = await fetchAvailableSpots(lotId, startTime, endTime);
            const spotsList = data.results && Array.isArray(data.results) ? data.results : [];
            setSpots(spotsList);
            setHasSearched(true);
        } catch (err) {
            console.error('Error fetching spots:', err);
            if (err.response?.status === 404) {
                setError('Парковку не знайдено. Перевірте правильність посилання.');
            } else if (err.response?.status === 400) {
                setError('Некоректні параметри пошуку. Перевірте обраний час.');
            } else if (err.response?.status === 500) {
                setError('Сервер тимчасово недоступний. Спробуйте пізніше.');
            } else if (err.request) {
                setError('Не вдалося з\'єднатися з сервером. Перевірте ваше інтернет-з\'єднання.');
            } else {
                setError('Не вдалося завантажити доступні місця. Спробуйте оновити сторінку.');
            }
            setSpots([]);
        } finally {
            setLoading(false);
        }
    }, [lotId, startTime, endTime]);

    const handleSearchSpots = (e) => {
        e.preventDefault();
        loadSpots();
    };

    const handleSelectSpot = (spot) => {
        navigate('/booking/create', {
            state: {
                spot,
                lotName: lot.name,
                startTime,
                endTime
            }
        });
    };

    const filteredSpots = spots.filter(spot => {
        if (filterEv && !spot.is_ev) return false;
        if (filterDisabled && !spot.is_disabled) return false;
        return true;
    });

    if (loading && !lot) {
        return (
            <Box sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: '60vh'
            }}>
                <CircularProgress sx={{ color: '#34D399' }} />
            </Box>
        );
    }

    if (error && !lot) {
        return (
            <Container maxWidth="lg" sx={{ mt: 4 }}>
                <Alert
                    severity="error"
                    sx={{
                        borderRadius: '16px',
                        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)'
                    }}
                >
                    {error}
                </Alert>
            </Container>
        );
    }

    return (
        <Box sx={{
            backgroundColor: '#F4F6F8',
            minHeight: '100vh',
            py: 4
        }}>
            <Container maxWidth="xl">
                <Button
                    onClick={() => navigate('/')}
                    sx={{
                        mb: 3,
                        color: '#6B7280',
                        textTransform: 'none',
                        fontSize: '16px',
                        '&:hover': {
                            color: '#111827',
                            backgroundColor: 'transparent'
                        }
                    }}
                >
                    ← Назад до списку парковок
                </Button>

                <Box sx={{ mb: 4 }}>
                    <Typography
                        variant="h3"
                        sx={{
                            color: '#111827',
                            fontWeight: 700,
                            mb: 1
                        }}
                    >
                        {lot?.name || 'Парковка'}
                    </Typography>
                    <Typography
                        variant="body1"
                        sx={{ color: '#6B7280' }}
                    >
                        {lot?.city && lot?.street ? `${lot.city}, ${lot.street}` : 'Адреса не вказана'}
                    </Typography>
                </Box>

                <Grid container spacing={3}>
                    <Grid item xs={12} lg={3}>
                        <Card
                            sx={{
                                borderRadius: '20px',
                                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
                                border: 'none',
                                p: 3,
                                position: 'sticky',
                                top: 20
                            }}
                        >
                            <Typography
                                variant="h6"
                                sx={{
                                    color: '#111827',
                                    fontWeight: 600,
                                    mb: 3
                                }}
                            >
                                Фільтри
                            </Typography>

                            <Box component="form" onSubmit={handleSearchSpots}>
                                <TextField
                                    label="Початок бронювання"
                                    type="datetime-local"
                                    fullWidth
                                    value={startTime}
                                    onChange={(e) => setStartTime(e.target.value)}
                                    InputLabelProps={{ shrink: true }}
                                    required
                                    sx={{
                                        mb: 2,
                                        '& .MuiOutlinedInput-root': {
                                            borderRadius: '10px'
                                        }
                                    }}
                                />

                                <TextField
                                    label="Кінець бронювання"
                                    type="datetime-local"
                                    fullWidth
                                    value={endTime}
                                    onChange={(e) => setEndTime(e.target.value)}
                                    InputLabelProps={{ shrink: true }}
                                    required
                                    sx={{
                                        mb: 3,
                                        '& .MuiOutlinedInput-root': {
                                            borderRadius: '10px'
                                        }
                                    }}
                                />

                                <Box sx={{ mb: 3 }}>
                                    <FormControlLabel
                                        control={
                                            <Switch
                                                checked={filterEv}
                                                onChange={(e) => setFilterEv(e.target.checked)}
                                                sx={{
                                                    '& .MuiSwitch-switchBase.Mui-checked': {
                                                        color: '#34D399',
                                                    },
                                                    '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                                                        backgroundColor: '#34D399',
                                                    },
                                                }}
                                            />
                                        }
                                        label={
                                            <Typography sx={{ color: '#6B7280', fontSize: '14px' }}>
                                                Тільки EV
                                            </Typography>
                                        }
                                    />
                                    <FormControlLabel
                                        control={
                                            <Switch
                                                checked={filterDisabled}
                                                onChange={(e) => setFilterDisabled(e.target.checked)}
                                                sx={{
                                                    '& .MuiSwitch-switchBase.Mui-checked': {
                                                        color: '#34D399',
                                                    },
                                                    '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                                                        backgroundColor: '#34D399',
                                                    },
                                                }}
                                            />
                                        }
                                        label={
                                            <Typography sx={{ color: '#6B7280', fontSize: '14px' }}>
                                                Для людей з інвалідністю
                                            </Typography>
                                        }
                                    />
                                </Box>

                                <Button
                                    type="submit"
                                    fullWidth
                                    disabled={loading}
                                    sx={{
                                        background: gradientGreen,
                                        color: 'white',
                                        borderRadius: '10px',
                                        textTransform: 'none',
                                        fontSize: '16px',
                                        fontWeight: 600,
                                        py: 1.5,
                                        boxShadow: '0 4px 12px rgba(52, 211, 153, 0.3)',
                                        '&:hover': {
                                            background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                                            boxShadow: '0 6px 16px rgba(52, 211, 153, 0.4)',
                                        },
                                        '&:disabled': {
                                            background: '#E5E7EB',
                                            color: '#9CA3AF'
                                        }
                                    }}
                                >
                                    {loading ? 'Пошук...' : 'Знайти вільні місця'}
                                </Button>
                            </Box>
                        </Card>
                    </Grid>

                    <Grid item xs={12} lg={9}>
                        {error && hasSearched && (
                            <Alert
                                severity="error"
                                sx={{
                                    mb: 3,
                                    borderRadius: '16px',
                                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)'
                                }}
                            >
                                {error}
                            </Alert>
                        )}

                        {!hasSearched && (
                            <Card
                                sx={{
                                    borderRadius: '20px',
                                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
                                    border: 'none',
                                    p: 6,
                                    textAlign: 'center'
                                }}
                            >
                                <Typography
                                    variant="h5"
                                    sx={{
                                        color: '#6B7280',
                                        mb: 1
                                    }}
                                >
                                    Оберіть час бронювання
                                </Typography>
                                <Typography sx={{ color: '#9CA3AF' }}>
                                    Використайте фільтри для пошуку доступних паркомісць
                                </Typography>
                            </Card>
                        )}

                        {loading && hasSearched && (
                            <Box sx={{
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                                minHeight: '400px'
                            }}>
                                <CircularProgress sx={{ color: '#34D399' }} />
                            </Box>
                        )}

                        {!loading && hasSearched && filteredSpots.length === 0 && (
                            <Card
                                sx={{
                                    borderRadius: '20px',
                                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
                                    border: 'none',
                                    p: 6,
                                    textAlign: 'center'
                                }}
                            >
                                <Typography
                                    variant="h5"
                                    sx={{
                                        color: '#6B7280',
                                        mb: 1
                                    }}
                                >
                                    Немає доступних місць
                                </Typography>
                                <Typography sx={{ color: '#9CA3AF' }}>
                                    Спробуйте змінити час або фільтри пошуку
                                </Typography>
                            </Card>
                        )}

                        {!loading && hasSearched && filteredSpots.length > 0 && (
                            <>
                                <Box sx={{ mb: 3 }}>
                                    <Typography
                                        variant="h5"
                                        sx={{
                                            color: '#111827',
                                            fontWeight: 600
                                        }}
                                    >
                                        Доступні паркомісця
                                    </Typography>
                                    <Typography sx={{ color: '#6B7280', mt: 0.5 }}>
                                        Знайдено {filteredSpots.length} {filteredSpots.length === 1 ? 'місце' : 'місць'}
                                    </Typography>
                                </Box>

                                <Grid container spacing={3}>
                                    {filteredSpots.map((spot) => (
                                        <Grid item key={spot.id} xs={12} sm={6} md={4}>
                                            <Card
                                                sx={{
                                                    borderRadius: '16px',
                                                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
                                                    border: '2px solid transparent',
                                                    p: 3,
                                                    cursor: 'pointer',
                                                    transition: 'all 0.3s ease',
                                                    '&:hover': {
                                                        border: '2px solid #34D399',
                                                        boxShadow: '0 8px 30px rgba(52, 211, 153, 0.2)',
                                                        transform: 'translateY(-4px)'
                                                    }
                                                }}
                                                onClick={() => handleSelectSpot(spot)}
                                            >
                                                <Typography
                                                    variant="h4"
                                                    sx={{
                                                        color: '#111827',
                                                        fontWeight: 700,
                                                        mb: 2
                                                    }}
                                                >
                                                    {spot.number}
                                                </Typography>

                                                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 3 }}>
                                                    {spot.is_ev && (
                                                        <Chip
                                                            label="⚡ EV"
                                                            size="small"
                                                            sx={{
                                                                background: gradientGreen,
                                                                color: 'white',
                                                                fontWeight: 600,
                                                                fontSize: '12px'
                                                            }}
                                                        />
                                                    )}
                                                    {spot.is_disabled && (
                                                        <Chip
                                                            label="♿ Accessible"
                                                            size="small"
                                                            sx={{
                                                                background: '#3B82F6',
                                                                color: 'white',
                                                                fontWeight: 600,
                                                                fontSize: '12px'
                                                            }}
                                                        />
                                                    )}
                                                    {!spot.is_ev && !spot.is_disabled && (
                                                        <Chip
                                                            label="Стандартне"
                                                            size="small"
                                                            sx={{
                                                                backgroundColor: '#E5E7EB',
                                                                color: '#6B7280',
                                                                fontWeight: 600,
                                                                fontSize: '12px'
                                                            }}
                                                        />
                                                    )}
                                                </Box>

                                                <Button
                                                    fullWidth
                                                    sx={{
                                                        background: gradientGreen,
                                                        color: 'white',
                                                        borderRadius: '10px',
                                                        textTransform: 'none',
                                                        fontSize: '15px',
                                                        fontWeight: 600,
                                                        py: 1.2,
                                                        boxShadow: '0 4px 12px rgba(52, 211, 153, 0.3)',
                                                        '&:hover': {
                                                            background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                                                            boxShadow: '0 6px 16px rgba(52, 211, 153, 0.4)',
                                                        }
                                                    }}
                                                >
                                                    Обрати місце
                                                </Button>
                                            </Card>
                                        </Grid>
                                    ))}
                                </Grid>
                            </>
                        )}
                    </Grid>
                </Grid>
            </Container>
        </Box>
    );
}

export default ParkingSpotsPage;