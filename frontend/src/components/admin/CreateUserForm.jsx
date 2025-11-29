import React, { useState } from 'react';
import { Box, Button, DialogActions, TextField, Grid } from '@mui/material';

const CreateUserForm = ({ onSubmit, onCancel, initialData = {} }) => {
    const [formData, setFormData] = useState({
        username: initialData.username || '',
        email: initialData.email || '',
        first_name: initialData.first_name || '',
        last_name: initialData.last_name || '',
        password: '',
        password2: '',
    });

    const [errors, setErrors] = useState({});

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });

        if (errors[e.target.name]) {
            setErrors({ ...errors, [e.target.name]: null });
        }
    };

    const validate = () => {
        let formErrors = {};

        if (!formData.username) {
            formErrors.username = 'Імʼя користувача є обовʼязковим.';
        }

        if (!formData.email) {
            formErrors.email = 'Email є обовʼязковим.';
        }

        if (!formData.password) {
            formErrors.password = 'Введіть пароль.';
        } else if (formData.password.length < 8) {
            formErrors.password = 'Пароль має містити щонайменше 8 символів.';
        }

        if (formData.password && formData.password !== formData.password2) {
            formErrors.password2 = 'Паролі не збігаються.';
        }

        setErrors(formErrors);
        return Object.keys(formErrors).length === 0;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (validate()) {
            onSubmit({
                username: formData.username,
                email: formData.email,
                first_name: formData.first_name,
                last_name: formData.last_name,
                password: formData.password,
                password2: formData.password2,
            });
        }
    };

    return (
        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
            <Grid container spacing={2}>
                <Grid item xs={12}>
                    <TextField
                        required
                        fullWidth
                        label="Імʼя користувача"
                        name="username"
                        value={formData.username}
                        onChange={handleChange}
                        error={!!errors.username}
                        helperText={errors.username}
                    />
                </Grid>

                <Grid item xs={12}>
                    <TextField
                        required
                        fullWidth
                        label="Email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleChange}
                        error={!!errors.email}
                        helperText={errors.email}
                    />
                </Grid>

                <Grid item xs={12} sm={6}>
                    <TextField
                        fullWidth
                        label="Імʼя"
                        name="first_name"
                        value={formData.first_name}
                        onChange={handleChange}
                    />
                </Grid>

                <Grid item xs={12} sm={6}>
                    <TextField
                        fullWidth
                        label="Прізвище"
                        name="last_name"
                        value={formData.last_name}
                        onChange={handleChange}
                    />
                </Grid>

                <Grid item xs={12} sm={6}>
                    <TextField
                        required
                        fullWidth
                        label="Пароль"
                        name="password"
                        type="password"
                        value={formData.password}
                        onChange={handleChange}
                        error={!!errors.password}
                        helperText={errors.password}
                    />
                </Grid>

                <Grid item xs={12} sm={6}>
                    <TextField
                        required
                        fullWidth
                        label="Повторіть пароль"
                        name="password2"
                        type="password"
                        value={formData.password2}
                        onChange={handleChange}
                        error={!!errors.password2}
                        helperText={errors.password2}
                    />
                </Grid>
            </Grid>

            <DialogActions sx={{ px: 0, pt: 3 }}>
                <Button onClick={onCancel}>Скасувати</Button>
                <Button type="submit" variant="contained" color="primary">
                    Створити
                </Button>
            </DialogActions>
        </Box>
    );
};

export default CreateUserForm;
