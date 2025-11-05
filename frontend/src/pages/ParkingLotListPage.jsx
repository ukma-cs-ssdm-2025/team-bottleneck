

import React, { useState, useEffect } from 'react';
import { Container, Typography, Alert, CircularProgress, Box, Button } from '@mui/material';
import { useLocation, Link } from 'react-router-dom';
import { getAdminParkingLots, deleteParkingLot } from '../api/adminAPI';
import ParkingLotsTable from '../components/admin/ParkingLotsTable'; 

const ParkingLotListPage = () => {
    const [lots, setLots] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const location = useLocation(); 
    const successMessage = location.state?.success;

    const fetchLots = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await getAdminParkingLots();
            const data = Array.isArray(response) ? response : response.results; 
            
            setLots(data || []); 
        } catch (err) {
            console.error('Failed to fetch parking lots:', err.response || err);
            if (err.response && err.response.status === 403) {
                 setError('Доступ заборонено. Увійдіть як адміністратор.');
            } else {
                 setError('Не вдалося завантажити список паркувальних майданчиків.');
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLots();
    }, []);
    
    const handleDelete = async (lotId, lotName) => {
        if (!window.confirm(`Ви впевнені, що хочете видалити майданчик "${lotName}"? \nЦя дія незворотня!`)) {
            return;
        }
        try {
            await deleteParkingLot(lotId);
            setLots(lots.filter(lot => lot.id !== lotId));
            alert(`Майданчик "${lotName}" успішно видалено.`);
        } catch (err) {
            console.error('Delete failed:', err.response || err);
            
            setError(err.response?.data?.detail || 'Помилка видалення майданчика. Можливо, він має активні бронювання.');
        }
    };


    return (
        <Container component="main" maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4" gutterBottom>
                    Керування Паркувальними Майданчиками
                </Typography>
                <Button 
                    variant="contained" 
                    component={Link} 
                    to="/admin/lots/create"
                >
                    + Додати новий
                </Button>
            </Box>

            {successMessage && (
                <Alert severity="success" sx={{ mb: 2 }}>{successMessage}</Alert>
            )}

            {error && (
                <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
            )}

            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 5 }}><CircularProgress /></Box>
            ) : (
                <Box>
                    {lots.length > 0 ? (
                        <ParkingLotsTable lots={lots} onDelete={handleDelete} />
                    ) : (
                        <Typography color="text.secondary">Паркувальних майданчиків поки що немає.</Typography>
                    )}
                </Box>
            )}
        </Container>
    );
};

export default ParkingLotListPage;