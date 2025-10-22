// src/pages/HomePage.jsx
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

function HomePage() {
    const [parkings, setParkings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const loadData = async () => {
            try {
                const data = await fetchParkingLots();
                setParkings(data);
            } catch (err) {
                setError('Не вдалося завантажити дані. Переконайтесь, що бекенд-сервер запущено.');
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
    // ...

    return (
        <Container sx={{ mt: 4 }}>
            <Typography variant="h4" gutterBottom> {}
                Доступні паркінги
            </Typography>
            <List>
                {parkings.map((parking) => (
                    <ListItem 
                        key={parking.id} 
                        divider
                        // Використовуємо Link для навігації на сторінку деталей
                        component={Link} 
                        to={`/lots/${parking.id}`}
                        sx={{ textDecoration: 'none', color: 'inherit', '&:hover': { backgroundColor: '#f5f5f5' } }} // Стилі для Link
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