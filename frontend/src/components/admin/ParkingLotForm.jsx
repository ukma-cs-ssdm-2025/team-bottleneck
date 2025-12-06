import { useState, useEffect } from 'react';
import { Box, TextField, Button, Grid, Typography, CircularProgress, Alert } from '@mui/material';


const initialFormState = {
    name: '',
    city: '',
    street: '',
    building: '',
    base_price_per_hour: '',
    description: '',
    latitude: '',
    longitude: '',
};

const ParkingLotForm = ({ initialData, loading, onSubmit, error }) => {
    const [formData, setFormData] = useState(initialData || initialFormState);

    useEffect(() => {
        if (initialData) {
            setFormData({
                ...initialData,
                base_price_per_hour: initialData.base_price_per_hour ? initialData.base_price_per_hour.toString() : '',
                description: initialData.description || '',
                building: initialData.building || '',
                latitude: initialData.latitude !== null && initialData.latitude !== undefined ? initialData.latitude.toString() : '',
                longitude: initialData.longitude !== null && initialData.longitude !== undefined ? initialData.longitude.toString() : '',
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
            building: formData.building || null,
            base_price_per_hour: formData.base_price_per_hour ? Number(formData.base_price_per_hour) : null,
            description: formData.description || null,
            latitude: formData.latitude ? Number(formData.latitude) : null,
            longitude: formData.longitude ? Number(formData.longitude) : null,
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
            <Typography variant="h5" gutterBottom sx={{ fontWeight: 600 }}>
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

                <Grid item xs={12}>
                    <TextField
                        fullWidth
                        label="Номер будинку"
                        name="building"
                        value={formData.building}
                        onChange={handleChange}
                        disabled={loading}
                    />
                </Grid>

                <Grid item xs={12}>
                    <TextField
                        fullWidth
                        label="Базова ціна за годину (грн)"
                        name="base_price_per_hour"
                        type="number"
                        inputProps={{ step: "0.01", min: "0" }}
                        value={formData.base_price_per_hour}
                        onChange={handleChange}
                        disabled={loading}
                        helperText="Вкажіть базову вартість паркування за годину"
                    />
                </Grid>

                <Grid item xs={12}>
                    <TextField
                        fullWidth
                        label="Опис"
                        name="description"
                        multiline
                        rows={3}
                        value={formData.description}
                        onChange={handleChange}
                        disabled={loading}
                        helperText="Додайте опис майданчика, особливості, доступні послуги тощо"
                    />
                </Grid>

                <Grid item xs={12} sm={6}>
                    <TextField
                        fullWidth
                        label="Широта (Latitude)"
                        name="latitude"
                        type="number"
                        inputProps={{ step: "any" }}
                        value={formData.latitude}
                        onChange={handleChange}
                        disabled={loading}
                        helperText="Географічна широта (-90 до 90)"
                    />
                </Grid>
                <Grid item xs={12} sm={6}>
                    <TextField
                        fullWidth
                        label="Довгота (Longitude)"
                        name="longitude"
                        type="number"
                        inputProps={{ step: "any" }}
                        value={formData.longitude}
                        onChange={handleChange}
                        disabled={loading}
                        helperText="Географічна довгота (-180 до 180)"
                    />
                </Grid>

                <Grid item xs={12}>
                    <Button
                        type="submit"
                        fullWidth
                        variant="contained"
                        sx={{ mt: 2, py: 1.5, borderRadius: 1 }}
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