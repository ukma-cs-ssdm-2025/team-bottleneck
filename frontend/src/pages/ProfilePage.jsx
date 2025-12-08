import React, { useState, useEffect, useCallback } from 'react';
import {
    Typography, Container, Box, Card, CardContent,
    Button, TextField, CircularProgress, Grid, Chip,
    Dialog, DialogTitle, DialogContent, DialogActions, Divider
} from '@mui/material';
import { useAuth } from '../context/AuthContext';
import { updateProfile, fetchUserBookings, cancelBooking } from '../api/parkingAPI';
import ErrorPopup from '../components/common/ErrorPopup';

const getBookingStatus = (booking) => {
    if (booking.status === 'cancelled') {
        return 'CANCELLED';
    }
    if (new Date(booking.end_at) < new Date()) {
        return 'COMPLETED';
    }
    return 'CONFIRMED';
};

const BOOKING_STATUS_CONFIG = {
    CANCELLED: {
        label: 'Скасовано',
        color: '#EF4444',
        bgColor: '#FEE2E2',
    },
    COMPLETED: {
        label: 'Завершено',
        color: '#F59E0B',
        bgColor: '#FEF3C7',
    },
    CONFIRMED: {
        label: 'Активне',
        color: '#10B981',
        bgColor: '#D1FAE5',
    },
};

const BookingCard = ({ booking, onCancel }) => {
    const statusKey = getBookingStatus(booking);
    const { label, color, bgColor } = BOOKING_STATUS_CONFIG[statusKey];
    const canCancel = statusKey === 'CONFIRMED';

    // Use correct fields from API response
    const spotNumber = booking.spot_number || 'N/A';
    const lotName = booking.lot_name || 'Невідома парковка';
    const lotAddress = booking.lot_address || '';

    return (
        <Card sx={{
            borderRadius: '16px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
        }}>
            <CardContent sx={{ flexGrow: 1, p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600, color: '#111827' }}>
                        Бронювання #{booking.id}
                    </Typography>
                    <Chip
                        label={label}
                        sx={{
                            backgroundColor: bgColor,
                            color: color,
                            fontWeight: 600,
                            fontSize: '0.75rem'
                        }}
                    />
                </Box>

                <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                        Парковка
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500, color: '#111827' }}>
                        {lotName}
                    </Typography>
                    {lotAddress && (
                        <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem' }}>
                            {lotAddress}
                        </Typography>
                    )}
                </Box>

                <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                        Місце
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500, color: '#111827' }}>
                        #{spotNumber}
                    </Typography>
                </Box>

                <Divider sx={{ my: 2 }} />

                <Box sx={{ mb: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                        Початок
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        {new Date(booking.start_at).toLocaleString('uk-UA')}
                    </Typography>
                </Box>

                <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                        Кінець
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        {new Date(booking.end_at).toLocaleString('uk-UA')}
                    </Typography>
                </Box>

                {booking.cancellation_reason && (
                    <Box sx={{ mb: 2, p: 2, backgroundColor: '#FEF2F2', borderRadius: '8px' }}>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                            Причина скасування
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#EF4444' }}>
                            {booking.cancellation_reason}
                        </Typography>
                    </Box>
                )}

                {canCancel && (
                    <Button
                        variant="outlined"
                        fullWidth
                        onClick={() => onCancel(booking.id)}
                        sx={{
                            mt: 2,
                            color: '#EF4444',
                            borderColor: '#EF4444',
                            textTransform: 'none',
                            fontWeight: 600,
                            borderRadius: '12px',
                            '&:hover': {
                                borderColor: '#DC2626',
                                backgroundColor: '#FEF2F2',
                            }
                        }}
                    >
                        Скасувати бронювання
                    </Button>
                )}
            </CardContent>
        </Card>
    );
};

/**
 * Render the user's profile page with editable profile fields and a bookings management section.
 *
 * Displays user information, an edit form for first and last name, and a "My Bookings" area that is shown only for non-admin/non-operator users. Handles loading states, shows an error/success popup for operations, allows cancelling bookings via a confirmation dialog (with optional reason), and refreshes the bookings list after changes.
 *
 * @returns {JSX.Element} The profile page UI containing profile header, user info, edit form, conditional bookings list, and cancellation dialog.
 */
