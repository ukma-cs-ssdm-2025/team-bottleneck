import React, { useState, useEffect } from 'react';
import { Container, Typography, CircularProgress, Box, Button } from '@mui/material';
import { useLocation, Link } from 'react-router-dom';
import { getAdminParkingLots, deleteParkingLot } from '../api/adminAPI';
import ParkingLotsTable from '../components/admin/ParkingLotsTable';
import ErrorPopup from '../components/common/ErrorPopup';
import ConfirmDialog from '../components/common/ConfirmDialog';

const ParkingLotListPage = () => {
    const [lots, setLots] = useState([]);
    const [loading, setLoading] = useState(true);
    const location = useLocation();

    // Error/Success popup state
    const [popup, setPopup] = useState({
        open: false,
        message: '',
        severity: 'error'
    });

    // Confirm dialog state
    const [confirmDialog, setConfirmDialog] = useState({
        open: false,
        lotId: null,
        lotName: ''
    });

    const fetchLots = async () => {
        setLoading(true);
        try {
            const response = await getAdminParkingLots();
            const data = Array.isArray(response) ? response : response.results;
            setLots(data || []);
        } catch (err) {
            console.error('Failed to fetch parking lots:', err.response || err);
            let errorMessage = 'Не вдалося завантажити список паркувальних майданчиків.';

            if (err.response?.status === 403) {
                errorMessage = 'Доступ заборонено. Увійдіть як адміністратор.';
            } else if (err.response?.data?.detail) {
                errorMessage = err.response.data.detail;
            } else if (err.message) {
                errorMessage = `Помилка: ${err.message}`;
            }

            setPopup({
                open: true,
                message: errorMessage,
                severity: 'error'
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLots();

        // Show success message from navigation state
        if (location.state?.success) {
            setPopup({
                open: true,
                message: location.state.success,
                severity: 'success'
            });
            // Clear the state
            window.history.replaceState({}, document.title);
        }
    }, [location.state]);

    const handleDeleteClick = (lotId, lotName) => {
        setConfirmDialog({
            open: true,
            lotId,
            lotName
        });
    };

    const handleDeleteConfirm = async () => {
        const { lotId, lotName } = confirmDialog;

        try {
            await deleteParkingLot(lotId);
            setLots(lots.filter(lot => lot.id !== lotId));
            setPopup({
                open: true,
                message: `Майданчик "${lotName}" успішно видалено.`,
                severity: 'success'
            });
        } catch (err) {
            console.error('Delete failed:', err.response || err);

            let errorMessage = 'Помилка видалення майданчика.';

            if (err.response?.data?.detail) {
                errorMessage = err.response.data.detail;
            } else if (err.response?.status === 400) {
                errorMessage = 'Не вдалося видалити майданчик. Можливо, він має активні бронювання.';
            } else if (err.message) {
                errorMessage = `Помилка: ${err.message}`;
            }

            setPopup({
                open: true,
                message: errorMessage,
                severity: 'error'
            });
        }
    };

    const handleClosePopup = () => {
        setPopup({ ...popup, open: false });
    };

    const handleCloseConfirm = () => {
        setConfirmDialog({ open: false, lotId: null, lotName: '' });
    };

    return (
        <Container component="main" maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 700 }}>
                    Керування Паркувальними Майданчиками
                </Typography>
                <Button
                    variant="contained"
                    component={Link}
                    to="/admin/lots/create"
                    sx={{ borderRadius: 1 }}
                >
                    + Додати новий
                </Button>
            </Box>

            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 5 }}>
                    <CircularProgress />
                </Box>
            ) : (
                <Box>
                    {lots.length > 0 ? (
                        <ParkingLotsTable lots={lots} onDelete={handleDeleteClick} />
                    ) : (
                        <Typography color="text.secondary">
                            Паркувальних майданчиків поки що немає.
                        </Typography>
                    )}
                </Box>
            )}

            {/* Error/Success Popup */}
            <ErrorPopup
                open={popup.open}
                onClose={handleClosePopup}
                message={popup.message}
                severity={popup.severity}
            />

            {/* Confirm Delete Dialog */}
            <ConfirmDialog
                open={confirmDialog.open}
                onClose={handleCloseConfirm}
                onConfirm={handleDeleteConfirm}
                title="Видалення майданчика"
                message={`Ви впевнені, що хочете видалити майданчик "${confirmDialog.lotName}"?\n\nЦя дія незворотня!`}
                confirmText="Видалити"
                cancelText="Скасувати"
                confirmColor="error"
            />
        </Container>
    );
};

export default ParkingLotListPage;