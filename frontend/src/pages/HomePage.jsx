// src/pages/HomePage.jsx
import React, { useState, useEffect } from 'react';
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
import { fetchParkingLots } from '../api/parkingAPI'; // Імпортуємо нашу нову функцію

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
    }, []); // Пустий масив означає, що ефект виконається лише один раз

    // Показуємо спіннер, поки дані завантажуються
    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 5 }}>
                <CircularProgress />
            </Box>
        );
    }

    // Показуємо повідомлення про помилку
    if (error) {
        return (
            <Container sx={{ mt: 4 }}>
                <Alert severity="error">{error}</Alert>
            </Container>
        );
    }

    return (
        <Container sx={{ mt: 4 }}>
            <Typography variant="h1" gutterBottom>
                Доступні паркінги
            </Typography>
            <List>
                {parkings.map((parking) => (
                    <ListItem key={parking.id} divider>
                        <ListItemText
                            primary={parking.name}
                            secondary={`${parking.city}, ${parking.street}`}
                        />
                    </ListItem>
                ))}
            </List>
        </Container>
    );
}

export default HomePage;