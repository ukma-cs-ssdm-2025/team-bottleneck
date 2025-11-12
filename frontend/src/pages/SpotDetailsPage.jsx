import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Typography, Container, Button, CircularProgress, Alert,
    Box, Card, CardContent, Grid, Switch, FormControlLabel,
    Dialog, DialogTitle, DialogContent, DialogActions, TextField
} from '@mui/material';
import { useAuth } from '../context/AuthContext';
import {
    fetchLotBookings,
    fetchSpotDetails,
    cancelBookingByOperator,
    updateSpot,
    deleteSpot
} from '../api/operatorAPI';

const getSpotBookingStatus = (booking) => {
    if (booking.status !== 'confirmed') {
        return 'CANCELLED';
    }
    if (new Date(booking.end_at).getTime() > Date.now()) {
        return 'UPCOMING';
    }
    return 'COMPLETED';
};

const STATUS_PROPS = {
    UPCOMING: { text: 'МАЙБУТНЄ', color: 'success.main', bgColor: '#e8f5e9' },
    COMPLETED: { text: 'ЗАВЕРШEНE', color: 'warning.main', bgColor: '#fff3e0' },
    CANCELLED: { text: 'СКАСОВАНО', color: 'error.main', bgColor: '#ffebee' },
};

const SpotBookingHistoryItem = ({ booking, onCancel }) => {
    const statusKey = getSpotBookingStatus(booking);
    const { text, color, bgColor } = STATUS_PROPS[statusKey];
    const canCancel = statusKey === 'UPCOMING';
    const userText = `Користувач ID: ${booking.user}`;

    return (
        <Card variant="outlined" sx={{ mb: 2, borderLeft: `5px solid ${color}`, backgroundColor: bgColor }}>
            <CardContent sx={{ p: 2 }}>
                <Grid container spacing={1} alignItems="center">
                    <Grid item xs={12} sm={8}>
                        <Typography variant="body1">
                            <strong>{userText}</strong> ({text})
                        </Typography>
                        <Typography variant="caption" display="block">
                            З: {new Date(booking.start_at).toLocaleString()} | До: {new Date(booking.end_at).toLocaleString()}
                        </Typography>
                        {booking.cancellation_reason && (
                            <Typography variant="caption" color="error" sx={{ display: 'block' }}>
                                Причина скасування: {booking.cancellation_reason}
                            </Typography>
                        )}
                    </Grid>
                    <Grid item xs={12} sm={4} sx={{ textAlign: 'right' }}>
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
            </CardContent>
        </Card>
    );
};

const BookingPropType = PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    status: PropTypes.string.isRequired,
    start_at: PropTypes.string.isRequired,
    end_at: PropTypes.string.isRequired,
    cancellation_reason: PropTypes.string,
    user: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.object]),
});

SpotBookingHistoryItem.propTypes = {
    booking: BookingPropType.isRequired,
    onCancel: PropTypes.func.isRequired
};


