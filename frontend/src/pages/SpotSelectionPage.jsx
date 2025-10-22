import React, { useState, useEffect } from 'react';
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

    const loadSpots = async () => {
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
            setError('Не вдалося завантажити доступні місця. Перевірте підключення до бекенду.');
            setSpots([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadSpots();
    }, [lotId, startTime, endTime]); 

    const spotsToFilter = Array.isArray(spots) ? spots : []; 
    
    const filteredSpots = spotsToFilter.filter(spot => {
        // Фільтри використовують коректні назви полів: is_ev, is_disabled
        if (filterEv && !spot.is_ev) return false;
        if (filterDisabled && !spot.is_disabled) return false;
        return true;
    });

    const handleSelectSpot = (spot) => {
        // ЗАЛИШАЄМО заглушку 50 тут, оскільки це необхідно для переходу до сторінки створення бронювання
        const price = 50; 
        
        navigate('/booking/create', { 
            state: { 
                spotId: spot.id, 
                spotNumber: spot.number, 
                price: price, // Використовуємо заглушку
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
         // ... (код для повернення до вибору часу)
         return null;
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