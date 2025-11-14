import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import {
    Typography, Container, Alert, Box, Card, CardContent,
    Button, TextField, CircularProgress, Grid,
    Dialog, DialogTitle, DialogContent, DialogActions
} from '@mui/material';
import { useAuth } from '../context/AuthContext';
import { updateProfile, fetchUserBookings, cancelBooking } from '../api/parkingAPI';


const MESSAGES = {
    BOOKING_LOAD_ERROR: 'Не вдалося завантажити ваші бронювання. Перевірте підключення.',
    PROFILE_UPDATE_SUCCESS: 'Профіль успішно оновлено!',
    PROFILE_UPDATE_ERROR: 'Помилка оновлення профілю.',
    CANCEL_ERROR_DEFAULT: 'Незрозуміла помилка.',
};


const getBookingStatus = (booking) => {
    if (booking.status === 'cancelled') {
        return 'CANCELLED';
    }
    if (new Date(booking.end_at) < new Date()) {
        return 'COMPLETED';
    }
    return 'CONFIRMED';
};

const BOOKING_STATUS_PROPS = {
    CANCELLED: {
        text: 'СКАСОВАНО',
        color: '#f44336',
        bgColor: '#ffebee',
        canCancel: false,
    },
    COMPLETED: {
        text: 'ЗАВЕРШЕНО',
        color: '#ff9800',
        bgColor: '#fff3e0',
        canCancel: false,
    },
    CONFIRMED: {
        text: 'ПІДТВЕРДЖЕНО',
        color: '#4caf50',
        bgColor: '#e8f5e9',
        canCancel: true,
    },
};

const BookingCard = ({ booking, onCancel }) => {
    const statusKey = getBookingStatus(booking);
    const { text, color, bgColor, canCancel } = BOOKING_STATUS_PROPS[statusKey];

    const spotNumber = booking.spot?.number || 'N/A';
    const lotName = booking.spot?.lot?.name || 'Невідомий лот';

    return (
        <Card sx={{
            mb: 2,
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            borderLeft: `5px solid ${color}`
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

                <Box sx={{ p: 1, borderRadius: 1, backgroundColor: bgColor }}>
                    <Typography variant="subtitle2">
                        <strong>Статус:</strong> <span style={{ color: color, ml: 1, fontWeight: 'bold' }}>
                            {text}
                        </span>
                    </Typography>
                </Box>

                {statusKey === 'CANCELLED' && booking.cancellation_reason && (
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
                        СКАСУВATИ
                    </Button>
                </Box>
            )}
        </Card>
    );
};

const BookingPropType = PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    status: PropTypes.string.isRequired,
    start_at: PropTypes.string.isRequired,
    end_at: PropTypes.string.isRequired,
    cancellation_reason: PropTypes.string,
    spot: PropTypes.shape({
        number: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        lot: PropTypes.shape({
            name: PropTypes.string
        })
    })
});

BookingCard.propTypes = {
    booking: BookingPropType.isRequired,
    onCancel: PropTypes.func.isRequired
};

