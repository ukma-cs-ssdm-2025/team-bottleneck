import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import {
    Typography, Container, Button, Grid, CircularProgress,
    Card, CardContent, Box, Chip, ToggleButtonGroup, ToggleButton
} from '@mui/material';
import { fetchAvailableSpots } from '../api/parkingAPI';
import ErrorPopup from '../components/common/ErrorPopup';
import { useAuth } from '../context/AuthContext';

function SpotSelectionPage() {
    const { lotId } = useParams();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { isOperator, isAdmin } = useAuth();

    // Read time from URL query parameters
    const startTime = searchParams.get('start_at');
    const endTime = searchParams.get('end_at');

    const [spots, setSpots] = useState([]);
    const [loading, setLoading] = useState(true);
    const [errorPopup, setErrorPopup] = useState({ open: false, message: '', severity: 'error' });

    const [filterEv, setFilterEv] = useState(false);
    const [filterDisabled, setFilterDisabled] = useState(false);

    const loadSpots = useCallback(async () => {
        if (!startTime || !endTime) {
            setErrorPopup({
                open: true,
                message: 'Не вказано час бронювання. Поверніться і оберіть час.',
                severity: 'error'
            });
            setLoading(false);
            return;
        }

        setLoading(true);
        setErrorPopup({ open: false, message: '', severity: 'error' });

        try {
            const data = await fetchAvailableSpots(lotId, startTime, endTime);
            const spotsList = data.results && Array.isArray(data.results) ? data.results : (Array.isArray(data) ? data : []);
            setSpots(spotsList);
        } catch (err) {
            console.error('Error fetching spots:', err);

            let errorMessage = 'Не вдалося завантажити доступні місця.';

            if (!err.response) {
                errorMessage = 'Не вдалося з\'єднатися з сервером. Перевірте ваше інтернет-з\'єднання.';
            } else if (err.response.status === 404) {
                errorMessage = 'Парковку не знайдено.';
            } else if (err.response.status === 400) {
                errorMessage = 'Некоректні параметри пошуку. Перевірте обраний час.';
            } else if (err.response.status === 500) {
                errorMessage = 'Помилка сервера. Спробуйте пізніше.';
            }

            setErrorPopup({ open: true, message: errorMessage, severity: 'error' });
            setSpots([]);
        } finally {
            setLoading(false);
        }
    }, [lotId, startTime, endTime]);

    useEffect(() => {
        loadSpots();
    }, [loadSpots]);

    const handleSelectSpot = (spot) => {
        if (isOperator || isAdmin) {
            setErrorPopup({
                open: true,
                message: 'Адміністратори та оператори не можуть створювати особисті бронювання.',
                severity: 'warning'
            });
            return;
        }
        
        navigate('/booking/create', {
            state: {
                lotId,
                spotId: spot.id,
                spotNumber: spot.number,
                isEv: spot.is_ev,
                isDisabled: spot.is_disabled,
                startTime,
                endTime,
            },
        });
    };

    // Apply filters
    const filteredSpots = spots.filter(spot => {
        if (filterEv && !spot.is_ev) return false;
        if (filterDisabled && !spot.is_disabled) return false;
        return true;
    });

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
                <CircularProgress />
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

            <Container maxWidth="lg">
                {/* Header */}
                <Card sx={{ borderRadius: '16px', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)', mb: 4 }}>
                    <CardContent sx={{ p: 4 }}>
                        <Typography variant="h4" sx={{ fontWeight: 700, color: '#111827', mb: 2 }}>
                            Оберіть паркомісце
                        </Typography>
                        {startTime && endTime && (
                            <Box>
                                <Typography variant="body1" sx={{ color: '#6B7280', mb: 0.5 }}>
                                    <strong>Період бронювання:</strong>
                                </Typography>
                                <Typography variant="body1" sx={{ color: '#111827' }}>
                                    {new Date(startTime).toLocaleString('uk-UA')} — {new Date(endTime).toLocaleString('uk-UA')}
                                </Typography>
                            </Box>
                        )}
                    </CardContent>
                </Card>

                {/* Filters */}
                <Card sx={{ borderRadius: '16px', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)', mb: 4 }}>
                    <CardContent sx={{ p: 3 }}>
                        <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                            Фільтри
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                            <ToggleButtonGroup
                                value={[
                                    ...(filterEv ? ['ev'] : []),
                                    ...(filterDisabled ? ['disabled'] : [])
                                ]}
                                onChange={(event, newFilters) => {
                                    setFilterEv(newFilters.includes('ev'));
                                    setFilterDisabled(newFilters.includes('disabled'));
                                }}
                                sx={{ flexWrap: 'wrap' }}
                            >
                                <ToggleButton
                                    value="ev"
                                    sx={{
                                        textTransform: 'none',
                                        fontWeight: 600,
                                        borderRadius: '12px',
                                        px: 3,
                                        '&.Mui-selected': {
                                            backgroundColor: '#D1FAE5',
                                            color: '#10B981',
                                            '&:hover': {
                                                backgroundColor: '#A7F3D0',
                                            }
                                        }
                                    }}
                                >
                                    ⚡ З зарядкою для електромобілів
                                </ToggleButton>
                                <ToggleButton
                                    value="disabled"
                                    sx={{
                                        textTransform: 'none',
                                        fontWeight: 600,
                                        borderRadius: '12px',
                                        px: 3,
                                        '&.Mui-selected': {
                                            backgroundColor: '#DBEAFE',
                                            color: '#3B82F6',
                                            '&:hover': {
                                                backgroundColor: '#BFDBFE',
                                            }
                                        }
                                    }}
                                >
                                    ♿ Для людей з обмеженими можливостями
                                </ToggleButton>
                            </ToggleButtonGroup>
                        </Box>
                    </CardContent>
                </Card>

                {/* Spots Grid */}
                {filteredSpots.length === 0 ? (
                    <Card sx={{ borderRadius: '16px', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)', p: 4, textAlign: 'center' }}>
                        <Typography variant="body1" color="text.secondary">
                            {spots.length === 0
                                ? 'На жаль, немає доступних місць на обраний час.'
                                : 'Немає місць, що відповідають обраним фільтрам.'}
                        </Typography>
                        <Button
                            variant="outlined"
                            onClick={() => navigate(`/lots/${lotId}`)}
                            sx={{
                                mt: 3,
                                color: '#10B981',
                                borderColor: '#10B981',
                                textTransform: 'none',
                                fontWeight: 600,
                                '&:hover': {
                                    borderColor: '#059669',
                                    backgroundColor: 'rgba(16, 185, 129, 0.04)',
                                }
                            }}
                        >
                            Обрати інший час
                        </Button>
                    </Card>
                ) : (
                    <>
                        <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                            Доступно місць: {filteredSpots.length}
                        </Typography>
                        <Grid container spacing={3}>
                            {filteredSpots.map((spot) => (
                                <Grid item key={spot.id} xs={12} sm={6} md={4}>
                                    <Card
                                        sx={{
                                            borderRadius: '16px',
                                            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
                                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                            '&:hover': {
                                                transform: 'translateY(-4px)',
                                                boxShadow: '0 12px 28px rgba(0, 0, 0, 0.12)',
                                            }
                                        }}
                                    >
                                        <CardContent sx={{ p: 3 }}>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                                <Typography variant="h5" sx={{ fontWeight: 700, color: '#111827' }}>
                                                    #{spot.number}
                                                </Typography>
                                                <Chip
                                                    label="Доступно"
                                                    sx={{
                                                        backgroundColor: '#D1FAE5',
                                                        color: '#10B981',
                                                        fontWeight: 600,
                                                        fontSize: '0.75rem'
                                                    }}
                                                />
                                            </Box>

                                            <Box sx={{ mb: 3, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                                {spot.is_ev && (
                                                    <Chip
                                                        label="⚡ EV зарядка"
                                                        size="small"
                                                        sx={{
                                                            backgroundColor: '#FEF3C7',
                                                            color: '#F59E0B',
                                                            fontWeight: 600
                                                        }}
                                                    />
                                                )}
                                                {spot.is_disabled && (
                                                    <Chip
                                                        label="♿ Для інвалідів"
                                                        size="small"
                                                        sx={{
                                                            backgroundColor: '#DBEAFE',
                                                            color: '#3B82F6',
                                                            fontWeight: 600
                                                        }}
                                                    />
                                                )}
                                            </Box>

                                            <Button
                                                variant="contained"
                                                fullWidth
                                                onClick={() => handleSelectSpot(spot)}
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
                                                    }
                                                }}
                                            >
                                                Обрати це місце
                                            </Button>
                                        </CardContent>
                                    </Card>
                                </Grid>
                            ))}
                        </Grid>
                    </>
                )}
            </Container>
        </Box>
    );
}

export default SpotSelectionPage;