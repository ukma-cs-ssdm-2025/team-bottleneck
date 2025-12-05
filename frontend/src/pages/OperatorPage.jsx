import React, { useState, useEffect, useCallback } from 'react';
import {
    Container, Typography, Box, Card, CardContent, Grid, Button, CircularProgress,
    Chip, IconButton, Dialog, DialogTitle, DialogContent, DialogActions,
    TextField, Checkbox, FormControlLabel, Divider, Tabs, Tab, Tooltip
} from '@mui/material';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/apiClient';
import ErrorPopup from '../components/common/ErrorPopup';

function OperatorPage() {
    const { user, isOperator, isAdmin } = useAuth();
    const navigate = useNavigate();

    // Data
    const [lot, setLot] = useState(null);
    const [spots, setSpots] = useState([]);
    const [bookings, setBookings] = useState([]);

    // Loading
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);

    // Filters
    const [bookingFilter, setBookingFilter] = useState(0);

    // Dialogs
    const [createDialogOpen, setCreateDialogOpen] = useState(false);
    const [cancelDialogOpen, setCancelDialogOpen] = useState(false);

    // Forms
    const [newSpot, setNewSpot] = useState({ number: '', is_ev: false, is_disabled: false });
    const [bookingToCancel, setBookingToCancel] = useState(null);
    const [cancelReason, setCancelReason] = useState('');

    // Errors
    const [errorPopup, setErrorPopup] = useState({ open: false, message: '', severity: 'error' });

    const lotId = user?.lot_id;

    useEffect(() => {
        if (!isOperator && !isAdmin) {
            navigate('/');
            return;
        }

        if (!lotId) {
            setErrorPopup({
                open: true,
                message: 'За вами не закріплено паркувальний лот. Зверніться до адміністратора.',
                severity: 'error'
            });
            setLoading(false);
            return;
        }

        loadAllData();
    }, [lotId, isOperator, isAdmin, navigate]);

    const loadAllData = useCallback(async () => {
        if (!lotId) return;

        setLoading(true);
        try {
            // Load lot data first
            const lotData = await apiClient.get(`/lots/${lotId}/`);
            setLot(lotData.data);

            // Helper function to load paginated data
            const loadPaginatedData = async (initialUrl, dataName, maxPages = 100) => {
                let allData = [];
                let nextUrl = initialUrl;
                let pageCount = 0;

                console.log(`=== LOADING ${dataName.toUpperCase()} WITH PAGINATION ===`);

                while (nextUrl && pageCount < maxPages) {
                    try {
                        const response = await apiClient.get(nextUrl);
                        const data = response.data;

                        const pageResults = data.results || data || [];
                        allData = [...allData, ...pageResults];
                        pageCount++;

                        console.log(`${dataName} page ${pageCount} loaded: ${pageResults.length} items`);

                        if (data.next) {
                            try {
                                const url = new URL(data.next);
                                let path = url.pathname + url.search;
                                path = path.replace(/^\/api\/v1/, '');
                                nextUrl = path;
                            } catch (e) {
                                let path = data.next;
                                path = path.replace(/^\/api\/v1/, '');
                                nextUrl = path;
                            }
                        } else {
                            nextUrl = null;
                        }
                    } catch (err) {
                        console.warn(`Error loading ${dataName} page:`, err);
                        break;
                    }
                }

                if (pageCount >= maxPages) {
                    console.warn(`Reached max pages limit while loading ${dataName}`);
                    setErrorPopup({
                        open: true,
                        message: `Завантажено максимальну кількість ${dataName === 'spots' ? 'місць' : 'бронювань'}. Деякі дані можуть бути не відображені.`,
                        severity: 'warning'
                    });
                }

                console.log(`=== ${dataName.toUpperCase()} LOADING COMPLETE ===`);
                console.log(`Total ${dataName} loaded:`, allData.length);
                console.log('=====================================');

                return allData;
            };

            // Load spots and bookings in parallel
            const [allSpots, allBookings] = await Promise.all([
                loadPaginatedData(`/lots/${lotId}/spots/`, 'spots', 50),
                loadPaginatedData('/bookings/my-lot-bookings/', 'bookings', 100)
            ]);

            setSpots(allSpots);
            setBookings(allBookings);

            // Debug: log summary
            console.log('=== DATA LOAD SUMMARY ===');
            console.log('Lot:', lotData.data.name);
            console.log('Total spots:', allSpots.length);
            console.log('Total bookings:', allBookings.length);
            console.log('Sample spot:', allSpots[0]);
            console.log('Sample booking:', allBookings[0]);

            // Check future confirmed bookings
            const now = new Date();
            const futureConfirmed = allBookings.filter(b => {
                const isConfirmed = b.status === 'confirmed';
                const isFuture = new Date(b.start_at) > now;
                return isConfirmed && isFuture;
            });
            console.log('Future confirmed bookings:', futureConfirmed.length);

            // Check bookings by status
            const byStatus = allBookings.reduce((acc, b) => {
                acc[b.status] = (acc[b.status] || 0) + 1;
                return acc;
            }, {});
            console.log('Bookings by status:', byStatus);
            console.log('========================');
        } catch (err) {
            console.error('Error loading data:', err);
            console.error('Error details:', {
                message: err.message,
                response: err.response?.data,
                status: err.response?.status
            });

            let errorMessage = 'Не вдалося завантажити дані парковки.';
            let shouldRedirect = false;

            if (!err.response) {
                errorMessage = 'Не вдалося з\'єднатися з сервером. Перевірте інтернет-з\'єднання.';
            } else {
                const status = err.response.status;
                const data = err.response.data;

                switch (status) {
                    case 401:
                        errorMessage = 'Сесія закінчилась. Будь ласка, увійдіть знову.';
                        shouldRedirect = true;
                        setTimeout(() => navigate('/login'), 2000);
                        break;

                    case 403:
                        if (data?.detail && data.detail.includes('оператором')) {
                            errorMessage = 'Ви не призначені оператором цієї парковки. Зверніться до адміністратора.';
                        } else {
                            errorMessage = 'У вас немає доступу до цієї парковки.';
                        }
                        shouldRedirect = true;
                        setTimeout(() => navigate('/'), 2500);
                        break;

                    case 404:
                        errorMessage = 'Парковку не знайдено. Можливо, вона була видалена.';
                        shouldRedirect = true;
                        setTimeout(() => navigate('/'), 2500);
                        break;

                    case 500:
                        errorMessage = 'Помилка сервера. Спробуйте оновити сторінку.';
                        break;

                    case 503:
                        errorMessage = 'Сервіс тимчасово недоступний. Спробуйте через кілька хвилин.';
                        break;

                    default:
                        errorMessage = `Помилка ${status}. Спробуйте оновити сторінку.`;
                }
            }

            setErrorPopup({ open: true, message: errorMessage, severity: 'error' });

            // Якщо не потрібен редирект, залишаємо можливість повторної спроби
            if (!shouldRedirect) {
                // Встановлюємо пусті дані щоб не було краша
                setLot(null);
                setSpots([]);
                setBookings([]);
            }
        } finally {
            setLoading(false);
        }
    }, [lotId, navigate]);

    // Log when spots change
    useEffect(() => {
        console.log('=== SPOTS STATE CHANGED ===');
        console.log('Current spots count:', spots.length);
        console.log('Spots:', spots.map(s => ({ id: s.id, number: s.number })));
        console.log('==========================');
    }, [spots]);

    // Stats calculations
    const totalSpots = spots.length;
    const now = new Date();

    // Get IDs of all existing spots
    const existingSpotIds = new Set(spots.map(s => s.id));

    // Get unique spot IDs that are currently occupied AND exist
    const occupiedSpotIds = new Set(
        bookings
            .filter(b =>
                b.status === 'confirmed' &&
                new Date(b.start_at) <= now &&
                new Date(b.end_at) > now
            )
            .map(b => typeof b.spot === 'object' ? b.spot.id : b.spot)
            .filter(spotId => existingSpotIds.has(spotId)) // Only count existing spots!
    );

    const activeBookings = occupiedSpotIds.size;
    const freeSpots = totalSpots - activeBookings;

    const upcomingBookings = bookings.filter(b =>
        b.status === 'confirmed' &&
        new Date(b.start_at) > now
    ).length;

    // Debug info
    console.log('=== STATS DEBUG ===');
    console.log('Total spots:', totalSpots);
    console.log('All spots:', spots.map(s => ({ id: s.id, number: s.number })));
    console.log('Existing spot IDs:', Array.from(existingSpotIds));
    console.log('Total bookings:', bookings.length);
    console.log('Occupied spot IDs (only existing):', Array.from(occupiedSpotIds));
    console.log('Active bookings count:', activeBookings);
    console.log('Free spots:', freeSpots);
    const activeBookingsDetails = bookings.filter(b =>
        b.status === 'confirmed' &&
        new Date(b.start_at) <= now &&
        new Date(b.end_at) > now
    );
    console.log('All active bookings:', activeBookingsDetails);
    console.log('Active bookings spot info:', activeBookingsDetails.map(b => ({
        booking_id: b.id,
        spot_id: typeof b.spot === 'object' ? b.spot.id : b.spot,
        spot_number: b.spot_number || (typeof b.spot === 'object' ? b.spot.number : 'N/A'),
        spot_exists: existingSpotIds.has(typeof b.spot === 'object' ? b.spot.id : b.spot)
    })));
    console.log('==================');

    // Filtered bookings
    const filteredBookings = bookings.filter(b => {
        if (bookingFilter === 1) return b.status === 'confirmed' && new Date(b.end_at) > new Date();
        if (bookingFilter === 2) return b.status === 'cancelled';
        return true;
    }).sort((a, b) => new Date(b.start_at) - new Date(a.start_at));

    // Create Spot
    const handleCreateSpot = async () => {
        // Валідація на клієнті
        if (!newSpot.number.trim()) {
            setErrorPopup({ open: true, message: 'Будь ласка, введіть номер місця', severity: 'error' });
            return;
        }

        // Перевірка довжини номера
        if (newSpot.number.length > 10) {
            setErrorPopup({ open: true, message: 'Номер місця не може бути довшим за 10 символів', severity: 'error' });
            return;
        }

        setActionLoading(true);
        try {
            const response = await apiClient.post(`/lots/${lotId}/spots/create/`, newSpot);
            console.log('=== SPOT CREATED ===');
            console.log('Created spot:', response.data);
            console.log('===================');

            setErrorPopup({ open: true, message: 'Місце успішно створено!', severity: 'success' });
            setCreateDialogOpen(false);
            setNewSpot({ number: '', is_ev: false, is_disabled: false });

            // Перезавантажуємо всі дані
            await loadAllData();

            console.log('Data reloaded after spot creation');
        } catch (err) {
            console.error('Error creating spot:', err);

            let errorMessage = 'Не вдалося створити місце.';

            if (!err.response) {
                errorMessage = 'Не вдалося з\'єднатися з сервером. Перевірте інтернет-з\'єднання.';
            } else {
                const status = err.response.status;
                const data = err.response.data;

                switch (status) {
                    case 400:
                        // Валідаційні помилки
                        if (data.number) {
                            if (Array.isArray(data.number)) {
                                errorMessage = data.number[0];
                            } else {
                                errorMessage = data.number;
                            }

                            // Перевірка на дублікат
                            if (errorMessage.toLowerCase().includes('already exists') ||
                                errorMessage.toLowerCase().includes('вже існує') ||
                                errorMessage.toLowerCase().includes('duplicate')) {
                                errorMessage = `Місце з номером "${newSpot.number}" вже існує на цій парковці`;

                                // Показати список існуючих номерів якщо є
                                if (data.existing_numbers && Array.isArray(data.existing_numbers)) {
                                    const existingList = data.existing_numbers.slice(0, 10).join(', ');
                                    errorMessage += `\n\nІснуючі номери: ${existingList}${data.existing_numbers.length > 10 ? '...' : ''}`;
                                }
                            }
                        } else if (data.detail) {
                            errorMessage = data.detail;
                        } else if (data.non_field_errors) {
                            errorMessage = data.non_field_errors[0];
                        } else {
                            errorMessage = 'Невірні дані. Перевірте правильність введення.';
                        }
                        break;

                    case 401:
                        errorMessage = 'Сесія закінчилась. Будь ласка, увійдіть знову.';
                        setTimeout(() => navigate('/login'), 2000);
                        break;

                    case 403:
                        errorMessage = 'У вас немає прав для створення місць на цій парковці.';
                        break;

                    case 404:
                        errorMessage = 'Парковку не знайдено. Можливо, вона була видалена.';
                        break;

                    case 409:
                        errorMessage = 'Місце з таким номером вже існує. Оберіть інший номер.';
                        break;

                    case 500:
                        errorMessage = 'Помилка сервера. Спробуйте пізніше або зверніться до адміністратора.';
                        break;

                    case 503:
                        errorMessage = 'Сервіс тимчасово недоступний. Спробуйте через кілька хвилин.';
                        break;

                    default:
                        errorMessage = `Помилка ${status}. Спробуйте ще раз або зверніться до підтримки.`;
                }
            }

            setErrorPopup({ open: true, message: errorMessage, severity: 'error' });
        } finally {
            setActionLoading(false);
        }
    };

    // Cancel Booking
    const openCancelDialog = (booking) => {
        setBookingToCancel(booking);
        setCancelReason('');
        setCancelDialogOpen(true);
    };

    const handleCancelBooking = async () => {
        if (!bookingToCancel) {
            setErrorPopup({ open: true, message: 'Не вибрано бронювання для скасування', severity: 'error' });
            return;
        }

        // Валідація причини
        if (!cancelReason.trim()) {
            setErrorPopup({ open: true, message: 'Будь ласка, вкажіть причину скасування', severity: 'error' });
            return;
        }

        if (cancelReason.trim().length < 5) {
            setErrorPopup({ open: true, message: 'Причина скасування має містити принаймні 5 символів', severity: 'error' });
            return;
        }

        if (cancelReason.length > 255) {
            setErrorPopup({ open: true, message: 'Причина скасування надто довга (максимум 255 символів)', severity: 'error' });
            return;
        }

        setActionLoading(true);
        try {
            await apiClient.post(`/bookings/${bookingToCancel.id}/cancel-operator/`, {
                reason: cancelReason
            });
            setErrorPopup({ open: true, message: 'Бронювання успішно скасовано!', severity: 'success' });
            setCancelDialogOpen(false);
            setBookingToCancel(null);
            setCancelReason('');
            await loadAllData();
        } catch (err) {
            console.error('Error cancelling booking:', err);

            let errorMessage = 'Не вдалося скасувати бронювання.';

            if (!err.response) {
                errorMessage = 'Не вдалося з\'єднатися з сервером. Перевірте інтернет-з\'єднання.';
            } else {
                const status = err.response.status;
                const data = err.response.data;

                switch (status) {
                    case 400:
                        if (data.detail) {
                            const detail = data.detail.toLowerCase();

                            if (detail.includes('already cancelled') || detail.includes('вже скасовано')) {
                                errorMessage = 'Це бронювання вже було скасовано раніше.';
                            } else if (detail.includes('already completed') || detail.includes('завершено')) {
                                errorMessage = 'Не можна скасувати завершене бронювання.';
                            } else if (detail.includes('past') || detail.includes('минуле')) {
                                errorMessage = 'Не можна скасувати бронювання, яке вже закінчилось.';
                            } else {
                                errorMessage = data.detail;
                            }
                        } else if (data.reason) {
                            errorMessage = `Помилка: ${data.reason[0]}`;
                        } else {
                            errorMessage = 'Невірні дані. Перевірте правильність введення.';
                        }
                        break;

                    case 401:
                        errorMessage = 'Сесія закінчилась. Будь ласка, увійдіть знову.';
                        setTimeout(() => navigate('/login'), 2000);
                        break;

                    case 403:
                        errorMessage = 'У вас немає прав для скасування цього бронювання. Можливо, воно належить іншій парковці.';
                        break;

                    case 404:
                        errorMessage = 'Бронювання не знайдено. Можливо, воно вже було видалено.';
                        setCancelDialogOpen(false);
                        await loadAllData();
                        break;

                    case 409:
                        errorMessage = 'Конфлікт даних. Спробуйте оновити сторінку.';
                        break;

                    case 500:
                        errorMessage = 'Помилка сервера. Спробуйте пізніше або зверніться до адміністратора.';
                        break;

                    case 503:
                        errorMessage = 'Сервіс тимчасово недоступний. Спробуйте через кілька хвилин.';
                        break;

                    default:
                        errorMessage = `Помилка ${status}. Спробуйте ще раз або зверніться до підтримки.`;
                }
            }

            setErrorPopup({ open: true, message: errorMessage, severity: 'error' });
        } finally {
            setActionLoading(false);
        }
    };

    // Navigate to spot details
    const handleSpotClick = (spot) => {
        navigate(`/operator/lots/${lotId}/spots/${spot.id}`);
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    if (!lot) {
        return (
            <Container sx={{ mt: 8, textAlign: 'center' }}>
                <Card sx={{
                    p: 6,
                    borderRadius: '16px',
                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
                    maxWidth: '500px',
                    mx: 'auto'
                }}>
                    <Typography variant="h5" sx={{ fontWeight: 600, color: '#111827', mb: 2 }}>
                        Не вдалося завантажити дані парковки
                    </Typography>
                    <Typography variant="body1" sx={{ color: '#6B7280', mb: 4 }}>
                        Можливо, виникла тимчасова проблема зі з'єднанням або парковка була видалена.
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
                        <Button
                            variant="contained"
                            onClick={() => loadAllData()}
                            sx={{
                                py: 1.5,
                                px: 4,
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
                            Спробувати знову
                        </Button>
                        <Button
                            variant="outlined"
                            onClick={() => navigate('/')}
                            sx={{
                                py: 1.5,
                                px: 4,
                                color: '#6B7280',
                                borderColor: '#E5E7EB',
                                fontWeight: 600,
                                fontSize: '1rem',
                                borderRadius: '12px',
                                textTransform: 'none',
                                '&:hover': {
                                    borderColor: '#D1D5DB',
                                    backgroundColor: '#F9FAFB',
                                }
                            }}
                        >
                            На головну
                        </Button>
                    </Box>
                </Card>
            </Container>
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

            <Container maxWidth="xl">
                {/* Header */}
                <Card sx={{ borderRadius: '16px', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)', mb: 4 }}>
                    <CardContent sx={{ p: 4 }}>
                        <Grid container spacing={3} alignItems="flex-start">
                            <Grid item xs={12} md={8}>
                                <Typography variant="h4" sx={{ fontWeight: 700, color: '#111827', mb: 1 }}>
                                    Панель оператора
                                </Typography>
                                <Typography variant="h6" sx={{ color: '#6B7280', mb: 1 }}>
                                    {lot.name}
                                </Typography>
                                <Typography variant="body1" sx={{ color: '#6B7280', mb: 2 }}>
                                    {lot.city}, {lot.street} {lot.building}
                                </Typography>
                                {lot.description && (
                                    <Typography variant="body2" sx={{ color: '#9CA3AF', fontStyle: 'italic' }}>
                                        {lot.description}
                                    </Typography>
                                )}
                            </Grid>
                            <Grid item xs={12} md={4}>
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                    <Box sx={{ p: 2, backgroundColor: '#F0FDF4', borderRadius: '12px', textAlign: 'center' }}>
                                        <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                                            Всього місць
                                        </Typography>
                                        <Typography variant="h4" sx={{ fontWeight: 700, color: '#10B981' }}>
                                            {totalSpots}
                                        </Typography>
                                    </Box>
                                    <Box sx={{ p: 2, backgroundColor: '#ECFDF5', borderRadius: '12px', textAlign: 'center' }}>
                                        <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                                            Вільно зараз
                                        </Typography>
                                        <Typography variant="h4" sx={{ fontWeight: 700, color: '#059669' }}>
                                            {freeSpots}
                                        </Typography>
                                    </Box>
                                </Box>
                            </Grid>
                        </Grid>
                    </CardContent>
                </Card>

                {/* Spots Section */}
                <Card sx={{ borderRadius: '16px', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)', mb: 4 }}>
                    <CardContent sx={{ p: 3 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                            <Typography variant="h5" sx={{ fontWeight: 600 }}>
                                Паркомісця
                            </Typography>
                            <Button
                                variant="contained"
                                onClick={() => setCreateDialogOpen(true)}
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
                                Додати місце
                            </Button>
                        </Box>

                        <Grid container spacing={2}>
                            {spots.map((spot) => {
                                // Get all confirmed bookings for this spot
                                const spotBookings = bookings.filter(b => {
                                    const bookingSpotId = typeof b.spot === 'object' ? b.spot.id : b.spot;
                                    return bookingSpotId === spot.id && b.status === 'confirmed';
                                });

                                const now = new Date();
                                const hasActiveBooking = spotBookings.some(b => {
                                    const startDate = new Date(b.start_at);
                                    const endDate = new Date(b.end_at);
                                    return startDate <= now && endDate > now;
                                });

                                const futureBookingsCount = spotBookings.filter(b => {
                                    const startDate = new Date(b.start_at);
                                    return startDate > now;
                                }).length;

                                // Log for spots with ID 3 or 14 (the occupied ones)
                                if (spot.id === 3 || spot.id === 14) {
                                    console.log(`=== SPOT ${spot.number} (ID: ${spot.id}) DEBUG ===`);
                                    console.log('All bookings for this spot:', spotBookings);
                                    console.log('Has active booking?', hasActiveBooking);
                                    console.log('Spot bookings times:', spotBookings.map(b => ({
                                        id: b.id,
                                        start: b.start_at,
                                        end: b.end_at,
                                        status: b.status,
                                        isActive: new Date(b.start_at) <= now && new Date(b.end_at) > now
                                    })));
                                    console.log('===================');
                                }

                                const statusConfig = hasActiveBooking
                                    ? {
                                        label: 'Зайнято',
                                        bgColor: '#EF4444',
                                        hoverColor: '#DC2626'
                                    }
                                    : {
                                        label: 'Вільно',
                                        bgColor: '#10B981',
                                        hoverColor: '#059669'
                                    };

                                return (
                                    <Grid item xs={6} sm={4} md={3} lg={2} key={spot.id}>
                                        <Button
                                            onClick={() => handleSpotClick(spot)}
                                            sx={{
                                                width: '100%',
                                                height: '120px',
                                                borderRadius: '12px',
                                                backgroundColor: statusConfig.bgColor,
                                                color: '#FFFFFF',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                justifyContent: 'center',
                                                alignItems: 'center',
                                                gap: 1,
                                                textTransform: 'none',
                                                transition: 'all 0.2s',
                                                '&:hover': {
                                                    backgroundColor: statusConfig.hoverColor,
                                                    transform: 'translateY(-4px)',
                                                    boxShadow: '0 8px 16px rgba(0, 0, 0, 0.2)',
                                                }
                                            }}
                                        >
                                            <Typography variant="h5" sx={{ fontWeight: 700, color: '#FFFFFF' }}>
                                                {spot.number}
                                            </Typography>

                                            {(spot.is_ev || spot.is_disabled) && (
                                                <Box sx={{ display: 'flex', gap: 0.5 }}>
                                                    {spot.is_ev && (
                                                        <Box sx={{
                                                            width: 24,
                                                            height: 24,
                                                            borderRadius: '50%',
                                                            backgroundColor: 'rgba(255, 255, 255, 0.3)',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            fontSize: '14px'
                                                        }}>
                                                            ⚡
                                                        </Box>
                                                    )}
                                                    {spot.is_disabled && (
                                                        <Box sx={{
                                                            width: 24,
                                                            height: 24,
                                                            borderRadius: '50%',
                                                            backgroundColor: 'rgba(255, 255, 255, 0.3)',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            fontSize: '14px'
                                                        }}>
                                                            ♿
                                                        </Box>
                                                    )}
                                                </Box>
                                            )}

                                            <Typography variant="caption" sx={{ fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.9)' }}>
                                                {statusConfig.label}
                                            </Typography>
                                        </Button>
                                    </Grid>
                                );
                            })}
                        </Grid>

                        {spots.length === 0 && (
                            <Box sx={{ textAlign: 'center', py: 6 }}>
                                <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
                                    Немає створених місць
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Додайте перше паркомісце щоб почати роботу
                                </Typography>
                            </Box>
                        )}
                    </CardContent>
                </Card>

                {/* Bookings Section */}
                <Card sx={{ borderRadius: '16px', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)' }}>
                    <CardContent sx={{ p: 3 }}>
                        <Typography variant="h5" sx={{ fontWeight: 600, mb: 3 }}>
                            Бронювання
                        </Typography>

                        <Tabs
                            value={bookingFilter}
                            onChange={(e, newValue) => setBookingFilter(newValue)}
                            sx={{
                                mb: 3,
                                '& .MuiTab-root': {
                                    textTransform: 'none',
                                    fontWeight: 600,
                                    minWidth: 120
                                }
                            }}
                        >
                            <Tab label={`Всі (${bookings.length})`} />
                            <Tab label={`Активні (${bookings.filter(b => b.status === 'confirmed' && new Date(b.end_at) > new Date()).length})`} />
                            <Tab label={`Скасовані (${bookings.filter(b => b.status === 'cancelled').length})`} />
                        </Tabs>

                        <Grid container spacing={2}>
                            {filteredBookings.map((booking) => {
                                const isActive = booking.status === 'confirmed' && new Date(booking.end_at) > new Date();
                                const statusConfig = booking.status === 'cancelled'
                                    ? { label: 'Скасовано', color: '#EF4444', bgColor: '#FEE2E2' }
                                    : isActive
                                        ? { label: 'Активне', color: '#10B981', bgColor: '#D1FAE5' }
                                        : { label: 'Завершено', color: '#6B7280', bgColor: '#F3F4F6' };

                                return (
                                    <Grid item xs={12} md={6} lg={4} key={booking.id}>
                                        <Card sx={{ borderRadius: '12px', border: `1px solid ${statusConfig.bgColor}` }}>
                                            <CardContent sx={{ p: 2.5 }}>
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                                                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                                                        ID: {booking.id}
                                                    </Typography>
                                                    <Chip
                                                        label={statusConfig.label}
                                                        size="small"
                                                        sx={{
                                                            backgroundColor: statusConfig.bgColor,
                                                            color: statusConfig.color,
                                                            fontWeight: 600,
                                                            fontSize: '0.75rem'
                                                        }}
                                                    />
                                                </Box>

                                                <Box sx={{ mb: 1.5 }}>
                                                    <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                                                        Користувач
                                                    </Typography>
                                                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                                        {booking.user_email || 'N/A'}
                                                    </Typography>
                                                </Box>

                                                <Box sx={{ mb: 1.5 }}>
                                                    <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                                                        Місце
                                                    </Typography>
                                                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                                        {booking.spot_number}
                                                    </Typography>
                                                </Box>

                                                <Box sx={{ mb: 1.5 }}>
                                                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                                                        {new Date(booking.start_at).toLocaleString('uk-UA', {
                                                            day: '2-digit',
                                                            month: '2-digit',
                                                            hour: '2-digit',
                                                            minute: '2-digit'
                                                        })}
                                                        {' → '}
                                                        {new Date(booking.end_at).toLocaleString('uk-UA', {
                                                            day: '2-digit',
                                                            month: '2-digit',
                                                            hour: '2-digit',
                                                            minute: '2-digit'
                                                        })}
                                                    </Typography>
                                                </Box>

                                                {booking.cancellation_reason && (
                                                    <Box sx={{ p: 1.5, backgroundColor: '#FEE2E2', borderRadius: '8px', mb: 2 }}>
                                                        <Typography variant="caption" sx={{ color: '#991B1B', display: 'block', fontWeight: 500, mb: 0.5 }}>
                                                            Причина скасування:
                                                        </Typography>
                                                        <Typography variant="body2" sx={{ fontSize: '0.8rem', color: '#DC2626' }}>
                                                            {booking.cancellation_reason}
                                                        </Typography>
                                                    </Box>
                                                )}

                                                {isActive && (
                                                    <Button
                                                        variant="outlined"
                                                        fullWidth
                                                        size="small"
                                                        onClick={() => openCancelDialog(booking)}
                                                        sx={{
                                                            mt: 1,
                                                            py: 1,
                                                            color: '#EF4444',
                                                            borderColor: '#EF4444',
                                                            borderRadius: '12px',
                                                            textTransform: 'none',
                                                            fontWeight: 600,
                                                            '&:hover': {
                                                                borderColor: '#DC2626',
                                                                backgroundColor: '#FEF2F2',
                                                            }
                                                        }}
                                                    >
                                                        Скасувати
                                                    </Button>
                                                )}
                                            </CardContent>
                                        </Card>
                                    </Grid>
                                );
                            })}
                        </Grid>

                        {filteredBookings.length === 0 && (
                            <Box sx={{ textAlign: 'center', py: 6 }}>
                                <Typography variant="body1" color="text.secondary">
                                    Немає бронювань у цій категорії
                                </Typography>
                            </Box>
                        )}
                    </CardContent>
                </Card>
            </Container>

            {/* Dialogs */}

            {/* Create Spot Dialog */}
            <Dialog open={createDialogOpen} onClose={() => !actionLoading && setCreateDialogOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ fontWeight: 600 }}>Створити нове місце</DialogTitle>
                <DialogContent>
                    <TextField
                        label="Номер місця"
                        fullWidth
                        value={newSpot.number}
                        onChange={(e) => setNewSpot({ ...newSpot, number: e.target.value })}
                        sx={{
                            mt: 2,
                            mb: 2,
                            '& .MuiOutlinedInput-root': {
                                borderRadius: '12px',
                            }
                        }}
                        disabled={actionLoading}
                        placeholder="Наприклад: P1, A10, B25"
                    />
                    <FormControlLabel
                        control={
                            <Checkbox
                                checked={newSpot.is_ev}
                                onChange={(e) => setNewSpot({ ...newSpot, is_ev: e.target.checked })}
                                disabled={actionLoading}
                            />
                        }
                        label={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <span style={{ fontSize: '16px' }}>⚡</span>
                                <span>З зарядкою для електромобілів</span>
                            </Box>
                        }
                    />
                    <FormControlLabel
                        control={
                            <Checkbox
                                checked={newSpot.is_disabled}
                                onChange={(e) => setNewSpot({ ...newSpot, is_disabled: e.target.checked })}
                                disabled={actionLoading}
                            />
                        }
                        label={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <span style={{ fontSize: '16px' }}>♿</span>
                                <span>Для осіб з інвалідністю</span>
                            </Box>
                        }
                    />
                </DialogContent>
                <DialogActions sx={{ p: 3 }}>
                    <Button onClick={() => setCreateDialogOpen(false)} disabled={actionLoading}>
                        Скасувати
                    </Button>
                    <Button
                        variant="contained"
                        onClick={handleCreateSpot}
                        disabled={actionLoading}
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
                        {actionLoading ? <CircularProgress size={24} sx={{ color: '#FFF' }} /> : 'Створити'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Cancel Booking Dialog */}
            <Dialog open={cancelDialogOpen} onClose={() => !actionLoading && setCancelDialogOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ fontWeight: 600 }}>Скасувати бронювання</DialogTitle>
                <DialogContent>
                    <Typography gutterBottom>
                        Скасувати бронювання ID: {bookingToCancel?.id}?
                    </Typography>
                    <TextField
                        label="Причина скасування"
                        multiline
                        rows={3}
                        fullWidth
                        value={cancelReason}
                        onChange={(e) => setCancelReason(e.target.value)}
                        sx={{
                            mt: 2,
                            '& .MuiOutlinedInput-root': {
                                borderRadius: '12px',
                            }
                        }}
                        disabled={actionLoading}
                        required
                        placeholder="Обов'язково вкажіть причину скасування"
                    />
                </DialogContent>
                <DialogActions sx={{ p: 3 }}>
                    <Button onClick={() => setCancelDialogOpen(false)} disabled={actionLoading}>
                        Відмінити
                    </Button>
                    <Button
                        variant="contained"
                        onClick={handleCancelBooking}
                        disabled={actionLoading}
                        sx={{
                            py: 1.5,
                            background: '#EF4444',
                            color: '#FFFFFF',
                            fontWeight: 600,
                            fontSize: '1rem',
                            borderRadius: '12px',
                            textTransform: 'none',
                            '&:hover': {
                                background: '#DC2626',
                            }
                        }}
                    >
                        {actionLoading ? <CircularProgress size={24} sx={{ color: '#FFF' }} /> : 'Підтвердити'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}

export default OperatorPage;