import React, { useState, useEffect } from 'react';
import { 
    Container, Box, Typography, Alert, CircularProgress, 
    Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField 
} from '@mui/material';
import UserManagementTable from '../components/admin/UserManagementTable'; 
import { getAllUsers, makeOperator, removeOperator, makeAdmin, removeAdmin } from '../api/adminAPI';

const UserManagementPage = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [actionStatus, setActionStatus] = useState(null); 
    
    const [operatorModal, setOperatorModal] = useState({ open: false, userId: null, lotId: '' });

    const fetchUsers = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await getAllUsers();
            setUsers(data.map(user => ({ 
                ...user, 
                id: String(user.id),
                is_admin: user.is_staff 
            })));
        } catch (err) {
            console.error('Error fetching users:', err.response || err); 
            setError('Не вдалося завантажити список користувачів.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleAction = async (userId, actionType, lotId = null) => {
        setError(null);
        setActionStatus(null);
        
        try {
            if (actionType === 'make-operator') {
                await makeOperator(userId, lotId);
            } else if (actionType === 'remove-operator') {
                await removeOperator(userId);
            } else if (actionType === 'make-admin') {
                await makeAdmin(userId);
            } else if (actionType === 'remove-admin') {
                await removeAdmin(userId);
            }

            setActionStatus({ severity: 'success', message: `Роль користувача ID ${userId} успішно змінено.` });
            fetchUsers();
        } catch (err) {

            console.error('Error during role change:', err.response || err);
            let message = 'Не вдалося виконати дію. Перевірте дозволи або ID лоту.';
            
            if (err.response?.data?.detail) {
                message = `Помилка: ${err.response.data.detail}`; 
            } else if (err.message) {
                 message = `Помилка: ${err.message}`;
            }
            setActionStatus({ severity: 'error', message });
        }
    };

    const handleMakeOperatorClick = (userId) => {
        setOperatorModal({ open: true, userId: userId, lotId: '' });
    };

    const handleMakeOperatorConfirm = () => {
        if (operatorModal.userId && operatorModal.lotId) {
            handleAction(operatorModal.userId, 'make-operator', operatorModal.lotId);
        }
        setOperatorModal({ open: false, userId: null, lotId: '' });
    };


    if (loading) {
        return (
            <Container sx={{ display: 'flex', justifyContent: 'center', mt: 5 }}><CircularProgress /></Container>
        );
    }

    if (error && !users.length) {
        return (
            <Container sx={{ mt: 5 }}><Alert severity="error">{error}</Alert></Container>
        );
    }

    return (
        <Container component="main" maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4" gutterBottom>
                    Керування Користувачами та Ролями
                </Typography>
                <Button 
                    variant="contained" 
                    color="primary" 
                    disabled 
                >
                    Створити Користувача
                </Button>
            </Box>
            
            {actionStatus && (
                <Alert severity={actionStatus.severity} onClose={() => setActionStatus(null)} sx={{ mb: 2 }}>
                    {actionStatus.message}
                </Alert>
            )}

            <UserManagementTable 
                users={users}
                onMakeOperator={handleMakeOperatorClick}
                onRemoveOperator={(userId) => handleAction(userId, 'remove-operator')}
                onMakeAdmin={(userId) => handleAction(userId, 'make-admin')}
                onRemoveAdmin={(userId) => handleAction(userId, 'remove-admin')}
            />

            <Dialog open={operatorModal.open} onClose={() => setOperatorModal({ open: false, userId: null, lotId: '' })}>
                <DialogTitle>Зробити користувача оператором</DialogTitle>
                <DialogContent>
                    <Typography>Вкажіть ID паркувального майданчика, за яким буде закріплений оператор.</Typography>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="ID Паркувального Майданчика (Lot ID)"
                        type="number"
                        fullWidth
                        variant="standard"
                        value={operatorModal.lotId}
                        onChange={(e) => setOperatorModal(prev => ({ ...prev, lotId: e.target.value }))}
                        sx={{ mt: 2 }}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOperatorModal({ open: false, userId: null, lotId: '' })}>Скасувати</Button>
                    <Button 
                        onClick={handleMakeOperatorConfirm} 
                        disabled={!operatorModal.lotId || isNaN(parseInt(operatorModal.lotId))}
                        variant="contained"
                    >
                        Підтвердити
                    </Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
};

export default UserManagementPage;