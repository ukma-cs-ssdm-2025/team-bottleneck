import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import {
    Typography, Container, Alert, Box, Card, CardContent,
    Button, CircularProgress, Grid, Dialog, DialogTitle,
    DialogContent, DialogActions, TextField, Divider
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    fetchLotBookings,
    cancelBookingByOperator,
    fetchLotDetails,
    deleteSpot
} from '../api/operatorAPI';


const MAX_BOOKINGS_PREVIEW = 3;


const CANCEL_REASON_REQUIRED_MSG = 'Причина скасування є обов\'язковою.';
const DELETE_SPOT_CONFIRM_MSG = (spotId) => `Ви впевнені, що хочете видалити паркомісце #${spotId}? Ця дія незворотна.`;


const getBookingStatusKey = (booking) => {
    const now = new Date().getTime();
    const startTime = new Date(booking.start_at).getTime();
    const endTime = new Date(booking.end_at).getTime();

    if (booking.status !== 'confirmed') return 'CANCELLED';
    if (startTime <= now && endTime > now) return 'ACTIVE';
    if (startTime > now) return 'UPCOMING';
    return 'COMPLETED';
};

const STATUS_PROPERTIES = {
    CANCELLED: { text: 'СКАСОВАНО', color: 'error.main', bgColor: '#f9f9f9', canCancel: false },
    ACTIVE: { text: 'АКТИВНЕ ЗАРАЗ', color: 'info.main', bgColor: '#e8f5e9', canCancel: true },
    UPCOMING: { text: 'МАЙБУТНЄ', color: 'success.main', bgColor: '#e8f5e9', canCancel: true },
    COMPLETED: { text: 'ЗАВЕРШENE', color: 'warning.main', bgColor: '#f9f9f9', canCancel: false },
    DEFAULT: { text: 'НЕВІДОМО', color: 'grey.500', bgColor: '#f9f9f9', canCancel: false }
};

const BookingPropType = PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    status: PropTypes.string.isRequired,
    start_at: PropTypes.string.isRequired,
    end_at: PropTypes.string.isRequired,
    user: PropTypes.shape({ username: PropTypes.string })
});

const SpotPropType = PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    number: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    is_ev: PropTypes.bool,
    is_disabled: PropTypes.bool
});

const BookingItem = ({ booking, onCancel }) => {
    const statusKey = getBookingStatusKey(booking);
    const { text: statusText, color: statusColor, bgColor, canCancel } = STATUS_PROPERTIES[statusKey] || STATUS_PROPERTIES.DEFAULT;

    return (
        <Box sx={{ p: 1, borderLeft: `3px solid ${statusColor}`, mb: 1, borderRadius: 1, backgroundColor: bgColor }}>
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
                    <Typography variant="body2" sx={{ color: statusColor, fontWeight: 'bold' }}>{statusText}</Typography>
                </Grid>
                <Grid item xs={12} sm={3} sx={{ textAlign: 'right' }}>
                    {canCancel && (
                        <Button variant="outlined" color="error" size="small" onClick={() => onCancel(booking)}>
                            Скасувати
                        </Button>
                    )}
                </Grid>
            </Grid>
        </Box>
    );
};

BookingItem.propTypes = {
    booking: BookingPropType.isRequired,
    onCancel: PropTypes.func.isRequired
};


const SpotCard = ({ spot, lotId, bookings, onCancelBooking, onDeleteSpot, isDeleting }) => {
    const navigate = useNavigate();
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
                    <Grid item xs={12} md={4}>
                        <Box sx={{ p: 2, borderRight: { md: '1px solid #eee' } }}>
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
                                onClick={() => onDeleteSpot(spot.id)}
                                disabled={isDeleting || hasConfirmedFutureBookings}
                                sx={{ mt: 1 }}
                            >
                                {isDeleting ? 'Видалення...' : (hasConfirmedFutureBookings ? 'Видалити (БРОНЬ)' : 'Видалити паркомісце')}
                            </Button>
                        </Box>
                    </Grid>

                    <Grid item xs={12} md={8}>
                        <Box display="flex" justifyContent="space-between" alignItems="center">
                            <Typography variant="h6" sx={{ mb: 1 }}>
                                Активні та Майбутні ({activeAndFutureBookings.length})
                            </Typography>
                            <Button onClick={handleNavigateToDetails} size="small" color="primary" variant="text" sx={{ whiteSpace: 'nowrap' }}>
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
                            <Button variant="text" size="small" color="primary" onClick={handleNavigateToDetails} sx={{ mt: 1 }}>
                                Переглянути всі бронювання та історію
                            </Button>
                        )}
                    </Grid>
                </Grid>
            </CardContent>
        </Card>
    );
};

