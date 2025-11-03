import React, { useState, useEffect } from 'react';
import { Container, Alert, Box, Typography, CircularProgress } from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import ParkingLotForm from '../components/admin/ParkingLotForm';
import { getParkingLotDetails, updateParkingLot } from '../api/adminAPI'; 
const ParkingLotEditPage = () => {
    const { id } = useParams(); 
    const navigate = useNavigate();
    

    const [initialData, setInitialData] = useState(null); 
    const [loading, setLoading] = useState(true); 
    const [error, setError] = useState(null); 
    const [isSaving, setIsSaving] = useState(false); 

    useEffect(() => {
        const fetchDetails = async () => {
            setLoading(true);
            try {
              
                const data = await getParkingLotDetails(id); 
                
              
                setInitialData(data);
                setError(null);
            } catch (err) {
                console.error(`Error fetching lot ${id}:`, err);
                setError('Не вдалося завантажити дані майданчика для редагування. Перевірте, чи існує ID.');
            } finally {
                setLoading(false);
            }
        };
        fetchDetails();
    }, [id]);

  
    const handleSubmit = async (formData) => {
        setIsSaving(true);
        setError(null);

        try {
            
            await updateParkingLot(id, formData);
            
            
            navigate('/admin/lots', { state: { success: `Майданчик "${formData.name}" успішно оновлено!` } });

        } catch (err) {
            console.error('Error updating parking lot:', err.response || err);
            
            let errorMessage = 'Не вдалося зберегти зміни. Перевірте введені дані.';
            if (err.response && err.response.data) {
                const errors = err.response.data;
                
                if (typeof errors === 'object' && !Array.isArray(errors)) {
                    errorMessage = Object.keys(errors)
                        .map(key => `${key.toUpperCase()}: ${errors[key].join(' ')}`)
                        .join('; ');
                } else if (errors.detail) {
                    errorMessage = errors.detail;
                }
            }
            setError(`Помилка: ${errorMessage}`);
        } finally {
            setIsSaving(false);
        }
    };

    if (loading) {
        return (
            <Container sx={{ display: 'flex', justifyContent: 'center', mt: 5 }}><CircularProgress /></Container>
        );
    }

   
    if (error && !initialData) {
        return (
            <Container sx={{ mt: 5 }}><Alert severity="error">{error}</Alert></Container>
        );
    }
    
    return (
        <Container component="main" maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Box sx={{ maxWidth: 600, mx: 'auto' }}>
                <Typography variant="h4" gutterBottom>
                    Редагування Майданчика: {initialData?.name}
                </Typography>
            </Box>
            
           
            {initialData && (
                <ParkingLotForm
                    initialData={initialData} 
                    loading={isSaving} 
                    onSubmit={handleSubmit}
                    error={error}
                />
            )}
        </Container>
    );
};

export default ParkingLotEditPage;