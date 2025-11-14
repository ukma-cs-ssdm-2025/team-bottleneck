import React, { useState, useEffect } from 'react';
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
    CardContent,
    Grid
} from '@mui/material';
// Suppose you have a function to fetch parking lot details
import { fetchParkingLotDetails } from '../api/parkingAPI'; 
import { getFormattedDateTime } from '../utils/dateTimeUtils'; // Utility for formatting date/time

function LotDetailsPage() {
    const { id } = useParams(); // Get lot ID from URL (e.g., /lots/1)
    const navigate = useNavigate();
    
    const [lot, setLot] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // State for the time selection form
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');

    useEffect(() => {
        const loadLotDetails = async () => {
            try {
                // Call API to get lot details
                const data = await fetchParkingLotDetails(id);
                setLot(data);
                
                // Set default values: now and 2 hours later
                const now = new Date();
                const twoHoursLater = new Date(now.getTime() + 2 * 60 * 60 * 1000);

                // Assume getFormattedDateTime formats in ISO 8601 (YYYY-MM-DDTHH:mm)
                setStartTime(getFormattedDateTime(now)); 
                setEndTime(getFormattedDateTime(twoHoursLater));

            } catch (err) {
                console.error('Error loading lot details:', err);
                if (err.response && err.response.status === 404) {
                    setError('Парковку не знайдено. Можливо, вона була видалена.');
                } else if (err.response && err.response.status === 500) {
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
    }, [id]);

    const handleSearchSpots = (e) => {
        e.preventDefault();
        
        // Basic time validation
        if (!startTime || !endTime || new Date(startTime) >= new Date(endTime)) {
            alert('Будь ласка, оберіть коректний діапазон часу. Час початку має бути раніше часу закінчення.');
            return;
        }

        if (new Date(startTime) < new Date()) {
            alert('Неможливо забронювати місце в минулому. Оберіть майбутній час.');
            return;
        }

        // Redirect to the spot selection page, passing parameters via state
        navigate(`/lots/${id}/spots`, { 
            state: { 
                lotId: id,
                lotName: lot.name,
                startTime: startTime, 
                endTime: endTime 
            } 
        });
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 5 }}>
                <CircularProgress />
            </Box>
        );
    }

    if (error) {
        return (
            <Container sx={{ mt: 4 }}>
                <Alert severity="error">{error}</Alert>
            </Container>
        );
    }

    return (
        <Container sx={{ mt: 4 }}>
            <Typography variant="h4" gutterBottom>
                Паркувальний Лот: {lot.name}
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
                {lot.description || 'Детальний опис відсутній.'}
            </Typography>

            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} md={6}>
                    <Card variant="outlined">
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                Розташування
                            </Typography>
                            <Typography variant="body2">
                                **Місто:** {lot.city}
                            </Typography>
                            <Typography variant="body2">
                                **Адреса:** {lot.street}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} md={6}>
                     <Card variant="outlined">
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                Додаткові Сервіси
                            </Typography>
                            {/* Assume the lot object has a "services" field */}
                            <Typography variant="body2">
                                {lot.services ? lot.services.join(', ') : 'Немає додаткових сервісів.'}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Form for selecting time to search available spots */}
            <Box component="form" onSubmit={handleSearchSpots} sx={{ mt: 4, p: 3, border: '1px solid #ccc', borderRadius: 2 }}>
                <Typography variant="h5" gutterBottom>
                    🔍 Знайти вільні місця
                </Typography>
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
                        />
                    </Grid>
                    <Grid item xs={12}>
                        <Button type="submit" variant="contained" color="primary" fullWidth sx={{ mt: 2 }}>
                            Пошук доступних місць
                        </Button>
                    </Grid>
                </Grid>
            </Box>
        </Container>
    );
}

export default LotDetailsPage;
