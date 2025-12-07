import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Typography,
    Container,
    List,
    ListItem,
    ListItemText,
    CircularProgress,
    Box,
    Grid,
    Card,
    CardContent,
    Button,
} from '@mui/material';
import { fetchParkingLots } from '../api/parkingAPI';
import ParkingMap from '../components/ParkingMap';
import { useAuth } from '../context/AuthContext';
import ErrorPopup from '../components/common/ErrorPopup';

function HomePage() {
    const [parkings, setParkings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [errorPopup, setErrorPopup] = useState({ open: false, message: '' });
    const { isAuthenticated } = useAuth();
    const navigate = useNavigate();

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
                let errorMessage = 'Не вдалося завантажити список парковок. Спробуйте оновити сторінку.';

                if (err.response && err.response.status === 500) {
                    errorMessage = 'Сервер тимчасово недоступний. Спробуйте оновити сторінку пізніше.';
                } else if (err.request) {
                    errorMessage = 'Не вдалося з\'єднатися з сервером. Перевірте ваше інтернет-з\'єднання.';
                }

                setErrorPopup({ open: true, message: errorMessage });
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, []);

    const handleParkingClick = (lotId) => {
        if (!isAuthenticated) {
            // Save the intended destination and redirect to login
            navigate('/login', { state: { from: { pathname: `/lots/${lotId}` } } });
        } else {
            navigate(`/lots/${lotId}`);
        }
    };

    return (
        <Box sx={{ background: '#F4F6F8', minHeight: '100vh' }}>
            <ErrorPopup
                open={errorPopup.open}
                onClose={() => setErrorPopup({ open: false, message: '' })}
                message={errorPopup.message}
                severity="error"
            />

            {/* Hero Section */}
            <Box
                sx={{
                    background: 'linear-gradient(135deg, #34D399 0%, #059669 100%)',
                    color: '#FFFFFF',
                    py: { xs: 6, md: 10 },
                    textAlign: 'center',
                }}
            >
                <Container maxWidth="lg">
                    <Typography
                        variant="h2"
                        sx={{
                            fontWeight: 700,
                            fontSize: { xs: '1.875rem', md: '3rem' },
                            mb: 2,
                        }}
                    >
                        SmartParking
                    </Typography>
                    <Typography
                        variant="h5"
                        sx={{
                            fontWeight: 500,
                            fontSize: { xs: '1.125rem', md: '1.5rem' },
                            mb: 4,
                        }}
                    >
                        Розумна мережа паркінгів для вашого комфорту
                    </Typography>
                    <Typography
                        variant="body1"
                        sx={{
                            fontSize: { xs: '1rem', md: '1.125rem' },
                            maxWidth: '800px',
                            mx: 'auto',
                            mb: 4,
                        }}
                    >
                        Забудьте про пошуки вільного місця. З SmartParking ви можете забронювати паркомісце онлайн
                        завчасно в будь-якій точці міста. Ми пропонуємо сучасні автоматизовані паркінги з найвищим
                        рівнем безпеки та зручності.
                    </Typography>
                    <Button
                        variant="contained"
                        size="large"
                        onClick={() => {
                            const mapSection = document.getElementById('parking-map');
                            if (mapSection) {
                                mapSection.scrollIntoView({ behavior: 'smooth' });
                            }
                        }}
                        sx={{
                            background: '#FFFFFF',
                            color: '#10B981',
                            fontWeight: 600,
                            fontSize: '1.125rem',
                            px: 5,
                            py: 1.5,
                            borderRadius: '12px',
                            textTransform: 'none',
                            '&:hover': {
                                background: '#FFFFFF',
                            }
                        }}
                    >
                        Знайти паркінг
                    </Button>
                </Container>
            </Box>

            {/* Features Section */}
            <Container maxWidth="lg" sx={{ py: { xs: 6, md: 10 } }}>
                <Typography
                    variant="h3"
                    align="center"
                    sx={{
                        fontWeight: 700,
                        color: '#111827',
                        mb: 2,
                        fontSize: { xs: '1.5rem', md: '2.25rem' }
                    }}
                >
                    Чому обирають SmartParking?
                </Typography>
                <Typography
                    variant="body1"
                    align="center"
                    sx={{
                        color: '#6B7280',
                        mb: 6,
                        fontSize: '1.125rem',
                        maxWidth: '700px',
                        mx: 'auto'
                    }}
                >
                    Ми створили найзручнішу систему паркування, яка поєднує передові технології та високий рівень сервісу
                </Typography>

                <Grid container spacing={4}>
                    <Grid item xs={12} sm={6} md={3}>
                        <Card sx={{ height: '100%', borderRadius: '16px' }}>
                            <CardContent sx={{ textAlign: 'center', p: 4 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                                    <img src="/appointment.png" alt="Бронювання" style={{ width: '60px', height: '60px' }} />
                                </Box>
                                <Typography variant="h6" sx={{ fontWeight: 600, mb: 1.5 }}>
                                    Бронювання 24/7
                                </Typography>
                                <Typography variant="body2" sx={{ color: '#6B7280' }}>
                                    Резервуйте паркомісце в будь-який час доби онлайн через наш зручний інтерфейс
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>

                    <Grid item xs={12} sm={6} md={3}>
                        <Card sx={{ height: '100%', borderRadius: '16px' }}>
                            <CardContent sx={{ textAlign: 'center', p: 4 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                                    <img src="/verified.png" alt="Безпека" style={{ width: '60px', height: '60px' }} />
                                </Box>
                                <Typography variant="h6" sx={{ fontWeight: 600, mb: 1.5 }}>
                                    Безпека та Захист
                                </Typography>
                                <Typography variant="body2" sx={{ color: '#6B7280' }}>
                                    Всі наші паркінги обладнані системами відеоспостереження та цілодобовою охороною
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>

                    <Grid item xs={12} sm={6} md={3}>
                        <Card sx={{ height: '100%', borderRadius: '16px' }}>
                            <CardContent sx={{ textAlign: 'center', p: 4 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                                    <img src="/phone.png" alt="Мобільний доступ" style={{ width: '60px', height: '60px' }} />
                                </Box>
                                <Typography variant="h6" sx={{ fontWeight: 600, mb: 1.5 }}>
                                    Мобільний Доступ
                                </Typography>
                                <Typography variant="body2" sx={{ color: '#6B7280' }}>
                                    Керуйте бронюваннями з будь-якого пристрою - комп'ютера, планшета або смартфона
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>

                    <Grid item xs={12} sm={6} md={3}>
                        <Card sx={{ height: '100%', borderRadius: '16px' }}>
                            <CardContent sx={{ textAlign: 'center', p: 4 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                                    <img src="/remote.png" alt="Автоматизація" style={{ width: '60px', height: '60px' }} />
                                </Box>
                                <Typography variant="h6" sx={{ fontWeight: 600, mb: 1.5 }}>
                                    Автоматизація
                                </Typography>
                                <Typography variant="body2" sx={{ color: '#6B7280' }}>
                                    Сучасні автоматизовані системи входу та виходу без необхідності спілкування з персоналом
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
            </Container>

            {/* Parking Map and List Section */}
            <Box id="parking-map" sx={{ background: '#FFFFFF', py: { xs: 6, md: 10 } }}>
                <Container maxWidth="lg">
                    <Typography
                        variant="h3"
                        align="center"
                        sx={{
                            fontWeight: 700,
                            color: '#111827',
                            mb: 6,
                            fontSize: { xs: '1.5rem', md: '2.25rem' }
                        }}
                    >
                        Доступні паркінги
                    </Typography>

                    {loading ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                            <CircularProgress />
                        </Box>
                    ) : (
                        <Grid container spacing={4}>
                            <Grid item xs={12} md={7}>
                                <Box
                                    sx={{
                                        background: '#F4F6F8',
                                        borderRadius: '16px',
                                        overflow: 'hidden',
                                        height: '400px', // Fixed height
                                        '& .leaflet-container': {
                                            height: '100%',
                                            width: '100%',
                                        }
                                    }}
                                >
                                    <ParkingMap parkingLots={parkings} />
                                </Box>
                            </Grid>

                            <Grid item xs={12} md={5}>
                                <Box
                                    sx={{
                                        background: '#F4F6F8',
                                        borderRadius: '16px',
                                        p: 3,
                                        height: '600px',
                                        overflowY: 'auto'
                                    }}
                                >
                                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                                        Список локацій
                                    </Typography>
                                    {parkings.length > 0 ? (
                                        <List sx={{ p: 0 }}>
                                            {parkings.map((parking) => (
                                                <ListItem
                                                    key={parking.id}
                                                    onClick={() => handleParkingClick(parking.id)}
                                                    sx={{
                                                        background: '#FFFFFF',
                                                        borderRadius: '12px',
                                                        mb: 2,
                                                        cursor: 'pointer',
                                                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', // Smooth animation
                                                        '&:hover': {
                                                            transform: 'translateX(8px)',
                                                            boxShadow: '0 8px 16px rgba(0, 0, 0, 0.1)',
                                                        }
                                                    }}
                                                >
                                                    <ListItemText
                                                        primary={parking.name}
                                                        secondary={parking.address}
                                                    />
                                                </ListItem>
                                            ))}
                                        </List>
                                    ) : (
                                        <Typography sx={{ textAlign: 'center', py: 4 }}>
                                            Паркінги не знайдено
                                        </Typography>
                                    )}
                                </Box>
                            </Grid>
                        </Grid>
                    )}
                </Container>
            </Box>
        </Box>
    );
}

export default HomePage;