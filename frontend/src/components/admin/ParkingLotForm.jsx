

import React, { useState, useEffect } from 'react';
import { Box, TextField, Button, Grid, Typography, CircularProgress, Alert } from '@mui/material';


const initialFormState = {
    name: '',
    city: '', 
    street: '',
    hourly_rate: 0.00,
    additional_services: '', 
};

const ParkingLotForm = ({ initialData, loading, onSubmit, error }) => {
    const [formData, setFormData] = useState(initialData || initialFormState);

    useEffect(() => {
        if (initialData) {
            
            setFormData({
                ...initialData,
                hourly_rate: initialData.hourly_rate ? initialData.hourly_rate.toString() : '',
                
                additional_services: initialData.additional_services || '', 
            });
        }
    }, [initialData]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        
        const dataToSend = {
            name: formData.name,
            city: formData.city,
            street: formData.street,
            hourly_rate: Number(formData.hourly_rate) || 0,
            
            additional_services: formData.additional_services || null, 
        };

        onSubmit(dataToSend);
    };

    const isEditing = !!initialData;

    return (
        <Box 
            component="form" 
            onSubmit={handleSubmit} 
            noValidate 
            sx={{ mt: 3, maxWidth: 600, mx: 'auto' }}
        >
            <Typography variant="h5" gutterBottom>
                {isEditing ? 'Редагувати Майданчик' : 'Створити Новий Майданчик'}
            </Typography>
            
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            <Grid container spacing={2}>
                <Grid item xs={12}>
                    <TextField
                        required
                        fullWidth
                        label="Назва майданчика"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        disabled={loading}
                    />
                </Grid>
                {/* ... (City та Street) ... */}
                <Grid item xs={12} sm={6}>
                    <TextField
                        required
                        fullWidth
                        label="Місто"
                        name="city"
                        value={formData.city}
                        onChange={handleChange}
                        disabled={loading}
                    />
                </Grid>
                <Grid item xs={12} sm={6}>
                    <TextField
                        required
                        fullWidth
                        label="Вулиця"
                        name="street"
                        value={formData.street}
                        onChange={handleChange}
                        disabled={loading}
                    />
                </Grid>
                {/* ... (Hourly Rate) ... */}
                <Grid item xs={12}>
                    <TextField
                        required
                        fullWidth
                        label="Погодинна ставка (грн)"
                        name="hourly_rate"
                        type="number"
                        inputProps={{ step: "0.01", min: "0" }}
                        value={formData.hourly_rate}
                        onChange={handleChange}
                        disabled={loading}
                    />
                </Grid>

                
                <Grid item xs={12}>
                    <TextField
                        fullWidth
                        label="Додаткові сервіси (напр., Мийка, Підкачка шин)"
                        name="additional_services"
                        multiline
                        rows={2}
                        value={formData.additional_services}
                        onChange={handleChange}
                        disabled={loading}
                        helperText="Введіть перелік сервісів через кому або описом."
                    />
                </Grid>
                
                <Grid item xs={12}>
                    <Button
                        type="submit"
                        fullWidth
                        variant="contained"
                        sx={{ mt: 2, py: 1.5 }}
                        disabled={loading}
                    >
                        {loading ? <CircularProgress size={24} color="inherit" /> : (isEditing ? 'ЗБЕРЕГТИ ЗМІНИ' : 'СТВОРИТИ МАЙДАНЧИК')}
                    </Button>
                </Grid>
            </Grid>
        </Box>
    );
};

export default ParkingLotForm;