import React from 'react';
import { Typography, Container } from '@mui/material';

function ProfilePage() {
  return (
    <Container sx={{ mt: 4 }}>
      <Typography variant="h1">Профіль користувача</Typography>
      <Typography>Тут буде історія бронювань...</Typography>
    </Container>
  );
}

export default ProfilePage;