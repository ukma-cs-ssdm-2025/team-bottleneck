

import React from 'react';
import { Container, Typography, Grid, Card, CardContent, CardActions, Button } from '@mui/material';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; 


const AdminDashboardPage = () => {
    const { user } = useAuth();
    
    return (
        <Container component="main" maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Typography variant="h4" component="h1" gutterBottom>
                👋 Вітаємо, {user?.username || 'Адміністратор'}!
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
                Це головна панель управління системою паркування.
            </Typography>

            <Grid container spacing={3} sx={{ mt: 2 }}>
                
                
                <Grid item xs={12} md={6} lg={4}>
                    <Card elevation={3}>
                        <CardContent>
                            <Typography variant="h6" component="div" gutterBottom>
                                🅿️ Керування Майданчиками
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Додавання, редагування та видалення інформації про Lot (вимога FR-003).
                            </Typography>
                        </CardContent>
                        <CardActions>
                            <Button 
                                component={Link} 
                                to="/admin/lots" 
                                size="small" 
                                variant="contained"
                            >
                                Переглянути список
                            </Button>
                            <Button 
                                component={Link} 
                                to="/admin/lots/create" 
                                size="small" 
                                variant="outlined"
                            >
                                Додати новий
                            </Button>
                        </CardActions>
                    </Card>
                </Grid>

                
                <Grid item xs={12} md={6} lg={4}>
                    <Card elevation={3}>
                        <CardContent>
                            <Typography variant="h6" component="div" gutterBottom>
                                👥 Керування Ролями
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Призначення ролей Адміна/Оператора, керування всіма обліковими записами системи.
                            </Typography>
                        </CardContent>
                        <CardActions>
                            <Button 
                                component={Link} 
                                to="/admin/users" 
                                size="small" 
                                variant="contained"
                            >
                                Перейти до управління
                            </Button>
                        </CardActions>
                    </Card>
                </Grid>

                
                <Grid item xs={12} md={6} lg={4}>
                    <Card elevation={3}>
                        <CardContent>
                            <Typography variant="h6" component="div" gutterBottom>
                                💾 Керування Бекапами
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Моніторинг автоматичних бекапів (NFR-003) та надійність системи.
                            </Typography>
                        </CardContent>
                        <CardActions>
                            <Button size="small" variant="outlined" disabled>
                                Моніторинг бекапів (в розробці)
                            </Button>
                        </CardActions>
                    </Card>
                </Grid>
                
            </Grid>
        </Container>
    );
};

export default AdminDashboardPage;