function ProfilePage() {
    const { user, updateUser, loading } = useAuth();
    const [profileData, setProfileData] = useState({
        first_name: '',
        last_name: ''
    });

    const [bookings, setBookings] = useState([]);
    const [loadingBookings, setLoadingBookings] = useState(false);
    const [loadingProfileUpdate, setLoadingProfileUpdate] = useState(false);

    const [updateSuccess, setUpdateSuccess] = useState(null);
    const [updateError, setUpdateError] = useState(null);
    const [bookingError, setBookingError] = useState(null);

    const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
    const [bookingToCancel, setBookingToCancel] = useState(null);
    const [cancelReason, setCancelReason] = useState('');
    const [isCancelling, setIsCancelling] = useState(false);

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
            if (err.response && err.response.status === 401) {
                setBookingError('Ваша сесія закінчилася. Увійдіть до системи знову.');
            } else if (err.response && err.response.status === 500) {
                setBookingError('Сервер тимчасово недоступний. Спробуйте оновити сторінку пізніше.');
            } else if (err.request) {
                setBookingError('Не вдалося завантажити бронювання. Перевірте ваше інтернет-з\'єднання.');
            } else {
                setBookingError('Виникла помилка при завантаженні бронювань. Спробуйте оновити сторінку.');
            }
            console.error('Error loading bookings:', err);
        } finally {
            setLoadingBookings(false);
        }
    };

    useEffect(() => {
        if (user) {
            setProfileData({
                first_name: user.first_name || '',
                last_name: user.last_name || ''
            });
            loadBookings();
        }
    }, [user, loadBookings]);

    const handleProfileChange = (e) => {
        setProfileData({ ...profileData, [e.target.name]: e.target.value });
    };

    const handleProfileSubmit = async (e) => {
        e.preventDefault();
        setLoadingProfileUpdate(true);
        setUpdateSuccess(null);
        setUpdateError(null);
        try {
            const updatedUser = await updateProfile(profileData);
            updateUser(updatedUser);
            setUpdateSuccess(MESSAGES.PROFILE_UPDATE_SUCCESS);
        } catch (err) {
            console.error('Update failed:', err.response?.data || err);
            let errorMessage = 'Помилка при оновленні профілю. Спробуйте ще раз.';

            if (err.response && err.response.status === 400) {
                errorMessage = 'Некоректні дані. Перевірте введену інформацію.';
            } else if (err.response && err.response.status === 401) {
                errorMessage = 'Ваша сесія закінчилася. Увійдіть до системи знову.';
            } else if (err.response && err.response.status === 500) {
                errorMessage = 'Сервер тимчасово недоступний. Спробуйте пізніше.';
            } else if (err.request) {
                errorMessage = 'Не вдалося з\'єднатися з сервером. Перевірте інтернет-з\'єднання.';
            }

            setUpdateError(errorMessage);
        } finally {
            setLoadingProfileUpdate(false);
            setTimeout(() => {
                setUpdateSuccess(null);
                setUpdateError(null);
            }, 5000);
        }
    };

    const openCancelDialog = (bookingId) => {
        setBookingToCancel(bookingId);
        setCancelReason('');
        setIsCancelDialogOpen(true);
        setBookingError(null);
    };

    const handleCloseCancelDialog = () => {
        if (isCancelling) return;
        setIsCancelDialogOpen(false);
        setBookingToCancel(null);
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
            if (err.response && err.response.status === 400) {
                setBookingError('Це бронювання вже скасовано або не може бути скасовано.');
            } else if (err.response && err.response.status === 404) {
                setBookingError('Бронювання не знайдено. Можливо, воно вже видалено.');
            } else if (err.response && err.response.status === 401) {
                setBookingError('Ваша сесія закінчилася. Увійдіть до системи знову.');
            } else if (err.response && err.response.status === 500) {
                setBookingError('Сервер тимчасово недоступний. Спробуйте пізніше.');
            } else if (err.request) {
                setBookingError('Не вдалося з\'єднатися з сервером. Перевірте інтернет-з\'єднання.');
            } else {
                setBookingError('Помилка при скасуванні бронювання: ' + (err.response?.data?.detail || 'Спробуйте ще раз.'));
            }
            console.error('Cancel booking error:', err);
        } finally {
            setIsCancelling(false);
            setBookingToCancel(null);
        }
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 5 }}>
                <CircularProgress />
                <Typography sx={{ ml: 2 }}>Відновлення сесії...</Typography>
            </Box>
        );
    }

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

            {/* Profile Info Section */}
            <Card variant="outlined" sx={{ mb: 4 }}>
                <CardContent>
                    <Typography variant="h5" gutterBottom>
                        Ваші дані
                    </Typography>
                    <Typography variant="body1">
                        <strong>Ім'я користувача:</strong> {user.username}
                    </Typography>
                    <Typography variant="body1">
                        <strong>Email:</strong> {user.email}
                    </Typography>
                    <Typography variant="body1">
                        <strong>Іm'я:</strong> {user.first_name || 'Не вказано'}
                    </Typography>
                    <Typography variant="body1">
                        <strong>Прізвище:</strong> {user.last_name || 'Не вказано'}
                    </Typography>
                </CardContent>
            </Card>

            {/* Profile Update Section */}
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
                            {updateSuccess && (
                                <Alert severity="success" sx={{ mt: 2 }}>{updateSuccess}</Alert>
                            )}
                            {updateError && (
                                <Alert severity="error" sx={{ mt: 2 }}>{updateError}</Alert>
                            )}
                        </Grid>
                    </Grid>
                </Box>
            </Card>

            {/* My Bookings Section */}
            <Typography variant="h4" gutterBottom sx={{ mt: 4 }}>
                Мої Бронювання
            </Typography>

            {loadingBookings && (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 5 }}>
                    <CircularProgress />
                </Box>
            )}

            {/* Main page error for bookings */}
            {bookingError && !isCancelDialogOpen && (
                <Alert severity="error" sx={{ mb: 2 }}>{bookingError}</Alert>
            )}

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

            {/* Cancellation Dialog */}
            <Dialog open={isCancelDialogOpen} onClose={handleCloseCancelDialog}>
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
                    {/* Dialog-specific error */}
                    {bookingError && isCancelDialogOpen && (
                        <Alert severity="error" sx={{ mt: 2 }}>{bookingError}</Alert>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseCancelDialog} disabled={isCancelling}>
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