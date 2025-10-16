import React from 'react';
import { Typography, Container, Alert, Box } from '@mui/material';

function ProfilePage() {
    return (
        <Container sx={{ mt: 4, mb: 4 }}>
            <Typography variant="h1" gutterBottom>
                Мої бронювання
            </Typography>
            <Box sx={{ mt: 4 }}>
                <Alert severity="info">
                    Це сторінка вашого профілю. Для перегляду історії бронювань, будь ласка, увійдіть в систему.
                </Alert>
            </Box>
        </Container>
    );
}
export default ProfilePage;