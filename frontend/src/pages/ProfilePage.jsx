import React, { useState, useEffect } from 'react';
import {
    Typography, Container, Alert, Box, Card, CardContent,
    Button, TextField, CircularProgress, Grid,
    Dialog, DialogTitle, DialogContent, DialogActions
} from '@mui/material';
import { useAuth } from '../context/AuthContext';
import { updateProfile, fetchUserBookings, cancelBooking } from '../api/parkingAPI';

const BookingCard = ({ booking, onCancel }) => {
    const isCancelled = booking.status === 'cancelled';
    const isPast = new Date(booking.end_at) < new Date();
    const isUpcoming = !isCancelled && !isPast;
    const canCancel = isUpcoming;

    const spotNumber = booking.spot?.number || 'N/A';
    const lotName = booking.spot?.lot?.name || 'Невідомий лот';

    return (
        <Card sx={{
            mb: 2,
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            borderLeft: `5px solid ${isCancelled ? '#f44336' : (isPast ? '#ff9800' : '#4caf50')}`
        }}>
            <CardContent sx={{ flexGrow: 1 }}>
                <Typography variant="h6" component="div" sx={{ fontWeight: 'bold' }}>
                    Бронювання #{booking.id}
                </Typography>
                <Typography variant="body1" color="text.primary">
                    <strong>Місце:</strong> {lotName} #{spotNumber}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    <strong>З:</strong> {new Date(booking.start_at).toLocaleString()}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    <strong>До:</strong> {new Date(booking.end_at).toLocaleString()}
                </Typography>

                <Box sx={{ p: 1, borderRadius: 1, backgroundColor: isCancelled ? '#ffebee' : (isPast ? '#fff3e0' : '#e8f5e9') }}>
                    <Typography variant="subtitle2">
                        <strong>Статус:</strong> <span style={{ color: isCancelled ? 'red' : (isPast ? 'orange' : 'green'), ml: 1, fontWeight: 'bold' }}>
                            {isCancelled ? 'СКАСОВАНО' : (isPast ? 'ЗАВЕРШЕНО' : 'ПІДТВЕРДЖЕНО')}
                        </span>
                    </Typography>
                </Box>

                {isCancelled && booking.cancellation_reason && (
                    <Typography variant="caption" display="block" color="error" sx={{ mt: 1 }}>
                        Причина: {booking.cancellation_reason}
                    </Typography>
                )}
            </CardContent>
            {canCancel && (
                <Box sx={{ p: 2, pt: 0 }}>
                    <Button
                        variant="contained"
                        color="error"
                        fullWidth
                        onClick={() => onCancel(booking.id)}
                    >
                        СКАСУВАТИ
                    </Button>
                </Box>
            )}
        </Card>
    );
};