SpotCard.propTypes = {
    spot: SpotPropType.isRequired,
    lotId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    bookings: PropTypes.arrayOf(BookingPropType).isRequired,
    onCancelBooking: PropTypes.func.isRequired,
    onDeleteSpot: PropTypes.func.isRequired,
    isDeleting: PropTypes.bool.isRequired
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
            const [lotData, bookingsData] = await Promise.all([
                fetchLotDetails(lotId),
                fetchLotBookings()
            ]);
            setLotDetails(lotData);
            setBookings(bookingsData);
        } catch (err) {
            console.error('Error loading operator data:', err);
            if (err.response && err.response.status === 403) {
                setError('У вас немає доступу до цієї панелі. Зверніться до адміністратора.');
            } else if (err.response && err.response.status === 404) {
                setError('Парковку не знайдено. Можливо, її було видалено.');
            } else if (err.response && err.response.status === 500) {
                setError('Сервер тимчасово недоступний. Спробуйте оновити сторінку пізніше.');
            } else if (err.request) {
                setError('Не вдалося з\'єднатися з сервером. Перевірте ваше інтернет-з\'єднання.');
            } else {
                setError('Не вдалося завантажити дані. Спробуйте оновити сторінку.');
            }
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
            setCancelReasonError(CANCEL_REASON_REQUIRED_MSG);
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

    const handleDeleteSpot = async (spotId) => {
        const confirmDelete = window.confirm(DELETE_SPOT_CONFIRM_MSG(spotId));
        if (!confirmDelete) return;

        setIsDeletingSpot(true);
        setError(null);

        try {
            await deleteSpot(lotId, spotId);
            await loadData();
        } catch (err) {
            const detail = err.response?.data?.detail || 'Не вдалося видалити паркомісце.';
            setError(detail);
        } finally {
            setIsDeletingSpot(false);
        }
    };

    const handleCreateSpotClick = () => {
        navigate(`/operator/lots/${lotId}/spots/create`);
    };

    const renderSpotsContent = () => {
        if (loadingData && lotDetails === null) {
            return (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 5 }}>
                    <CircularProgress />
                </Box>
            );
        }
        if (spots.length === 0) {
            return (
                <Alert severity="info">На вашому лоті немає зареєстрованих паркомісць.</Alert>
            );
        }
        return (
            <Grid container spacing={3}>
                {spots.map((spot) => (
                    <Grid item key={spot.id} xs={12}>
                        <SpotCard
                            spot={spot}
                            lotId={lotId}
                            bookings={bookings}
                            onCancelBooking={handleOpenCancelDialog}
                            onDeleteSpot={handleDeleteSpot}
                            isDeleting={isDeletingSpot}
                        />
                    </Grid>
                ))}
            </Grid>
        );
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
                <Alert severity="error">У вас немає прав доступу до цієї сторінки.</Alert>
            </Container>
        );
    }

    return (
        <Container sx={{ mt: 4, mb: 4 }}>
            <Typography variant="h4" gutterBottom>
                Панель Керування Парковкою
            </Typography>

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            <Card variant="outlined" sx={{ mb: 4, p: 3 }}>
                <Grid container spacing={3} alignItems="center">
                    <Grid item xs={12} md={7}>
                        <Typography variant="h5" gutterBottom>
                            Обслуговування лоту: <strong>{lotDetails?.name || `ID ${lotId}`}</strong>
                        </Typography>
                        <Typography variant="body1">ID Лоту: {lotId}</Typography>
                        {lotDetails && (
                            <Typography variant="body2" color="text.secondary">
                                Адреса: {lotDetails.city}, {lotDetails.street} {lotDetails.building || ''}
                            </Typography>
                        )}
                    </Grid>
                    <Grid item xs={12} md={5} sx={{ textAlign: { md: 'right', xs: 'left' } }}>
                        <Button
                            variant="contained"
                            color="success"
                            onClick={handleCreateSpotClick}
                            sx={{ mr: 2, mb: { xs: 1, md: 0 } }}
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

            {renderSpotsContent()}

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