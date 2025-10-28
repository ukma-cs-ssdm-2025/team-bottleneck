import React, { useState, useEffect, useCallback } from 'react';
import {
    Typography, Container, Alert, Box, Card, CardContent,
    Button, CircularProgress, Grid, Dialog, DialogTitle,
    DialogContent, DialogActions, TextField, Divider, IconButton
} from '@mui/material';
import { useAuth } from '../context/AuthContext';
import {
    fetchLotBookings,
    cancelBookingByOperator,
    fetchLotDetails,
    deleteSpot
} from '../api/operatorAPI';
import { useNavigate } from 'react-router-dom';

const MAX_BOOKINGS_PREVIEW = 3;

const BookingItem = ({ booking, onCancel }) => {
    const isConfirmed = booking.status === 'confirmed';

    const endTime = new Date(booking.end_at);
    const now = new Date();

    const isUpcomingOrActive = endTime.getTime() > now.getTime();
    const isCurrentlyActive = new Date(booking.start_at).getTime() <= now.getTime() && isUpcomingOrActive;

    const canCancel = isConfirmed && isUpcomingOrActive;

    const statusColor = isConfirmed ? (isCurrentlyActive ? 'info.main' : (isUpcomingOrActive ? 'success.main' : 'warning.main')) : 'error.main';
    const statusText = isConfirmed ? (isCurrentlyActive ? 'АКТИВНЕ ЗАРАЗ' : (isUpcomingOrActive ? 'МАЙБУТНЄ' : 'ЗАВЕРШЕНЕ')) : 'СКАСОВАНО';

    return (
        <Box sx={{ p: 1, borderLeft: `3px solid ${statusColor}`, mb: 1, borderRadius: 1, backgroundColor: isConfirmed && isUpcomingOrActive ? '#e8f5e9' : '#f9f9f9' }}>
            <Grid container spacing={1} alignItems="center">
                <Grid item xs={12} sm={6}>
                    <Typography variant="body2">
                        <strong>ID {booking.id}</strong> | Користувач: {booking.user?.username || 'Гість'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                        {new Date(booking.start_at).toLocaleString()} – {new Date(booking.end_at).toLocaleString()}
                    </Typography>
                </Grid>
                <Grid item xs={12} sm={3}>
                    <Typography variant="body2" sx={{ color: statusColor, fontWeight: 'bold' }}>
                        {statusText}
                    </Typography>
                </Grid>
                <Grid item xs={12} sm={3} sx={{ textAlign: 'right' }}>
                    {canCancel && (
                        <Button
                            variant="outlined"
                            color="error"
                            size="small"
                            onClick={() => onCancel(booking)}
                        >
                            Скасувати
                        </Button>
                    )}
                </Grid>
            </Grid>
        </Box>
    );
};

const SpotCard = ({ spot, lotId, bookings, onCancelBooking, onDeleteSpot, isDeleting, navigate }) => {
    const nowTimestamp = new Date().getTime();

    const allBookingsForSpot = bookings
        .filter(b => b.spot === spot.id)
        .sort((a, b) => new Date(a.start_at).getTime() - new Date(b.start_at).getTime());

    const activeAndFutureBookings = allBookingsForSpot
        .filter(b => b.status === 'confirmed' && new Date(b.end_at).getTime() > nowTimestamp);

    const hasConfirmedFutureBookings = activeAndFutureBookings.length > 0;

    const bookingsToShow = activeAndFutureBookings.slice(0, MAX_BOOKINGS_PREVIEW);
    const hiddenBookingsCount = activeAndFutureBookings.length - bookingsToShow.length;

    const handleNavigateToDetails = () => {
        navigate(`/operator/lots/${lotId}/spots/${spot.id}`);
    };

    return (
        <Card variant="outlined" sx={{ mb: 3, boxShadow: 6 }}>
            <CardContent>
                <Grid container spacing={2}>
                    {/* Left Column: Spot Info and Controls */}
                    <Grid item xs={12} md={4}>
                        <Box sx={{ p: 2, borderRight: {md: '1px solid #eee'} }}>
                            <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                                Місце #{spot.number}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                ID: {spot.id}
                            </Typography>
                            <Box sx={{ mb: 2 }}>
                                {spot.is_ev && <span style={{ marginRight: 8, color: '#3f51b5' }}>⚡ EV</span>}
                                {spot.is_disabled && <span style={{ marginRight: 8, color: '#ff9800' }}>♿ Disabled</span>}
                            </Box>

                            <Divider sx={{ my: 1 }} />
                            <Button
                                variant="outlined"
                                color="error"
                                fullWidth
                                size="small"
                                onClick={() => onDeleteSpot(spot.id, lotId)}
                                disabled={isDeleting || hasConfirmedFutureBookings}
                                sx={{ mt: 1 }}
                            >
                                {isDeleting ? 'Видалення...' : (hasConfirmedFutureBookings ? 'Видалити (БРОНЬ)' : 'Видалити паркомісце')}
                            </Button>
                        </Box>
                    </Grid>

                    {/* Right Column: Active/Future Bookings */}
                    <Grid item xs={12} md={8}>
                        <Box display="flex" justifyContent="space-between" alignItems="center">
                            <Typography variant="h6" sx={{ mb: 1 }}>
                                Активні та Майбутні Бронювання ({activeAndFutureBookings.length})
                            </Typography>
                            <Button
                                onClick={handleNavigateToDetails}
                                size="small"
                                color="primary"
                                variant="text"
                                sx={{ whiteSpace: 'nowrap' }}
                            >
                                Деталі &rarr;
                            </Button>
                        </Box>

                        <Box sx={{ maxHeight: 200, overflowY: 'auto', pr: 1 }}>
                            {bookingsToShow.map(b => (
                                <BookingItem key={b.id} booking={b} onCancel={onCancelBooking} />
                            ))}
                        </Box>

                        {hiddenBookingsCount > 0 && (
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 1, fontWeight: 'bold' }}>
                                + {hiddenBookingsCount} додаткових майбутніх бронювань
                            </Typography>
                        )}

                        {allBookingsForSpot.length === 0 && (
                            <Alert severity="info" size="small" sx={{ mt: 1 }}>Бронювань на це місце немає.</Alert>
                        )}

                        {(hiddenBookingsCount > 0 || allBookingsForSpot.length > 0) && (
                            <Button
                                variant="text"
                                size="small"
                                color="primary"
                                onClick={handleNavigateToDetails}
                                sx={{ mt: 1 }}
                            >
                                Переглянути всі бронювання та історію
                            </Button>
                        )}
                    </Grid>
                </Grid>
            </CardContent>
        </Card>
    );
};

