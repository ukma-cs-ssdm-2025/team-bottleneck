import React, { useState } from 'react';
import { Container, Alert } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import ParkingLotForm from '../components/admin/ParkingLotForm';
import { createParkingLot } from '../api/adminAPI'; 

const ParkingLotCreatePage = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    const handleSubmit = async (formData) => {
        setLoading(true);
        setError(null);

        try {
            await createParkingLot(formData);
            
           
            navigate('/admin/lots', { state: { success: 'Паркувальний майданчик успішно створено!' } });

        } catch (err) {
            console.error('Error creating parking lot:', err);
            
            let errorMessage = 'Не вдалося створити майданчик. Перевірте введені дані.';
            if (err.response && err.response.data) {
                
                const detail = err.response.data.detail || JSON.stringify(err.response.data);
                errorMessage = `Помилка: ${detail}`;
            }
            setError(errorMessage);

        } finally {
            setLoading(false);
        }
    };

    return (
        <Container component="main" maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            
            <ParkingLotForm
                initialData={null} 
                onSubmit={handleSubmit}
                error={error}
            />
        </Container>
    );
};

export default ParkingLotCreatePage;