function ProfilePage() {
    const { user, updateUser, loading, isAdmin, isOperator } = useAuth();
    const [profileData, setProfileData] = useState({
        first_name: '',
        last_name: ''
    });

    const [bookings, setBookings] = useState([]);
    const [loadingBookings, setLoadingBookings] = useState(false);
    const [loadingProfileUpdate, setLoadingProfileUpdate] = useState(false);

    const [errorPopup, setErrorPopup] = useState({ open: false, message: '', severity: 'error' });

    const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
    const [bookingToCancel, setBookingToCancel] = useState(null);
    const [cancelReason, setCancelReason] = useState('');
    const [isCancelling, setIsCancelling] = useState(false);

    useEffect(() => {
        if (user) {
            setProfileData({
                first_name: user.first_name || '',
                last_name: user.last_name || ''
            });
        }
    }, [user]);

    const loadBookings = useCallback(async () => {
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
            console.error('Error loading bookings:', err);
            let errorMessage = 'Не вдалося завантажити бронювання.';

            if (!err.response) {
                errorMessage = 'Не вдалося з\'єднатися з сервером. Перевірте ваше інтернет-з\'єднання.';
            } else if (err.response.status === 401) {
                errorMessage = 'Ваша сесія закінчилася. Будь ласка, увійдіть знову.';
            } else if (err.response.status === 500) {
                errorMessage = 'Помилка сервера. Спробуйте пізніше.';
            }

            setErrorPopup({ open: true, message: errorMessage, severity: 'error' });
        } finally {
            setLoadingBookings(false);
        }
    }, []);

    useEffect(() => {
        if (user && !isAdmin && !isOperator) {
            loadBookings();
        }
    }, [user, isAdmin, isOperator, loadBookings]);

    const handleProfileChange = (e) => {
        const { name, value } = e.target;
        setProfileData(prev => ({ ...prev, [name]: value }));
    };

    const handleProfileSubmit = async (e) => {
        e.preventDefault();
        setLoadingProfileUpdate(true);

        try {
            const updated = await updateProfile(profileData);
            updateUser(updated);
            setErrorPopup({ open: true, message: 'Профіль успішно оновлено!', severity: 'success' });
        } catch (err) {
            console.error('Profile update error:', err);
            let errorMessage = 'Не вдалося оновити профіль.';

            if (!err.response) {
                errorMessage = 'Не вдалося з\'єднатися з сервером.';
            } else if (err.response.status === 400) {
                errorMessage = 'Невірні дані. Перевірте введену інформацію.';
            } else if (err.response.status === 401) {
                errorMessage = 'Ваша сесія закінчилася. Будь ласка, увійдіть знову.';
            }

            setErrorPopup({ open: true, message: errorMessage, severity: 'error' });
        } finally {
            setLoadingProfileUpdate(false);
        }
    };

    const openCancelDialog = (bookingId) => {
        setBookingToCancel(bookingId);
        setCancelReason('');
        setIsCancelDialogOpen(true);
    };

    const handleCloseCancelDialog = () => {
        if (!isCancelling) {
            setIsCancelDialogOpen(false);
            setBookingToCancel(null);
            setCancelReason('');
        }
    };

    const handleConfirmCancel = async () => {
        if (!bookingToCancel) return;

        setIsCancelling(true);
        try {
            await cancelBooking(bookingToCancel, cancelReason);
            setErrorPopup({ open: true, message: 'Бронювання успішно скасовано!', severity: 'success' });
            setIsCancelDialogOpen(false);
            setBookingToCancel(null);
            setCancelReason('');
            await loadBookings();
        } catch (err) {
            console.error('Cancel booking error:', err);
            let errorMessage = 'Не вдалося скасувати бронювання.';

            if (!err.response) {
                errorMessage = 'Не вдалося з\'єднатися з сервером.';
            } else if (err.response.status === 400) {
                errorMessage = err.response.data?.detail || 'Це бронювання не можна скасувати.';
            } else if (err.response.status === 404) {
                errorMessage = 'Бронювання не знайдено.';
            }

            setErrorPopup({ open: true, message: errorMessage, severity: 'error' });
        } finally {
            setIsCancelling(false);
        }
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    if (!user) {
        return (
            <Container sx={{ mt: 4 }}>
                <Typography>Будь ласка, увійдіть до системи.</Typography>
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

            <Container maxWidth="lg">
                {/* Profile Header */}
                <Card sx={{ borderRadius: '16px', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)', mb: 4 }}>
                    <CardContent sx={{ p: 4 }}>
                        <Typography variant="h4" sx={{ fontWeight: 700, color: '#111827', mb: 1 }}>
                            Мій профіль
                        </Typography>
                        <Typography variant="body1" sx={{ color: '#6B7280' }}>
                            Керуйте своїм обліковим записом та бронюваннями
                        </Typography>
                    </CardContent>
                </Card>

                <Grid container spacing={3}>
                    {/* User Info Card */}
                    <Grid item xs={12} md={4}>
                        <Card sx={{ borderRadius: '16px', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)', height: '100%' }}>
                            <CardContent sx={{ p: 3 }}>
                                <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                                    Інформація користувача
                                </Typography>

                                <Box sx={{ mb: 2 }}>
                                    <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                                        Ім'я користувача
                                    </Typography>
                                    <Typography variant="body1" sx={{ fontWeight: 500, color: '#111827' }}>
                                        {user.username}
                                    </Typography>
                                </Box>

                                <Box sx={{ mb: 2 }}>
                                    <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                                        Email
                                    </Typography>
                                    <Typography variant="body1" sx={{ fontWeight: 500, color: '#111827' }}>
                                        {user.email}
                                    </Typography>
                                </Box>

                            </CardContent>
                        </Card>
                    </Grid>

                    {/* Edit Profile Card */}
                    <Grid item xs={12} md={8}>
                        <Card sx={{ borderRadius: '16px', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)' }}>
                            <CardContent sx={{ p: 3 }}>
                                <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                                    Редагувати профіль
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
                                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
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
                                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
                                            />
                                        </Grid>
                                        <Grid item xs={12}>
                                            <Button
                                                type="submit"
                                                variant="contained"
                                                disabled={loadingProfileUpdate}
                                                sx={{
                                                    mt: 2,
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
                                                    },
                                                    '&:disabled': {
                                                        background: '#9CA3AF',
                                                        color: '#FFFFFF',
                                                    }
                                                }}
                                            >
                                                {loadingProfileUpdate ? <CircularProgress size={24} sx={{ color: '#FFFFFF' }} /> : 'Зберегти зміни'}
                                            </Button>
                                        </Grid>
                                    </Grid>
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>

                {/* My Bookings Section */}
                {!isAdmin && !isOperator && (
                    <Box sx={{ mt: 5 }}>
                        <Typography variant="h5" sx={{ fontWeight: 700, color: '#111827', mb: 3 }}>
                            Мої бронювання
                        </Typography>

                        {loadingBookings && (
                            <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
                                <CircularProgress />
                            </Box>
                        )}

                        {!loadingBookings && bookings.length === 0 && (
                            <Card sx={{ borderRadius: '16px', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)', p: 4, textAlign: 'center' }}>
                                <Typography variant="body1" color="text.secondary">
                                    У вас поки немає бронювань
                                </Typography>
                            </Card>
                        )}

                        {!loadingBookings && bookings.length > 0 && (
                            <Grid container spacing={3}>
                                {bookings.map((booking) => (
                                    <Grid item key={booking.id} xs={12} sm={6} lg={4}>
                                        <BookingCard booking={booking} onCancel={openCancelDialog} />
                                    </Grid>
                                ))}
                            </Grid>
                        )}
                    </Box>
                )}
            </Container>

            {/* Cancel Dialog */}
            <Dialog
                open={isCancelDialogOpen}
                onClose={handleCloseCancelDialog}
                PaperProps={{
                    sx: { borderRadius: '16px', minWidth: { xs: '90%', sm: '400px' } }
                }}
            >
                <DialogTitle sx={{ fontWeight: 600 }}>
                    Скасувати бронювання
                </DialogTitle>
                <DialogContent>
                    <Typography gutterBottom sx={{ mb: 2 }}>
                        Ви впевнені, що хочете скасувати бронювання #{bookingToCancel}?
                    </Typography>
                    <TextField
                        label="Причина скасування (необов'язково)"
                        multiline
                        rows={3}
                        fullWidth
                        value={cancelReason}
                        onChange={(e) => setCancelReason(e.target.value)}
                        disabled={isCancelling}
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
                    />
                </DialogContent>
                <DialogActions sx={{ p: 3 }}>
                    <Button
                        onClick={handleCloseCancelDialog}
                        disabled={isCancelling}
                        sx={{ textTransform: 'none', fontWeight: 600 }}
                    >
                        Відміна
                    </Button>
                    <Button
                        onClick={handleConfirmCancel}
                        disabled={isCancelling}
                        sx={{
                            background: '#EF4444',
                            color: '#FFFFFF',
                            fontWeight: 600,
                            textTransform: 'none',
                            px: 3,
                            '&:hover': {
                                background: '#DC2626',
                            },
                            '&:disabled': {
                                background: '#9CA3AF',
                                color: '#FFFFFF',
                            }
                        }}
                    >
                        {isCancelling ? <CircularProgress size={20} sx={{ color: '#FFFFFF' }} /> : 'Підтвердити'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}

export default ProfilePage;