function OperatorPage() {
    const { user, loading } = useAuth();
    const navigate = useNavigate();
    const [bookings, setBookings] = useState([]);
    const [lotDetails, setLotDetails] = useState(null);
    const [loadingData, setLoadingData] = useState(false);
    const [error, setError] = useState(null);

    const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
    const [bookingToCancel, setBookingToCancel] = useState(null);
    const [cancelReason, setCancelReason] = useState('');
    const [isCancelling, setIsCancelling] = useState(false);
    const [cancelReasonError, setCancelReasonError] = useState(null);
    const [isDeletingSpot, setIsDeletingSpot] = useState(false);

    const lotId = user?.lot_id;
    const isOperator = user?.is_operator;
    const spots = lotDetails?.spots || [];

    const loadData = useCallback(async () => {
        if (!lotId) return;

        setError(null);
        setLoadingData(true);
        try {
            const lotData = await fetchLotDetails(lotId);
            setLotDetails(lotData);

            const bookingsData = await fetchLotBookings();
            setBookings(bookingsData);

        } catch (err) {
            const detail = err.response?.data?.detail || 'Не вдалося завантажити дані керування парковкою. Перевірте підключення або права доступу.';
            setError(detail);
            setBookings([]);
            setLotDetails(null);
        } finally {
            setLoadingData(false);
        }
    }, [lotId]);

    useEffect(() => {
        if (!loading && isOperator && lotId) {
            loadData();
        }
    }, [loading, isOperator, lotId, loadData]);

    const handleOpenCancelDialog = (booking) => {
        setBookingToCancel(booking);
        setCancelReason('');
        setCancelReasonError(null);
        setIsCancelDialogOpen(true);
    };

    const handleCancelSubmit = async () => {
        if (!bookingToCancel) return;

        if (!cancelReason.trim()) {
            setCancelReasonError('Причина скасування є обов\'язковою.');
            return;
        }
        setCancelReasonError(null);

        setIsCancelling(true);
        setError(null);

        try {
            await cancelBookingByOperator(bookingToCancel.id, cancelReason);
            setIsCancelDialogOpen(false);
            setBookingToCancel(null);
            await loadData();
        } catch (err) {
            setError('Помилка скасування: ' + (err.response?.data?.detail || 'Невідома помилка.'));
        } finally {
            setIsCancelling(false);
        }
    };

    const handleDeleteSpot = async (spotId, currentLotId) => {
        const confirmDelete = window.confirm(`Ви впевнені, що хочете видалити паркомісце #${spotId}? Ця дія незворотна.`);
        if (!confirmDelete) return;

        setIsDeletingSpot(true);
        setError(null);

        try {
            await deleteSpot(currentLotId, spotId);
            await loadData();
        } catch (err) {
            const detail = err.response?.data?.detail || 'Не вдалося видалити паркомісце. Перевірте, чи немає активних бронювань або історії.';
            setError(detail);
        } finally {
            setIsDeletingSpot(false);
        }
    };

    const handleCreateSpotClick = () => {
        navigate(`/operator/lots/${lotId}/spots/create`);
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 5 }}>
                <CircularProgress />
                <Typography sx={{ ml: 2 }}>Завантаження даних...</Typography>
            </Box>
        );
    }

    if (!user || !isOperator || !lotId) {
        return (
            <Container sx={{ mt: 4 }}>
                <Alert severity="error">У вас немає прав доступу до цієї сторінки. Необхідно мати статус оператора та бути закріпленим за лотом.</Alert>
            </Container>
        );
    }


    return (
        <Container sx={{ mt: 4, mb: 4 }}>
            <Typography variant="h4" gutterBottom>
                Панель Керування Парковкою
            </Typography>

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            {/* Lot Info and Control Block */}
            <Card variant="outlined" sx={{ mb: 4, p: 3 }}>
                <Grid container spacing={3} alignItems="center">
                    <Grid item xs={12} md={7}>
                        <Typography variant="h5" gutterBottom>
                            Обслуговування лоту: <strong>{lotDetails?.name || `ID ${lotId}`}</strong>
                        </Typography>
                        <Typography variant="body1">
                            ID Лоту: {lotId}
                        </Typography>
                        {lotDetails && (
                            <Typography variant="body2" color="text.secondary">
                                Адреса: {lotDetails.city}, {lotDetails.street} {lotDetails.building || ''}
                            </Typography>
                        )}
                    </Grid>
                    <Grid item xs={12} md={5} sx={{ textAlign: {md: 'right', xs: 'left'} }}>
                        <Button
                            variant="contained"
                            color="success"
                            onClick={handleCreateSpotClick}
                            sx={{ mr: 2, mb: {xs: 1, md: 0} }}
                        >
                            + Створити Паркомісце
                        </Button>
                        <Button variant="outlined" onClick={loadData} disabled={loadingData}>
                            {loadingData ? 'Оновлення...' : 'Оновити дані'}
                        </Button>
                    </Grid>
                </Grid>
            </Card>

            <Typography variant="h4" gutterBottom sx={{ mt: 4 }}>
                Керування Паркомісцями ({spots.length})
            </Typography>

            {loadingData && lotDetails === null ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 5 }}>
                    <CircularProgress />
                </Box>
            ) : spots.length === 0 ? (
                <Alert severity="info">На вашому лоті немає зареєстрованих паркомісць.</Alert>
            ) : (
                <Grid container spacing={3}>
                    {/* Display for each spot card */}
                    {spots.map((spot) => (
                        <Grid item key={spot.id} xs={12}>
                            <SpotCard
                                spot={spot}
                                lotId={lotId}
                                bookings={bookings}
                                onCancelBooking={handleOpenCancelDialog}
                                onDeleteSpot={handleDeleteSpot}
                                isDeleting={isDeletingSpot}
                                navigate={navigate}
                            />
                        </Grid>
                    ))}
                </Grid>
            )}

            {/* Cancellation Dialog */}
            <Dialog open={isCancelDialogOpen} onClose={() => setIsCancelDialogOpen(false)}>
                <DialogTitle>Скасувати Бронювання #{bookingToCancel?.id}</DialogTitle>
                <DialogContent>
                    <Typography gutterBottom>
                        Скасування бронювання призведе до автоматичного повернення коштів (mock).
                    </Typography>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="Причина скасування (обов'язково)"
                        type="text"
                        fullWidth
                        variant="outlined"
                        value={cancelReason}
                        onChange={(e) => setCancelReason(e.target.value)}
                        disabled={isCancelling}
                        error={!!cancelReasonError}
                        helperText={cancelReasonError}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setIsCancelDialogOpen(false)} disabled={isCancelling}>
                        Ні
                    </Button>
                    <Button onClick={handleCancelSubmit} color="error" variant="contained" disabled={isCancelling || !cancelReason.trim()}>
                        {isCancelling ? 'Скасування...' : 'Так, скасувати'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
}

export default OperatorPage;