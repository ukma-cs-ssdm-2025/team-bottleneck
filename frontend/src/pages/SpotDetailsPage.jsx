import React, { useState, useEffect } from 'react';
import {
    Container, Typography, Box, Card, CardContent, Grid, Button, CircularProgress,
    Chip, Dialog, DialogTitle, DialogContent, DialogActions,
    TextField, Checkbox, FormControlLabel, Divider, List, ListItem
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import apiClient from '../api/apiClient';
import ErrorPopup from '../components/common/ErrorPopup';

function OperatorSpotDetailsPage() {
    const { lotId, spotId } = useParams();
    const { user, isOperator, isAdmin } = useAuth();
    const navigate = useNavigate();

    const [spot, setSpot] = useState(null);
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);

    // Dialogs
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [cancelDialogOpen, setCancelDialogOpen] = useState(false);

    // Forms
    const [editForm, setEditForm] = useState({ is_ev: false, is_disabled: false });
    const [bookingToCancel, setBookingToCancel] = useState(null);
    const [cancelReason, setCancelReason] = useState('');

    const [errorPopup, setErrorPopup] = useState({ open: false, message: '', severity: 'error' });

    useEffect(() => {
        if (!isOperator && !isAdmin) {
            navigate('/');
            return;
        }

        if (isOperator && !isAdmin && user?.lot_id !== parseInt(lotId)) {
            setErrorPopup({
                open: true,
                message: 'У вас немає доступу до цієї парковки.',
                severity: 'error'
            });
            navigate('/operator');
            return;
        }

        loadData();
    }, [lotId, spotId, user, isOperator, isAdmin, navigate]);

    const loadData = async () => {
        setLoading(true);
        try {
            // Load all pages of bookings
            let allBookings = [];
            let nextUrl = '/bookings/my-lot-bookings/';

            while (nextUrl) {
                const bookingsResponse = await apiClient.get(nextUrl);
                const bookingsData = bookingsResponse.data;

                // Add results from this page
                const pageResults = bookingsData.results || bookingsData || [];
                allBookings = [...allBookings, ...pageResults];

                // Check if there's a next page
                if (bookingsData.next) {
                    // Extract path from full URL and remove /api/v1 prefix if present
                    try {
                        const url = new URL(bookingsData.next);
                        let path = url.pathname + url.search;
                        // Remove /api/v1 prefix since apiClient adds it automatically
                        path = path.replace(/^\/api\/v1/, '');
                        nextUrl = path;
                    } catch (e) {
                        // If it's already a relative URL, use it directly
                        let path = bookingsData.next;
                        // Remove /api/v1 prefix if present
                        path = path.replace(/^\/api\/v1/, '');
                        nextUrl = path;
                    }
                } else {
                    nextUrl = null;
                }
            }

            // Load spot data
            const spotData = await apiClient.get(`/lots/${lotId}/spots/${spotId}/`);

            setSpot(spotData.data);
            setEditForm({
                is_ev: spotData.data.is_ev,
                is_disabled: spotData.data.is_disabled
            });

            // Get ALL bookings for this spot (including cancelled)
            const allBookingsForSpot = allBookings
                .filter(b => {
                    const bookingSpotId = typeof b.spot === 'object' ? b.spot.id : b.spot;
                    return bookingSpotId === parseInt(spotId);
                })
                .sort((a, b) => new Date(b.start_at) - new Date(a.start_at));

            setBookings(allBookingsForSpot);

            console.log('Spot bookings (all statuses):', allBookingsForSpot);
        } catch (err) {
            console.error('Error loading data:', err);
            setErrorPopup({
                open: true,
                message: 'Не вдалося завантажити дані місця.',
                severity: 'error'
            });
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateSpot = async () => {
        setActionLoading(true);
        try {
            await apiClient.patch(`/lots/${lotId}/spots/${spotId}/operator-update/`, editForm);
            setErrorPopup({ open: true, message: 'Місце успішно оновлено!', severity: 'success' });
            setEditDialogOpen(false);
            await loadData();
        } catch (err) {
            console.error('Error updating spot:', err);
            setErrorPopup({ open: true, message: 'Не вдалося оновити місце.', severity: 'error' });
        } finally {
            setActionLoading(false);
        }
    };

    const handleDeleteSpot = async () => {
        setActionLoading(true);
        try {
            await apiClient.delete(`/lots/${lotId}/spots/${spotId}/`);
            setErrorPopup({ open: true, message: 'Місце успішно видалено!', severity: 'success' });
            setTimeout(() => navigate('/operator'), 1500);
        } catch (err) {
            console.error('Error deleting spot:', err);

            let errorMessage = 'Не вдалося видалити місце.';

            if (err.response?.status === 400) {
                const detail = err.response.data?.detail;
                if (detail && detail.includes('active')) {
                    errorMessage = 'Неможливо видалити місце з активними бронюваннями.';
                } else if (detail && detail.includes('past')) {
                    errorMessage = 'Неможливо видалити місце з історією бронювань.';
                } else {
                    errorMessage = detail || errorMessage;
                }
            }

            setErrorPopup({ open: true, message: errorMessage, severity: 'error' });
            setDeleteConfirmOpen(false);
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
            await loadData();
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
                        await loadData();
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

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    if (!spot) {
        return (
            <Container sx={{ mt: 4 }}>
                <Typography>Місце не знайдено</Typography>
            </Container>
        );
    }

    const activeBooking = bookings.find(b =>
        b.status === 'confirmed' &&
        new Date(b.start_at) <= new Date() &&
        new Date(b.end_at) > new Date()
    );

    return (
        <Box sx={{ background: '#F4F6F8', minHeight: '100vh', py: 4 }}>
            <ErrorPopup
                open={errorPopup.open}
                onClose={() => setErrorPopup({ open: false, message: '', severity: 'error' })}
                message={errorPopup.message}
                severity={errorPopup.severity}
            />

            <Container maxWidth="lg">
                <Button
                    onClick={() => {
                        if (isAdmin) {
                            navigate(`/admin/operator/${lotId}`);
                        } else {
                            navigate('/operator');
                        }
                    }}
                    sx={{
                        mb: 3,
                        textTransform: 'none',
                        color: '#6B7280',
                        fontWeight: 600
                    }}
                >
                    ← Назад до панелі
                </Button>

                {/* Spot Info */}
                <Card sx={{ borderRadius: '16px', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)', mb: 3 }}>
                    <CardContent sx={{ p: 4 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
                            <Box>
                                <Typography variant="h4" sx={{ fontWeight: 700, color: '#111827', mb: 2 }}>
                                    Місце {spot.number}
                                </Typography>
                                <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                                    {activeBooking ? (
                                        <Chip
                                            label="Зайнято"
                                            sx={{
                                                backgroundColor: '#FEE2E2',
                                                color: '#EF4444',
                                                fontWeight: 600
                                            }}
                                        />
                                    ) : (
                                        <Chip
                                            label="Вільно"
                                            sx={{
                                                backgroundColor: '#D1FAE5',
                                                color: '#10B981',
                                                fontWeight: 600
                                            }}
                                        />
                                    )}
                                </Box>
                            </Box>
                            <Box sx={{ display: 'flex', gap: 2 }}>
                                <Button
                                    variant="outlined"
                                    onClick={() => setEditDialogOpen(true)}
                                    sx={{
                                        textTransform: 'none',
                                        fontWeight: 600,
                                        borderColor: '#10B981',
                                        color: '#10B981',
                                        '&:hover': {
                                            borderColor: '#059669',
                                            backgroundColor: '#F0FDF4'
                                        }
                                    }}
                                >
                                    Редагувати
                                </Button>
                                <Button
                                    variant="contained"
                                    onClick={() => setDeleteConfirmOpen(true)}
                                    sx={{
                                        background: '#EF4444',
                                        textTransform: 'none',
                                        fontWeight: 600,
                                        '&:hover': {
                                            background: '#DC2626'
                                        }
                                    }}
                                >
                                    Видалити місце
                                </Button>
                            </Box>
                        </Box>

                        <Grid container spacing={3}>
                            <Grid item xs={12} md={6}>
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                                    Особливості
                                </Typography>
                                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
                                    {spot.is_ev && (
                                        <Box sx={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 0.5,
                                            px: 1.5,
                                            py: 0.5,
                                            borderRadius: '6px',
                                            backgroundColor: '#FEF3C7'
                                        }}>
                                            <span style={{ fontSize: '16px' }}>⚡</span>
                                            <Typography variant="body2" sx={{ color: '#F59E0B', fontWeight: 600 }}>
                                                EV зарядка
                                            </Typography>
                                        </Box>
                                    )}
                                    {spot.is_disabled && (
                                        <Box sx={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 0.5,
                                            px: 1.5,
                                            py: 0.5,
                                            borderRadius: '6px',
                                            backgroundColor: '#DBEAFE'
                                        }}>
                                            <span style={{ fontSize: '16px' }}>♿</span>
                                            <Typography variant="body2" sx={{ color: '#3B82F6', fontWeight: 600 }}>
                                                Доступність
                                            </Typography>
                                        </Box>
                                    )}
                                    {!spot.is_ev && !spot.is_disabled && (
                                        <Typography variant="body2" color="text.secondary">
                                            Стандартне місце
                                        </Typography>
                                    )}
                                </Box>
                            </Grid>

                            <Grid item xs={12} md={6}>
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                                    Статистика
                                </Typography>
                                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                    Всього бронювань: {bookings.length}
                                </Typography>
                                <Typography variant="body1" sx={{ fontWeight: 500, color: '#10B981' }}>
                                    Активних: {bookings.filter(b => {
                                        const now = new Date();
                                        return b.status === 'confirmed' &&
                                            new Date(b.start_at) <= now &&
                                            new Date(b.end_at) > now;
                                    }).length}
                                </Typography>
                                <Typography variant="body1" sx={{ fontWeight: 500, color: '#F59E0B' }}>
                                    Майбутніх: {bookings.filter(b => {
                                        const now = new Date();
                                        return b.status === 'confirmed' &&
                                            new Date(b.start_at) > now;
                                    }).length}
                                </Typography>
                                <Typography variant="body1" sx={{ fontWeight: 500, color: '#EF4444' }}>
                                    Скасованих: {bookings.filter(b => b.status === 'cancelled').length}
                                </Typography>
                            </Grid>
                        </Grid>
                    </CardContent>
                </Card>

                {/* Bookings List */}
                <Card sx={{ borderRadius: '16px', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)' }}>
                    <CardContent sx={{ p: 3 }}>
                        <Typography variant="h5" sx={{ fontWeight: 600, mb: 3 }}>
                            Історія бронювань
                        </Typography>

                        {bookings.length === 0 ? (
                            <Box sx={{ textAlign: 'center', py: 6 }}>
                                <Typography variant="body1" color="text.secondary">
                                    Немає бронювань для цього місця
                                </Typography>
                            </Box>
                        ) : (
                            <List>
                                {bookings.map((booking, index) => {
                                    const now = new Date();
                                    const startDate = new Date(booking.start_at);
                                    const endDate = new Date(booking.end_at);

                                    const isActive = booking.status === 'confirmed' &&
                                        startDate <= now &&
                                        endDate > now;

                                    const isFuture = booking.status === 'confirmed' &&
                                        startDate > now;

                                    const statusConfig = booking.status === 'cancelled'
                                        ? { label: 'Скасовано', color: '#EF4444', bgColor: '#FEE2E2' }
                                        : isActive
                                            ? { label: 'Активне', color: '#10B981', bgColor: '#D1FAE5' }
                                            : isFuture
                                                ? { label: 'Майбутнє', color: '#F59E0B', bgColor: '#FEF3C7' }
                                                : { label: 'Завершено', color: '#6B7280', bgColor: '#F3F4F6' };

                                    return (
                                        <React.Fragment key={booking.id}>
                                            <ListItem
                                                sx={{
                                                    border: `1px solid ${statusConfig.bgColor}`,
                                                    borderRadius: '8px',
                                                    mb: 2,
                                                    flexDirection: 'column',
                                                    alignItems: 'flex-start',
                                                    p: 2
                                                }}
                                            >
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', mb: 1 }}>
                                                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                                                        ID: {booking.id}
                                                    </Typography>
                                                    <Chip
                                                        label={statusConfig.label}
                                                        size="small"
                                                        sx={{
                                                            backgroundColor: statusConfig.bgColor,
                                                            color: statusConfig.color,
                                                            fontWeight: 600
                                                        }}
                                                    />
                                                </Box>

                                                <Typography variant="body2" color="text.secondary">
                                                    Користувач: {booking.user_email || 'N/A'}
                                                </Typography>

                                                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem', mt: 0.5 }}>
                                                    {new Date(booking.start_at).toLocaleString('uk-UA')}
                                                    {' → '}
                                                    {new Date(booking.end_at).toLocaleString('uk-UA')}
                                                </Typography>

                                                {booking.cancellation_reason && (
                                                    <Box sx={{ mt: 1, p: 1, backgroundColor: '#FEE2E2', borderRadius: '4px', width: '100%' }}>
                                                        <Typography variant="caption" sx={{ color: '#991B1B', fontWeight: 500 }}>
                                                            Причина: {booking.cancellation_reason}
                                                        </Typography>
                                                    </Box>
                                                )}

                                                {(isActive || isFuture) && (
                                                    <Button
                                                        variant="outlined"
                                                        size="small"
                                                        onClick={() => openCancelDialog(booking)}
                                                        sx={{
                                                            mt: 1,
                                                            color: '#EF4444',
                                                            borderColor: '#EF4444',
                                                            textTransform: 'none',
                                                            fontWeight: 600,
                                                            '&:hover': {
                                                                borderColor: '#DC2626',
                                                                backgroundColor: '#FEF2F2'
                                                            }
                                                        }}
                                                    >
                                                        Скасувати бронювання
                                                    </Button>
                                                )}
                                            </ListItem>
                                        </React.Fragment>
                                    );
                                })}
                            </List>
                        )}
                    </CardContent>
                </Card>
            </Container>

            {/* Edit Dialog */}
            <Dialog open={editDialogOpen} onClose={() => !actionLoading && setEditDialogOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ fontWeight: 600 }}>Редагувати місце {spot.number}</DialogTitle>
                <DialogContent>
                    <FormControlLabel
                        control={
                            <Checkbox
                                checked={editForm.is_ev}
                                onChange={(e) => setEditForm({ ...editForm, is_ev: e.target.checked })}
                                disabled={actionLoading}
                            />
                        }
                        label={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <span style={{ fontSize: '16px' }}>⚡</span>
                                <span>З зарядкою для електромобілів</span>
                            </Box>
                        }
                        sx={{ mt: 2 }}
                    />
                    <FormControlLabel
                        control={
                            <Checkbox
                                checked={editForm.is_disabled}
                                onChange={(e) => setEditForm({ ...editForm, is_disabled: e.target.checked })}
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
                    <Button onClick={() => setEditDialogOpen(false)} disabled={actionLoading}>
                        Скасувати
                    </Button>
                    <Button
                        variant="contained"
                        onClick={handleUpdateSpot}
                        disabled={actionLoading}
                        sx={{
                            background: 'linear-gradient(135deg, #34D399 0%, #059669 100%)',
                            textTransform: 'none',
                            fontWeight: 600,
                        }}
                    >
                        {actionLoading ? <CircularProgress size={24} sx={{ color: '#FFF' }} /> : 'Зберегти'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteConfirmOpen} onClose={() => !actionLoading && setDeleteConfirmOpen(false)}>
                <DialogTitle sx={{ fontWeight: 600 }}>Видалити місце?</DialogTitle>
                <DialogContent>
                    <Typography gutterBottom>
                        Ви впевнені, що хочете видалити місце {spot.number}?
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        Місце з активними або минулими бронюваннями видалити неможливо.
                    </Typography>
                </DialogContent>
                <DialogActions sx={{ p: 3 }}>
                    <Button onClick={() => setDeleteConfirmOpen(false)} disabled={actionLoading}>
                        Скасувати
                    </Button>
                    <Button
                        variant="contained"
                        onClick={handleDeleteSpot}
                        disabled={actionLoading}
                        sx={{
                            background: '#EF4444',
                            textTransform: 'none',
                            fontWeight: 600,
                            '&:hover': {
                                background: '#DC2626',
                            }
                        }}
                    >
                        {actionLoading ? <CircularProgress size={24} sx={{ color: '#FFF' }} /> : 'Видалити'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Cancel Booking Dialog */}
            <Dialog open={cancelDialogOpen} onClose={() => !actionLoading && setCancelDialogOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ fontWeight: 600 }}>Скасувати бронювання?</DialogTitle>
                <DialogContent>
                    {bookingToCancel && (
                        <Box sx={{ mb: 2 }}>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                                <strong>ID бронювання:</strong> {bookingToCancel.id}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                                <strong>Користувач:</strong> {bookingToCancel.user_email || 'N/A'}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                                <strong>Період:</strong> {new Date(bookingToCancel.start_at).toLocaleString('uk-UA')} → {new Date(bookingToCancel.end_at).toLocaleString('uk-UA')}
                            </Typography>
                        </Box>
                    )}
                    <TextField
                        label="Причина скасування"
                        multiline
                        rows={3}
                        fullWidth
                        value={cancelReason}
                        onChange={(e) => setCancelReason(e.target.value)}
                        disabled={actionLoading}
                        required
                        placeholder="Вкажіть причину скасування (мінімум 5 символів)"
                        helperText={`${cancelReason.length}/255 символів`}
                        sx={{ mt: 1 }}
                    />
                </DialogContent>
                <DialogActions sx={{ p: 3 }}>
                    <Button onClick={() => setCancelDialogOpen(false)} disabled={actionLoading}>
                        Відміна
                    </Button>
                    <Button
                        variant="contained"
                        onClick={handleCancelBooking}
                        disabled={actionLoading}
                        sx={{
                            background: '#EF4444',
                            textTransform: 'none',
                            fontWeight: 600,
                            '&:hover': {
                                background: '#DC2626',
                            }
                        }}
                    >
                        {actionLoading ? <CircularProgress size={24} sx={{ color: '#FFF' }} /> : 'Скасувати бронювання'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}

export default OperatorSpotDetailsPage;