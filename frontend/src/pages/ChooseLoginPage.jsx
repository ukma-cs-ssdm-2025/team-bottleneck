import React from 'react';
import { Container, Box, Typography, Button, Paper, Grid } from '@mui/material';
import { Link } from 'react-router-dom';

function ChooseLoginPage() {
    return (
        <Container component="main" maxWidth="sm">
            <Paper elevation={3} sx={{ mt: 8, p: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', borderRadius: 2 }}>
                <Typography component="h1" variant="h4" sx={{ mb: 4, fontWeight: 500, color: 'primary.main' }}>
                    Оберіть Тип Входу
                </Typography>
                <Grid container spacing={3} sx={{ width: '100%', maxWidth: 450 }}>
                    
                    <Grid item xs={12} md={4}>
                        <Button
                            component={Link}
                            to="/user/login"
                            variant="contained"
                            color="primary"
                            fullWidth
                            size="large"
                            sx={{ py: 2, height: '100%', boxShadow: 4, transition: 'transform 0.2s', '&:hover': { transform: 'translateY(-2px)' } }}
                        >
                            Я ЗВИЧАЙНИЙ КОРИСТУВАЧ
                        </Button>
                    </Grid>
                    
                    <Grid item xs={12} md={4}>
                        <Button
                            component={Link}
                            to="/operator/login"
                            variant="outlined"
                            color="primary"
                            fullWidth
                            size="large"
                            sx={{ py: 2, height: '100%', borderColor: 'primary.main', borderWidth: 2, boxShadow: 4, transition: 'transform 0.2s', '&:hover': { transform: 'translateY(-2px)', backgroundColor: 'primary.main', color: 'white' } }}
                        >
                            Я ОПЕРАТОР
                        </Button>
                    </Grid>
                    
                    <Grid item xs={12} md={4}>
                        <Button
                            component={Link}
                            to="/admin/login" 
                            variant="contained"
                            color="secondary" 
                            fullWidth
                            size="large"
                            sx={{ py: 2, height: '100%', boxShadow: 4, transition: 'transform 0.2s', '&:hover': { transform: 'translateY(-2px)' } }}
                        >
                            Я АДМІНІСТРАТОР
                        </Button>
                    </Grid>
                </Grid>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 4, textAlign: 'center' }}>
                    Якщо у вас ще немає облікового запису, ви можете <Link to="/register" style={{ color: '#1976d2', textDecoration: 'none', fontWeight: 'bold' }}>зареєструватися тут</Link>.
                </Typography>
            </Paper>
        </Container>
    );
}

export default ChooseLoginPage;