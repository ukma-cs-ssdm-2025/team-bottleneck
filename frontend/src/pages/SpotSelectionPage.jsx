import React, { useState, useEffect, useCallback } from 'react'; // 1. ІМПОРТУЄМО useCallback
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import {
    Typography, Container, Button, Grid, CircularProgress, Alert,
    Card, CardContent, Box, Switch, FormControlLabel,
} from '@mui/material';
import { fetchAvailableSpots } from '../api/parkingAPI';

function SpotSelectionPage() {
    const { lotId } = useParams();
    const location = useLocation();
    const navigate = useNavigate();

    const { lotName, startTime, endTime } = location.state || {};

    const [spots, setSpots] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [filterEv, setFilterEv] = useState(false);
    const [filterDisabled, setFilterDisabled] = useState(false);

    const loadSpots = useCallback(async () => {
        if (!startTime || !endTime) {
            setError("Помилка: Не вказано час бронювання. Поверніться і оберіть час.");
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);
        try {
            const data = await fetchAvailableSpots(lotId, startTime, endTime);

            const spotsList = data.results && Array.isArray(data.results) ? data.results : [];
            setSpots(spotsList);
        } catch (err) {
            console.error('Error fetching spots:', err);
            if (err.response && err.response.status === 404) {
                setError('Парковку не знайдено. Перевірте правильність посилання.');
            } else if (err.response && err.response.status === 400) {
                setError('Некоректні параметри пошуку. Перевірте обраний час.');
            } else if (err.response && err.response.status === 500) {
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

    useEffect(() => {
        loadSpots();
    }, [loadSpots]);

    const spotsToFilter = Array.isArray(spots) ? spots : [];

    const filteredSpots = spotsToFilter.filter(spot => {
        if (filterEv && !spot.is_ev) return false;
        if (filterDisabled && !spot.is_disabled) return false;
        return true;
    });

    const handleSelectSpot = (spot) => {
        const price = 50;

        navigate('/booking/create', {
            state: {
                spotId: spot.id,
                spotNumber: spot.number,
                price: price,
                lotName,
                startTime,
                endTime,
                lotId
            }
        });
    };

    if (loading) {
        return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 5 }}><CircularProgress /></Box>;
    }

    if (error) {
        return (
            <Container sx={{ mt: 4 }}>
                <Alert severity="error">{error}</Alert>
                <Button onClick={() => navigate(`/lots/${lotId}`)} sx={{ mt: 2 }} variant="outlined">Повернутися до вибору часу</Button>
            </Container>
        );
    }

    if (!startTime || !endTime) {
        return (
            <Container sx={{ mt: 4 }}>
                <Alert severity="warning">Не вказано час бронювання.</Alert>
                <Button onClick={() => navigate(`/lots/${lotId}`)} sx={{ mt: 2 }} variant="outlined">Повернутися до вибору часу</Button>
            </Container>
        );
    }

    return (
        <Container sx={{ mt: 4 }}>
            <Typography variant="h4" gutterBottom>Доступні місця: {lotName}</Typography>
            <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 3 }}>
                З: {new Date(startTime).toLocaleString()} До: {new Date(endTime).toLocaleString()}
            </Typography>

            <Box sx={{ mb: 3, p: 2, border: '1px solid #ddd', borderRadius: 1 }}>
                <Typography variant="h6" sx={{ mb: 1 }}>Фільтри:</Typography>
                <FormControlLabel control={<Switch checked={filterEv} onChange={(e) => setFilterEv(e.target.checked)} />} label="Лише для електромобілів (EV)" />
                <FormControlLabel control={<Switch checked={filterDisabled} onChange={(e) => setFilterDisabled(e.target.checked)} />} label="Лише для людей з інвалідністю (♿)" />
            </Box>

            <Grid container spacing={3}>
                {filteredSpots.length > 0 ? (
                    filteredSpots.map((spot) => (
                        <Grid item key={spot.id} xs={12} sm={6} md={4}>
                            <Card variant="outlined" sx={{ '&:hover': { boxShadow: 3 } }}>
                                <CardContent>
                                    <Typography variant="h5">Місце #{spot.number}</Typography>


                                    <Box sx={{ mt: 1 }}>
                                        {spot.is_ev && <span style={{ marginRight: 8 }}>⚡ EV</span>}
                                        {spot.is_disabled && <span style={{ marginRight: 8 }}>♿ Disabled</span>}
                                    </Box>
                                    <Button
                                        variant="contained"
                                        color="success"
                                        fullWidth
                                        sx={{ mt: 2 }}
                                        onClick={() => handleSelectSpot(spot)}
                                    >
                                        Обрати
                                    </Button>
                                </CardContent>
                            </Card>
                        </Grid>
                    ))
                ) : (
                    <Grid item xs={12}>
                        <Alert severity="info">Немає доступних місць, що відповідають фільтрам та обраному часу.</Alert>
                    </Grid>
                )}
            </Grid>
        </Container>
    );
}

export default SpotSelectionPage;