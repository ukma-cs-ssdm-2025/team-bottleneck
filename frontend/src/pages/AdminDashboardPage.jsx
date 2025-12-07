import React, { useState } from 'react';
import { Container, Typography, Grid, Card, CardContent, CardActions, Button, Dialog, DialogTitle, DialogContent, DialogActions, Box, Select, MenuItem, FormControl, InputLabel, FormHelperText, CircularProgress } from '@mui/material';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { styled } from '@mui/material/styles';
import BackupStatusCard from '../components/admin/BackupStatusCard';
import { getAdminParkingLots } from '../api/adminAPI';
import ErrorPopup from '../components/common/ErrorPopup';

const StyledCard = styled(Card)(({ theme }) => ({
    borderRadius: 16,
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
    transition: 'transform 0.2s, box-shadow 0.2s',
    '&:hover': {
        transform: 'translateY(-2px)',
        boxShadow: '0 6px 16px rgba(0, 0, 0, 0.1)',
    },
}));

const CardHeader = styled(Typography)(({ theme }) => ({
    display: 'flex',
    alignItems: 'center',
    marginBottom: theme.spacing(1),
    fontWeight: 600,
    color: theme.palette.text.primary,
}));

const AdminDashboardPage = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [isLotSelectOpen, setIsLotSelectOpen] = useState(false);
    const [selectedLotId, setSelectedLotId] = useState('');
    const [lotIdError, setLotIdError] = useState(null);
    const [lots, setLots] = useState([]);
    const [lotsLoading, setLotsLoading] = useState(false);
    const [popup, setPopup] = useState({ open: false, message: '', severity: 'error' });

    const handleOperatorPanelClick = async () => {
        setIsLotSelectOpen(true);
        setLotsLoading(true);
        setLotIdError(null);

        try {
            const fetchedLots = await getAdminParkingLots();
            setLots(fetchedLots);
        } catch (error) {
            console.error('Failed to fetch lots:', error);
            let errorMessage = 'Не вдалося завантажити список лотів.';
            if (error.response?.status === 403) {
                errorMessage = 'Доступ заборонено. Увійдіть як адміністратор.';
            } else if (error.response?.data?.detail) {
                errorMessage = error.response.data.detail;
            } else if (error.message) {
                errorMessage = `Помилка: ${error.message}`;
            }
            setLotIdError(errorMessage);
        } finally {
            setLotsLoading(false);
        }
    };

    const handleLotSelectSubmit = () => {
        if (!selectedLotId) {
            setLotIdError("Оберіть лот зі списку.");
            return;
        }
        navigate(`/admin/operator/${selectedLotId}`);
        setIsLotSelectOpen(false);
        setSelectedLotId('');
        setLotIdError(null);
    };

    const handleDialogClose = () => {
        setIsLotSelectOpen(false);
        setSelectedLotId('');
        setLotIdError(null);
    };

    const handleClosePopup = () => {
        setPopup({ ...popup, open: false });
    };

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Typography variant="h4" gutterBottom>
                Вітаємо, {user?.first_name || user?.username || 'Адміністратор'}!
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
                Головна панель управління системою паркування.
            </Typography>

            <Grid container spacing={3}>
                <Grid item xs={12}>
                    <BackupStatusCard />
                </Grid>

                <Grid item xs={12} md={4}>
                    <StyledCard>
                        <CardContent>
                            <CardHeader variant="h6">
                                Керування майданчиками
                            </CardHeader>
                            <Typography variant="body2" color="text.secondary">
                                Додавання, редагування та видалення інформації про парковки
                            </Typography>
                        </CardContent>
                        <CardActions>
                            <Button 
                                component={Link} 
                                to="/admin/parking-lots" 
                                size="small" 
                                color="primary"
                            >
                                Переглянути список
                            </Button>
                            <Button 
                                component={Link} 
                                to="/admin/parking-lots/new" 
                                size="small" 
                                color="primary"
                            >
                                Додати новий
                            </Button>
                        </CardActions>
                    </StyledCard>
                </Grid>

                <Grid item xs={12} md={4}>
                    <StyledCard>
                        <CardContent>
                            <CardHeader variant="h6">
                                Керування ролями
                            </CardHeader>
                            <Typography variant="body2" color="text.secondary">
                                Керування всіма обліковими записами системи.
                            </Typography>
                        </CardContent>
                        <CardActions>
                            <Button 
                                component={Link} 
                                to="/admin/users" 
                                size="small" 
                                color="primary"
                            >
                                Перейти до управління
                            </Button>
                        </CardActions>
                    </StyledCard>
                </Grid>

                <Grid item xs={12} md={4}>
                    <StyledCard>
                        <CardContent>
                            <CardHeader variant="h6">
                                Керування парковками
                            </CardHeader>
                            <Typography variant="body2" color="text.secondary">
                                Управління паркомісцями та бронюваннями певної парковки
                            </Typography>
                        </CardContent>
                        <CardActions>
                            <Button 
                                onClick={handleOperatorPanelClick} 
                                size="small" 
                                color="primary"
                            >
                                Керувати Лотом
                            </Button>
                        </CardActions>
                    </StyledCard>
                </Grid>
            </Grid>

            {/* Lot Selection Dialog */}
            <Dialog open={isLotSelectOpen} onClose={handleDialogClose} maxWidth="sm" fullWidth>
                <DialogTitle>Оберіть Лот для Керування</DialogTitle>
                <DialogContent>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Оберіть паркувальний майданчик, яким ви хочете керувати як оператор.
                    </Typography>
                    {lotsLoading ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
                            <CircularProgress />
                        </Box>
                    ) : (
                        <FormControl fullWidth error={!!lotIdError}>
                            <InputLabel id="lot-select-label">Паркувальний Майданчик</InputLabel>
                            <Select
                                labelId="lot-select-label"
                                value={selectedLotId}
                                onChange={(e) => {
                                    setSelectedLotId(e.target.value);
                                    setLotIdError(null);
                                }}
                                label="Паркувальний Майданчик"
                            >
                                {lots.length === 0 ? (
                                    <MenuItem value="" disabled>
                                        Немає доступних лотів
                                    </MenuItem>
                                ) : (
                                    lots.map((lot) => (
                                        <MenuItem key={lot.id} value={lot.id}>
                                            ID: {lot.id} - {lot.name}
                                        </MenuItem>
                                    ))
                                )}
                            </Select>
                            {lotIdError && (
                                <FormHelperText>{lotIdError}</FormHelperText>
                            )}
                        </FormControl>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleDialogClose}>Скасувати</Button>
                    <Button 
                        onClick={handleLotSelectSubmit} 
                        variant="contained" 
                        disabled={!selectedLotId || lotsLoading}
                    >
                        Перейти до Панелі
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Error Popup */}
            <ErrorPopup
                open={popup.open}
                message={popup.message}
                onClose={handleClosePopup}
                severity={popup.severity}
            />
        </Container>
    );
};

export default AdminDashboardPage;