import React, { useState, useEffect } from 'react';
import { Container, Box, Typography, CircularProgress } from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import ParkingLotForm from '../components/admin/ParkingLotForm';
import { getParkingLotDetails, updateParkingLot } from '../api/adminAPI';
import ErrorPopup from '../components/common/ErrorPopup';

const ParkingLotEditPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [initialData, setInitialData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    // Error popup state
    const [popup, setPopup] = useState({
        open: false,
        message: '',
        severity: 'error'
    });

    useEffect(() => {
        const fetchDetails = async () => {
            setLoading(true);
            try {
                const data = await getParkingLotDetails(id);
                setInitialData(data);
            } catch (err) {
                console.error(`Error fetching lot ${id}:`, err);

                let errorMessage = 'Не вдалося завантажити дані майданчика для редагування.';

                if (err.response?.status === 404) {
                    errorMessage = `Майданчик з ID ${id} не знайдено.`;
                } else if (err.response?.status === 403) {
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
        fetchDetails();
    }, [id]);

    const handleSubmit = async (formData) => {
        setIsSaving(true);

        try {
            await updateParkingLot(id, formData);

            // Navigate with success message
            navigate('/admin/lots', {
                state: { success: `Майданчик "${formData.name}" успішно оновлено!` }
            });

        } catch (err) {
            console.error('Error updating parking lot:', err.response || err);

            let errorMessage = 'Не вдалося зберегти зміни. Перевірте введені дані.';

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
            setIsSaving(false);
        }
    };

    const handleClosePopup = () => {
        setPopup({ ...popup, open: false });
    };

    if (loading) {
        return (
            <Container sx={{ display: 'flex', justifyContent: 'center', mt: 5 }}>
                <CircularProgress />
            </Container>
        );
    }

    // If failed to load and no data, show error state
    if (!initialData) {
        return (
            <Container component="main" maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
                <Box sx={{ textAlign: 'center', mt: 5 }}>
                    <Typography variant="h5" color="error" gutterBottom>
                        Не вдалося завантажити дані майданчика
                    </Typography>
                    <Typography color="text.secondary">
                        Перевірте правильність ID або спробуйте пізніше.
                    </Typography>
                </Box>

                <ErrorPopup
                    open={popup.open}
                    onClose={handleClosePopup}
                    message={popup.message}
                    severity={popup.severity}
                />
            </Container>
        );
    }

    return (
        <Container component="main" maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Box sx={{ maxWidth: 600, mx: 'auto' }}>
                <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 700 }}>
                    Редагування Майданчика: {initialData?.name}
                </Typography>
            </Box>

            <ParkingLotForm
                initialData={initialData}
                loading={isSaving}
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

export default ParkingLotEditPage;