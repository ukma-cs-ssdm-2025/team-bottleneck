import React, { useState } from 'react';
import { Container } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import ParkingLotForm from '../components/admin/ParkingLotForm';
import { createParkingLot } from '../api/adminAPI';
import ErrorPopup from '../components/common/ErrorPopup';

const ParkingLotCreatePage = () => {
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    // Error popup state
    const [popup, setPopup] = useState({
        open: false,
        message: '',
        severity: 'error'
    });

    const handleSubmit = async (formData) => {
        setLoading(true);

        try {
            await createParkingLot(formData);

            // Navigate with success message
            navigate('/admin/lots', {
                state: { success: 'Паркувальний майданчик успішно створено!' }
            });

        } catch (err) {
            console.error('Error creating parking lot:', err);

            let errorMessage = 'Не вдалося створити майданчик. Перевірте введені дані.';

            if (err.response?.data) {
                const errors = err.response.data;

                // Handle validation errors
                if (typeof errors === 'object' && !Array.isArray(errors)) {
                    const errorMessages = Object.keys(errors)
                        .map(key => {
                            const value = errors[key];
                            const messages = Array.isArray(value) ? value.join(', ') : value;
                            return `${key}: ${messages}`;
                        })
                        .join('\n');
                    errorMessage = `Помилка валідації:\n${errorMessages}`;
                } else if (errors.detail) {
                    errorMessage = errors.detail;
                }
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

    const handleClosePopup = () => {
        setPopup({ ...popup, open: false });
    };

    return (
        <Container component="main" maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <ParkingLotForm
                initialData={null}
                loading={loading}
                onSubmit={handleSubmit}
            />

            {/* Error Popup */}
            <ErrorPopup
                open={popup.open}
                onClose={handleClosePopup}
                message={popup.message}
                severity={popup.severity}
            />
        </Container>
    );
};

export default ParkingLotCreatePage;