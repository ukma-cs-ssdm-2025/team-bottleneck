import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Typography, Container, Button, Box, Alert, CircularProgress,
    Card, CardContent, TextField, Switch, FormControlLabel, Grid
} from '@mui/material';
import { useAuth } from '../context/AuthContext';
import { createSpot } from '../api/operatorAPI';

function SpotCreatePage() {
    const { lotId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();

    const [formData, setFormData] = useState({
        number: '',
        is_ev: false,
        is_disabled: false,
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);

    const lotName = user?.lotDetails?.name || `Лот ID ${lotId}`;

   
    const isUserAdmin = user?.is_staff;
    const backPath = isUserAdmin ? `/admin/operator/${lotId}` : '/operator';

    const handleChange = (e) => {
        const { name, value, checked, type } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setSuccessMessage(null);
        setLoading(true);

        if (!formData.number.trim()) {
            setError('Номер паркомісця є обов\'язковим.');
            setLoading(false);
            return;
        }

        try {
            await createSpot(lotId, formData);

            const successMsg = `Паркомісце #${formData.number} успішно створено.`;
            setSuccessMessage(successMsg);
            setFormData({ number: '', is_ev: false, is_disabled: false });

           
            navigate(backPath, { state: { successMessage: successMsg } });

        } catch (err) {
            console.error('Error creating spot:', err);
            if (err.response && err.response.status === 400) {
                const detail = err.response?.data?.detail || 'Некоректні дані для створення паркомісця.';
                setError(detail);
            } else if (err.response && err.response.status === 403) {
                setError('У вас немає доступу до створення паркомісць у цій парковці.');
            } else if (err.response && err.response.status === 404) {
                setError('Парковку не знайдено.');
            } else if (err.response && err.response.status === 409) {
                 const conflictError = err.response?.data?.number 
                    ? err.response.data.number.join(' ') 
                    : 'Паркомісце з таким номером вже існує. Оберіть інший номер.';
                setError(conflictError);
            } else if (err.response && err.response.status === 500) {
                setError('Сервер тимчасово недоступний. Спробуйте пізніше.');
            } else if (err.request) {
                setError('Не вдалося з\'єднатися з сервером. Перевірте інтернет-з\'єднання.');
            } else {
                setError('Не вдалося створити паркомісце. Спробуйте ще раз.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container component="main" maxWidth="md" sx={{ mt: 4 }}>
            <Button onClick={() => navigate(backPath)} sx={{ mb: 3 }} variant="outlined">
                &larr; Назад до Панелі Керування
            </Button>

            <Typography variant="h4" gutterBottom>
                Створити Нове Паркомісце в Лоті: {lotName}
            </Typography>

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            {successMessage && <Alert severity="success" sx={{ mb: 2 }}>{successMessage}</Alert>}

            <Card variant="outlined" sx={{ p: 3 }}>
                <CardContent>
                    <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
                        <TextField
                            label="Номер Паркомісця (наприклад, A1, P10)"
                            name="number"
                            value={formData.number}
                            onChange={handleChange}
                            fullWidth
                            required
                            margin="normal"
                            disabled={loading}
                        />

                        <Grid container spacing={3} sx={{ mt: 2 }}>
                            <Grid item xs={12} sm={6}>
                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={formData.is_ev}
                                            onChange={handleChange}
                                            name="is_ev"
                                            disabled={loading}
                                        />
                                    }
                                    label="Місце для електромобілів (EV)"
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={formData.is_disabled}
                                            onChange={handleChange}
                                            name="is_disabled"
                                            disabled={loading}
                                        />
                                    }
                                    label="Місце для людей з інвалідністю"
                                />
                            </Grid>
                        </Grid>

                        <Button
                            type="submit"
                            variant="contained"
                            color="primary"
                            sx={{ mt: 3, py: 1.5 }}
                            disabled={loading}
                        >
                            {loading ? <CircularProgress size={24} color="inherit" /> : 'Створити Паркомісце'}
                        </Button>
                    </Box>
                </CardContent>
            </Card>
        </Container>
    );
}

export default SpotCreatePage;