function SpotDetailsPage() {
    const { lotId, spotId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();

    const [spot, setSpot] = useState(null);
    const [allBookings, setAllBookings] = useState([]);
    const [loadingData, setLoadingData] = useState(true);
    const [error, setError] = useState(null);

    const [isDeleting, setIsDeleting] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);
    const [updateStatus, setUpdateStatus] = useState(null);

    const [spotForm, setSpotForm] = useState({
        is_ev: false,
        is_disabled: false,
    });

    const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
    const [bookingToCancel, setBookingToCancel] = useState(null);
    const [cancelReason, setCancelReason] = useState('');
    const [isCancelling, setIsCancelling] = useState(false);

    const spotBookings = allBookings.filter(b => b.spot === Number.parseInt(spotId, 10));
    const hasConfirmedFutureBookings = spotBookings.some(
        b => b.status === 'confirmed' && new Date(b.end_at).getTime() > Date.now()
    );

    const loadData = useCallback(async () => {
        setError(null);
        setLoadingData(true);
        try {
            const [spotData, bookingsData] = await Promise.all([
                fetchSpotDetails(lotId, spotId),
                fetchLotBookings()
            ]);

            setSpot(spotData);
            setSpotForm({
                is_ev: spotData.is_ev,
                is_disabled: spotData.is_disabled,
            });
            setAllBookings(bookingsData);

        } catch (err) {
            console.error('Error loading spot details:', err);
            if (err.response && err.response.status === 404) {
                setError('Паркомісце не знайдено.');
            } else if (err.response && err.response.status === 403) {
                setError('У вас немає доступу до цього паркомісця.');
            } else if (err.response && err.response.status === 500) {
                setError('Сервер тимчасово недоступний. Спробуйте пізніше.');
            } else if (err.request) {
                setError('Не вдалося з\'єднатися з сервером. Перевірте інтернет-з\'єднання.');
            } else {
                setError('Не вдалося завантажити деталі місця або бронювання.');
            }
        } finally {
            setLoadingData(false);
        }
    }, [lotId, spotId]);

    useEffect(() => {
        if (user?.is_operator && user?.lot_id === Number.parseInt(lotId, 10)) {
            loadData();
        }
    }, [user, lotId, loadData]);

    const handleFormChange = (e) => {
        const { name, checked, type } = e.target;
        setSpotForm(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : e.target.value,
        }));
    };

    const handleUpdateSpot = async () => {
        setIsUpdating(true);
        setUpdateStatus(null);
        setError(null);
        try {
            const updatedSpotData = await updateSpot(lotId, spotId, spotForm);
            setSpot(updatedSpotData);
            setSpotForm({
                is_ev: updatedSpotData.is_ev,
                is_disabled: updatedSpotData.is_disabled,
            });
            setUpdateStatus('success');
        } catch (err) {
            setUpdateStatus('error');
            console.error("Update failed:", err);
            if (err.response && err.response.status === 400) {
                setError('Некоректні дані. Перевірте введену інформацію.');
            } else if (err.response && err.response.status === 404) {
                setError('Паркомісце не знайдено.');
            } else if (err.response && err.response.status === 500) {
                setError('Сервер тимчасово недоступний. Спробуйте пізніше.');
            } else if (err.request) {
                setError('Не вдалося з\'єднатися з сервером.');
            } else {
                setError('Не вдалося оновити паркомісце.');
            }
        } finally {
            setIsUpdating(false);
            setTimeout(() => setUpdateStatus(null), 3000);
        }
    };

    const handleDeleteSpot = async () => {
        const confirmDelete = window.confirm(`Ви впевнені, що хочете видалити паркомісце #${spot?.number}?`);
        if (!confirmDelete) return;

        setIsDeleting(true);
        setError(null);

        try {
            await deleteSpot(lotId, spotId);
            navigate('/operator', { state: { successMessage: `Місце #${spot.number} видалено.` } });
        } catch (err) {
            console.error('Delete error:', err);
            if (err.response && err.response.status === 400) {
                const detail = err.response?.data?.detail || 'Не вдалося видалити паркомісце.';
                setError(detail);
            } else if (err.response && err.response.status === 403) {
                setError('У вас немає доступу до видалення цього паркомісця.');
            } else if (err.response && err.response.status === 404) {
                setError('Паркомісце не знайдено.');
            } else if (err.response && err.response.status === 500) {
                setError('Сервер тимчасово недоступний. Спробуйте пізніше.');
            } else if (err.request) {
                setError('Не вдалося з\'єднатися з сервером. Перевірте інтернет-з\'єднання.');
            } else {
                setError('Помилка при видаленні паркомісця.');
            }
        } finally {
            setIsDeleting(false);
        }
    };

    const openCancelDialog = (booking) => {
        setBookingToCancel(booking);
        setCancelReason('');
        setError(null);
        setIsCancelDialogOpen(true);
    };

    const closeCancelDialog = () => {
        if (isCancelling) return;
        setIsCancelDialogOpen(false);
        setBookingToCancel(null);
        setCancelReason('');
    };

    const handleCancelSubmit = async () => {
        if (!bookingToCancel) return;

        setIsCancelling(true);
        setError(null);

        try {
            await cancelBookingByOperator(bookingToCancel.id, cancelReason);
            closeCancelDialog();
            await loadData();
        } catch (err) {
            console.error('Cancel error:', err);
            if (err.response && err.response.status === 400) {
                setError('Це бронювання вже скасовано або не може бути скасовано.');
            } else if (err.response && err.response.status === 404) {
                setError('Бронювання не знайдено.');
            } else if (err.response && err.response.status === 403) {
                setError('У вас немає доступу до цього бронювання.');
            } else if (err.response && err.response.status === 500) {
                setError('Сервер тимчасово недоступний. Спробуйте пізніше.');
            } else if (err.request) {
                setError('Не вдалося з\'єднатися з сервером. Перевірте інтернет-з\'єднання.');
            } else {
                setError('Помилка скасування: ' + (err.response?.data?.detail || 'Спробуйте ще раз.'));
            }
        } finally {
            setIsCancelling(false);
        }
    };


    if (loadingData || !user) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 5 }}>
                <CircularProgress />
            </Box>
        );
    }

    if (error && !spot) {
        return (
            <Container sx={{ mt: 4 }}>
                <Alert severity="error">{error}</Alert>
                <Button onClick={() => navigate('/operator')} sx={{ mt: 2 }} variant="outlined">Назад до Панелі</Button>
            </Container>
        );
    }

    const sortedBookings = spotBookings.sort((a, b) => new Date(b.start_at).getTime() - new Date(a.start_at).getTime());

    return (
        <Container sx={{ mt: 4, mb: 4 }}>
            <Button onClick={() => navigate('/operator')} sx={{ mb: 3 }} variant="outlined">
                &larr; Назад до Панелі Керування
            </Button>

            <Typography variant="h3" gutterBottom>
                Паркомісце #{spot.number}
            </Typography>
            <Typography variant="h6" color="text.secondary" gutterBottom>
                Лот ID: {lotId} | ID Місця: {spot.id}
            </Typography>

            {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

            <Card variant="outlined" sx={{ mb: 4, p: 3 }}>
                <Typography variant="h5" sx={{ mb: 2 }}>Налаштування Місця</Typography>
                <Grid container spacing={3}>
                    <Grid item xs={12} sm={6}>
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={spotForm.is_ev}
                                    onChange={handleFormChange}
                                    name="is_ev"
                                />
                            }
                            label="Місце для електромобілів (EV)"
                        />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={spotForm.is_disabled}
                                    onChange={handleFormChange}
                                    name="is_disabled"
                                />
                            }
                            label="Місце для людей з інвалідністю"
                        />
                    </Grid>
                    <Grid item xs={12}>
                        <Button
                            variant="contained"
                            color="primary"
                            onClick={handleUpdateSpot}
                            disabled={isUpdating}
                            sx={{ mr: 2 }}
                        >
                            {isUpdating ? <CircularProgress size={24} /> : 'Зберегти Налаштування'}
                        </Button>
                        {updateStatus === 'success' && <Alert severity="success" sx={{ display: 'inline-flex' }}>Оновлено!</Alert>}
                        {updateStatus === 'error' && <Alert severity="error" sx={{ display: 'inline-flex' }}>Помилка оновлення.</Alert>}
                    </Grid>
                </Grid>
            </Card>

            <Card variant="outlined" sx={{ mb: 4, p: 3, borderColor: 'error.main' }}>
                <Typography variant="h5" color="error.main" sx={{ mb: 1 }}>Зона Ризику</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Видалення місця неможливе, якщо є активні чи майбутні підтверджені бронювання.
                </Typography>
                <Button
                    variant="contained"
                    color="error"
                    onClick={handleDeleteSpot}
                    disabled={isDeleting || hasConfirmedFutureBookings}
                >
                    {isDeleting ? 'Видалення...' : (hasConfirmedFutureBookings ? 'Видалити (БРОНЬ)' : 'Видалити Місце Остаточно')}
                </Button>
            </Card>

            <Typography variant="h4" gutterBottom sx={{ mt: 4, mb: 3 }}>
                Повна Історія Бронювань ({spotBookings.length})
            </Typography>

            <Box sx={{ maxHeight: 600, overflowY: 'auto' }}>
                {sortedBookings.length === 0 ? (
                    <Alert severity="info">Історія бронювань порожня.</Alert>
                ) : (
                    sortedBookings.map(b => (
                        <SpotBookingHistoryItem
                            key={b.id}
                            booking={b}
                            onCancel={openCancelDialog}
                        />
                    ))
                )}
            </Box>

            <Dialog open={isCancelDialogOpen} onClose={closeCancelDialog}>
                <DialogTitle>Скасувати Бронювання #{bookingToCancel?.id}</DialogTitle>
                <DialogContent>
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
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={closeCancelDialog} disabled={isCancelling}>
                        Ні
                    </Button>
                    <Button
                        onClick={handleCancelSubmit}
                        color="error"
                        variant="contained"
                        disabled={isCancelling || !cancelReason.trim()}
                    >
                        {isCancelling ? 'Скасування...' : 'Так, скасувати'}
                    </Button>
                </DialogActions>
            </Dialog>

        </Container>
    );
}

export default SpotDetailsPage;