import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom'; 
import {
    Typography,
    Container,
    List,
    ListItem,
    ListItemText,
    CircularProgress,
    Alert,
    Box
} from '@mui/material';
import { fetchParkingLots } from '../api/parkingAPI';
import ParkingMap from '../components/ParkingMap';

function HomePage() {
    const [parkings, setParkings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const loadData = async () => {
            try {
                const data = await fetchParkingLots();
                if (Array.isArray(data)) {
                    setParkings(data);
                } else {
                    if (data && Array.isArray(data.results)) {
                        setParkings(data.results);
                    } else {
                        console.warn("Не вдалося отримати масив парковок:", data);
                        setParkings([]); 
                    }
                }
            } catch (err) {
                console.error('Error loading parking lots:', err);
                if (err.response && err.response.status === 500) {
                    setError('Сервер тимчасово недоступний. Спробуйте оновити сторінку пізніше.');
                } else if (err.request) {
                    setError('Не вдалося з\'єднатися з сервером. Перевірте ваше інтернет-з\'єднання та переконайтесь, що сервер запущено.');
                } else {
                    setError('Не вдалося завантажити список парковок. Спробуйте оновити сторінку.');
                }
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, []);
    
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
                Доступні паркінги
            </Typography>

            {parkings.length > 0 && (
                <Box sx={{ mb: 4 }}>
                    <ParkingMap parkingLots={parkings} />
                </Box>
            )}

            <Typography variant="h5" gutterBottom sx={{ mt: 2 }}>
                Список парковок
            </Typography>
            <List>
                {parkings.map((parking) => (
                    <ListItem 
                        key={parking.id} 
                        divider
                        component={Link} 
                        to={`/lots/${parking.id}`}
                        sx={{ 
                            textDecoration: 'none', 
                            color: 'inherit', 
                            '&:hover': { backgroundColor: '#f5f5f5' } 
                        }}
                    >
                        <ListItemText
                            primary={parking.name}
                            secondary={`${parking.city || 'Місто не вказано'}, ${parking.street || 'Вулиця не вказана'}`}
                        />
                    </ListItem>
                ))}
            </List>

            {parkings.length === 0 && !loading && (
                <Alert severity="info">Наразі немає доступних паркувальних лотів.</Alert>
            )}
        </Container>
    );
}

export default HomePage;