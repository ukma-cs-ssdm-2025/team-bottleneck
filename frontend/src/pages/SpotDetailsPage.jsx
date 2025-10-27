import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Typography, Container, Button, CircularProgress, Alert,
    Box, Card, CardContent, Grid, Switch, FormControlLabel
} from '@mui/material';
import { useAuth } from '../context/AuthContext';
import { fetchLotBookings, fetchSpotDetails, cancelBookingByOperator, updateSpot, deleteSpot } from '../api/operatorAPI';

const SpotBookingHistoryItem = ({ booking, onCancel }) => {
    const isConfirmed = booking.status === 'confirmed';
    const isUpcoming = new Date(booking.end_at).getTime() > new Date().getTime();
    const canCancel = isConfirmed && isUpcoming;

    const statusColor = isConfirmed ? (isUpcoming ? 'success.main' : 'warning.main') : 'error.main';
    const statusText = isConfirmed ? (isUpcoming ? 'МАЙБУТНЄ' : 'ЗАВЕРШЕНЕ') : 'СКАСОВАНО';
    const userText = `Користувач ID: ${booking.user}`;

    return (
        <Card variant="outlined" sx={{ mb: 2, borderLeft: `5px solid ${statusColor}`, backgroundColor: '#fafafa' }}>
            <CardContent sx={{ p: 2 }}>
                <Grid container spacing={1} alignItems="center">
                    <Grid item xs={12} sm={8}>
                        <Typography variant="body1">
                            <strong>{userText}</strong> ({statusText})
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

    const spotBookings = allBookings.filter(b => b.spot === parseInt(spotId));
    const hasConfirmedFutureBookings = spotBookings.some(
        b => b.status === 'confirmed' && new Date(b.end_at).getTime() > new Date().getTime()
    );

    const loadData = useCallback(async () => {
        setError(null);
        setLoadingData(true);
        try {
            const spotData = await fetchSpotDetails(lotId, spotId);
            setSpot(spotData);
            setSpotForm({
                is_ev: spotData.is_ev,
                is_disabled: spotData.is_disabled,
            });

            const bookingsData = await fetchLotBookings();
            setAllBookings(bookingsData);

        } catch (err) {
            setError('Не вдалося завантажити деталі місця або бронювання.');
            console.error(err);
        } finally {
            setLoadingData(false);
        }
    }, [lotId, spotId]);

    useEffect(() => {
        if (user?.is_operator && user?.lot_id === parseInt(lotId)) {
            loadData();
        }
    }, [user, lotId, loadData]);

    // --- Spot Settings Management ---
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
        try {
            await updateSpot(lotId, spotId, spotForm);
            setUpdateStatus('success');
            const updatedSpotData = await fetchSpotDetails(lotId, spotId);
            setSpot(updatedSpotData);
        } catch (err) {
            setUpdateStatus('error');
            console.error("Update failed:", err);
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
            const detail = err.response?.data?.detail || 'Не вдалося видалити паркомісце.';
            setError(detail);
        } finally {
            setIsDeleting(false);
        }
    };

    // --- Booking Management ---
    const handleCancelBooking = async (booking) => {
        const reason = prompt(`Введіть причину скасування бронювання #${booking.id}:`);
        if (!reason) return;

        setError(null);

        try {
            await cancelBookingByOperator(booking.id, reason);
            const bookingsData = await fetchLotBookings();
            setAllBookings(bookingsData);
            alert(`Бронювання #${booking.id} скасовано.`);
        } catch (err) {
            setError('Помилка скасування: ' + (err.response?.data?.detail || 'Невідома помилка.'));
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

            {/* Spot Settings Block */}
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

            {/* Deletion Block */}
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

            {/* Booking History Block */}
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
                            onCancel={handleCancelBooking}
                        />
                    ))
                )}
            </Box>
        </Container>
    );
}

export default SpotDetailsPage;