function ProfilePage() {
    const { user, updateUser } = useAuth();
    const [profileData, setProfileData] = useState({
        first_name: user?.first_name || '',
        last_name: user?.last_name || ''
    });
    const [bookings, setBookings] = useState([]);
    const [loadingBookings, setLoadingBookings] = useState(false);
    const [loadingProfileUpdate, setLoadingProfileUpdate] = useState(false);
    const [updateStatus, setUpdateStatus] = useState(null);

    const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
    const [bookingToCancel, setBookingToCancel] = useState(null);
    const [cancelReason, setCancelReason] = useState('');
    const [isCancelling, setIsCancelling] = useState(false);
    const [bookingError, setBookingError] = useState(null);

    const loadBookings = async () => {
        setBookingError(null);
        setLoadingBookings(true);
        try {
            const data = await fetchUserBookings();
            const sortedData = data.sort((a, b) => {
                const isAUpcoming = new Date(a.end_at) > new Date();
                const isBUpcoming = new Date(b.end_at) > new Date();

                if (isAUpcoming && !isBUpcoming) return -1;
                if (!isAUpcoming && isBUpcoming) return 1;

                return new Date(a.start_at) - new Date(b.start_at);
            });
            setBookings(sortedData);
        } catch (err) {
            setBookingError('Не вдалося завантажити ваші бронювання. Перевірте підключення.');
        } finally {
            setLoadingBookings(false);
        }
    };

    useEffect(() => {
        if (user) {
            loadBookings();
        }
    }, [user]);

    const handleProfileChange = (e) => {
        setProfileData({ ...profileData, [e.target.name]: e.target.value });
    };

    const handleProfileSubmit = async (e) => {
        e.preventDefault();
        setLoadingProfileUpdate(true);
        setUpdateStatus(null);
        try {
            const updatedUser = await updateProfile(profileData);
            updateUser(updatedUser);
            setUpdateStatus('success');
        } catch (err) {
            console.error('Update failed:', err.response?.data || err);
            setUpdateStatus('error');
        } finally {
            setLoadingProfileUpdate(false);
            setTimeout(() => setUpdateStatus(null), 3000);
        }
    };

    const openCancelDialog = (bookingId) => {
        setBookingToCancel(bookingId);
        setCancelReason('');
        setIsCancelDialogOpen(true);
        setBookingError(null);
    };

    const handleCancelSubmit = async () => {
        if (!bookingToCancel) return;
        setIsCancelling(true);
        setBookingError(null);

        try {
            await cancelBooking(bookingToCancel, cancelReason);
            loadBookings();
            setIsCancelDialogOpen(false);
        } catch (err) {
            setBookingError('Помилка скасування: ' + (err.response?.data?.detail || 'Незрозуміла помилка.'));
        } finally {
            setIsCancelling(false);
            setBookingToCancel(null);
        }
    };

    if (!user) {
        return (
            <Container sx={{ mt: 4 }}>
                <Alert severity="warning">Будь ласка, увійдіть, щоб переглянути профіль.</Alert>
            </Container>
        );
    }

    return (
        <Container sx={{ mt: 4, mb: 4 }}>
            <Typography variant="h4" gutterBottom>
                Мій Профіль
            </Typography>

            {/* Секція Інформації Профілю */}
            <Card variant="outlined" sx={{ mb: 4 }}>
                <CardContent>
                    <Typography variant="h5" gutterBottom>
                        Ваші дані
                    </Typography>
                    {/* ВИПРАВЛЕНО: Використовуємо <strong> замість ** */}
                    <Typography variant="body1">
                        <strong>Ім'я користувача:</strong> {user.username}
                    </Typography>
                    <Typography variant="body1">
                        <strong>Email:</strong> {user.email}
                    </Typography>
                    <Typography variant="body1">
                        <strong>Ім'я:</strong> {user.first_name || 'Не вказано'}
                    </Typography>
                    <Typography variant="body1">
                        <strong>Прізвище:</strong> {user.last_name || 'Не вказано'}
                    </Typography>
                </CardContent>
            </Card>

            {/* Секція Оновлення Профілю */}
            <Card variant="outlined" sx={{ mb: 4, p: 3 }}>
                <Typography variant="h5" gutterBottom>
                    Оновити Ім'я / Прізвище
                </Typography>
                <Box component="form" onSubmit={handleProfileSubmit}>
                    <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                label="Ім'я"
                                name="first_name"
                                value={profileData.first_name}
                                onChange={handleProfileChange}
                                fullWidth
                                disabled={loadingProfileUpdate}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                label="Прізвище"
                                name="last_name"
                                value={profileData.last_name}
                                onChange={handleProfileChange}
                                fullWidth
                                disabled={loadingProfileUpdate}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <Button
                                type="submit"
                                variant="contained"
                                color="primary"
                                disabled={loadingProfileUpdate}
                            >
                                {loadingProfileUpdate ? <CircularProgress size={24} /> : 'Зберегти зміни'}
                            </Button>
                            {updateStatus === 'success' && (
                                <Alert severity="success" sx={{ mt: 1 }}>Профіль успішно оновлено!</Alert>
                            )}
                            {updateStatus === 'error' && (
                                <Alert severity="error" sx={{ mt: 1 }}>Помилка оновлення профілю.</Alert>
                            )}
                        </Grid>
                    </Grid>
                </Box>
            </Card>

            {/* Секція Мої Бронювання */}
            <Typography variant="h4" gutterBottom sx={{ mt: 4 }}>
                Мої Бронювання
            </Typography>

            {loadingBookings && (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 5 }}>
                    <CircularProgress />
                </Box>
            )}

            {bookingError && <Alert severity="error" sx={{ mb: 2 }}>{bookingError}</Alert>}

            {!loadingBookings && bookings.length === 0 && !bookingError && (
                <Alert severity="info">Наразі у вас немає бронювань.</Alert>
            )}

            {!loadingBookings && bookings.length > 0 && (
                <Grid container spacing={3}>
                    {bookings.map((booking) => (
                        <Grid item key={booking.id} xs={12} md={6} lg={4}>
                            <BookingCard booking={booking} onCancel={openCancelDialog} />
                        </Grid>
                    ))}
                </Grid>
            )}

            {/* Діалог скасування */}
            <Dialog open={isCancelDialogOpen} onClose={() => setIsCancelDialogOpen(false)}>
                <DialogTitle>Скасувати Бронювання #{bookingToCancel}</DialogTitle>
                <DialogContent>
                    <Typography gutterBottom>
                        Ви впевнені, що хочете скасувати бронювання?
                    </Typography>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="Причина скасування (необов'язково)"
                        type="text"
                        fullWidth
                        variant="outlined"
                        value={cancelReason}
                        onChange={(e) => setCancelReason(e.target.value)}
                        disabled={isCancelling}
                    />
                    {bookingError && <Alert severity="error" sx={{ mt: 1 }}>{bookingError}</Alert>}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setIsCancelDialogOpen(false)} disabled={isCancelling}>
                        Ні
                    </Button>
                    <Button onClick={handleCancelSubmit} color="error" variant="contained" disabled={isCancelling}>
                        {isCancelling ? 'Скасування...' : 'Так, скасувати'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
}

export default ProfilePage;