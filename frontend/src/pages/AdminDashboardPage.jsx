import React, { useState } from 'react';
import { 
    Container, Typography, Grid, Card, CardContent, CardActions, Button, 
    Dialog, DialogTitle, DialogContent, DialogActions as ModalActions, TextField, Box 
} from '@mui/material'; 
import { Link, useNavigate } from 'react-router-dom'; 
import { useAuth } from '../context/AuthContext'; 
import { styled } from '@mui/material/styles'; 
import BackupStatusCard from '../components/admin/BackupStatusCard';


const StyledCard = styled(Card)(({ theme }) => ({
    borderRadius: 16, 
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)', 
    transition: 'transform 0.2s, box-shadow 0.2s',
    '&:hover': {
        transform: 'translateY(-2px)',
        boxShadow: '0 6px 16px rgba(0, 0, 0, 0.1)',
    },
}));


const CardHeader = styled(Typography)(({ theme }) => ({
    display: 'flex',
    alignItems: 'center',
    marginBottom: theme.spacing(1),
    fontWeight: 600,
    color: theme.palette.text.primary,
}));


const AdminDashboardPage = () => {
    const { user } = useAuth();
    const navigate = useNavigate(); 
    
    const [isLotSelectOpen, setIsLotSelectOpen] = useState(false);
    const [selectedLotId, setSelectedLotId] = useState('');
    const [lotIdError, setLotIdError] = useState(null);

    const handleOperatorPanelClick = () => {
        setIsLotSelectOpen(true);
    };

    const handleLotSelectSubmit = () => {
        const id = parseInt(selectedLotId);
        if (isNaN(id) || id <= 0) {
            setLotIdError("Введіть коректний ID лоту (число > 0).");
            return;
        }
        
        navigate(`/admin/operator/${id}`); 
        setIsLotSelectOpen(false);
        setSelectedLotId('');
        setLotIdError(null);
    };
    
    return (
        <Container component="main" maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 700 }}>
                Вітаємо, {user?.username || 'Адміністратор'}!
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
                Головна панель управління системою паркування.
            </Typography>
            <Box sx={{ mb: 4, mt: 3 }}>
                <Typography variant="h6" gutterBottom color="text.secondary">
                    Статус Системи (Reliability)
                </Typography>
                <BackupStatusCard />
            </Box>

            <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mt: 4 }}>
                Панель Керування
            </Typography>

            <Grid container spacing={3} sx={{ mt: 1 }}>
                
                <Grid item xs={12} md={6} lg={4}>
                    <StyledCard>
                        <CardContent>
                            <CardHeader variant="h6">
                                Керування Майданчиками
                            </CardHeader>
                            <Typography variant="body2" color="text.secondary">
                                Додавання, редагування та видалення інформації про Lot (вимога FR-003).
                            </Typography>
                        </CardContent>
                        <CardActions sx={{ p: 2, pt: 0 }}>
                            <Button 
                                component={Link} 
                                to="/admin/lots" 
                                size="small" 
                                variant="contained"
                                color="primary"
                                sx={{ borderRadius: 1 }}
                            >
                                Переглянути список
                            </Button>
                            <Button 
                                component={Link} 
                                to="/admin/lots/create" 
                                size="small" 
                                variant="outlined"
                                sx={{ borderRadius: 1 }}
                            >
                                Додати новий
                            </Button>
                        </CardActions>
                    </StyledCard>
                </Grid>

                <Grid item xs={12} md={6} lg={4}>
                    <StyledCard>
                        <CardContent>
                            <CardHeader variant="h6">
                                Керування Ролями
                            </CardHeader>
                            <Typography variant="body2" color="text.secondary">
                                Призначення ролей Адміна/Оператора, керування всіма обліковими записами системи.
                            </Typography>
                        </CardContent>
                        <CardActions sx={{ p: 2, pt: 0 }}>
                            <Button 
                                component={Link} 
                                to="/admin/users" 
                                size="small" 
                                variant="contained"
                                color="success" 
                                sx={{ borderRadius: 1 }}
                            >
                                Перейти до управління
                            </Button>
                        </CardActions>
                    </StyledCard>
                </Grid>
                
                <Grid item xs={12} md={6} lg={4}>
                    <StyledCard>
                        <CardContent>
                            <CardHeader variant="h6">
                                Панель Оператора (Адмін)
                            </CardHeader>
                            <Typography variant="body2" color="text.secondary">
                                Перегляд бронювань, управління паркомісцями та скасуванням для будь-якого Lot.
                            </Typography>
                        </CardContent>
                        <CardActions sx={{ p: 2, pt: 0 }}>
                            <Button 
                                onClick={handleOperatorPanelClick} 
                                size="small" 
                                variant="contained"
                                color="secondary" 
                                sx={{ borderRadius: 1 }}
                            >
                                Керувати Лотом (Lot ID)
                            </Button>
                        </CardActions>
                    </StyledCard>
                </Grid>                
            </Grid>
            
          
            <Dialog 
                open={isLotSelectOpen} 
                onClose={() => setIsLotSelectOpen(false)}
                PaperProps={{ style: { borderRadius: 12 } }} 
            >
                <DialogTitle sx={{ fontWeight: 600 }}>Оберіть Лот для Керування</DialogTitle>
                <DialogContent>
                    <Box sx={{ pt: 1 }}>
                        <Typography color="text.secondary" sx={{ mb: 1 }}>
                            Введіть ID паркувального майданчика, яким ви хочете керувати як оператор.
                        </Typography>
                        <TextField
                            autoFocus
                            margin="dense"
                            label="ID Паркувального Майданчика (Lot ID)"
                            type="number"
                            fullWidth
                            variant="outlined"
                            size="small"
                            value={selectedLotId}
                            onChange={(e) => {
                                setSelectedLotId(e.target.value);
                                setLotIdError(null);
                            }}
                            error={!!lotIdError}
                            helperText={lotIdError}
                            sx={{ mt: 1 }}
                        />
                    </Box>
                </DialogContent>
                <ModalActions>
                    <Button onClick={() => setIsLotSelectOpen(false)}>Скасувати</Button>
                    <Button 
                        onClick={handleLotSelectSubmit} 
                        color="primary" 
                        variant="contained"
                        disabled={!selectedLotId}
                    >
                        Перейти до Панелі
                    </Button>
                </ModalActions>
            </Dialog>
        </Container>
    );
};

export default AdminDashboardPage;