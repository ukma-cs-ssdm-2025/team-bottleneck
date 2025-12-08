import React, { useState, useEffect } from 'react';
import {
    Container, Box, Typography, CircularProgress,
    Button, Dialog, DialogTitle, DialogContent, ToggleButtonGroup, ToggleButton
} from '@mui/material';
import UserManagementTable from '../components/admin/UserManagementTable';
import OperatorAssignmentDialog from '../components/admin/OperatorAssignmentDialog';
import CreateUserForm from '../components/admin/CreateUserForm';
import ErrorPopup from '../components/common/ErrorPopup';
import {
    getAllUsers, makeOperator, removeOperator, makeAdmin, removeAdmin, registerUser
} from '../api/adminAPI';


const UserManagementPage = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterRole, setFilterRole] = useState('all'); // 'all', 'admins', 'operators', 'users'

    const [operatorModal, setOperatorModal] = useState({ open: false, userId: null, lotId: '' });
    const [createUserModalOpen, setCreateUserModalOpen] = useState(false);

    // Error/Success popup state
    const [popup, setPopup] = useState({
        open: false,
        message: '',
        severity: 'error'
    });

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const data = await getAllUsers();
            setUsers(data.map(user => ({
                ...user,
                id: String(user.id),
                is_admin: user.is_staff
            })));
        } catch (err) {
            console.error('Error fetching users:', err.response || err);

            let errorMessage = 'Не вдалося завантажити список користувачів.';

            if (err.response?.status === 403) {
                errorMessage = 'Доступ заборонено. Увійдіть як адміністратор.';
            } else if (err.response?.data?.detail) {
                errorMessage = err.response.data.detail;
            } else if (err.message) {
                errorMessage = `Помилка: ${err.message}`;
            }

            setPopup({
                open: true,
                message: errorMessage,
                severity: 'error'
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleAction = async (userId, actionType, lotId = null) => {
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

            setPopup({
                open: true,
                message: `Роль користувача ID ${userId} успішно змінено.`,
                severity: 'success'
            });
            fetchUsers();
        } catch (err) {
            console.error('Error during role change:', err.response || err);

            let errorMessage = 'Не вдалося виконати дію. Перевірте дозволи або ID лоту.';

            if (err.response?.data?.detail) {
                errorMessage = err.response.data.detail;
            } else if (err.response?.data?.lot_id) {
                const lotErrors = Array.isArray(err.response.data.lot_id)
                    ? err.response.data.lot_id.join(', ')
                    : err.response.data.lot_id;
                errorMessage = `Помилка ID лоту: ${lotErrors}`;
            } else if (err.response?.data) {
                // Handle other validation errors
                const errors = err.response.data;
                if (typeof errors === 'object') {
                    const errorMessages = Object.keys(errors)
                        .map(key => {
                            const value = errors[key];
                            const messages = Array.isArray(value) ? value.join(', ') : value;
                            return `${key}: ${messages}`;
                        })
                        .join('\n');
                    errorMessage = `Помилка:\n${errorMessages}`;
                }
            } else if (err.message) {
                errorMessage = `Помилка: ${err.message}`;
            }

            setPopup({
                open: true,
                message: errorMessage,
                severity: 'error'
            });
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

    const handleLotIdChange = (newLotId) => {
        setOperatorModal(prev => ({ ...prev, lotId: newLotId }));
    };

    const handleCreateUser = async (formData) => {
        setCreateUserModalOpen(false);

        try {
            await registerUser(formData);
            setPopup({
                open: true,
                message: `Користувача ${formData.username} успішно створено.`,
                severity: 'success'
            });
            fetchUsers();
        } catch (err) {
            console.error('Error creating user:', err.response || err);

            let errorMessage = 'Не вдалося створити користувача. Перевірте введені дані.';

            if (err.response?.data) {
                const apiErrors = err.response.data;

                if (typeof apiErrors === 'object') {
                    const errorMessages = Object.keys(apiErrors)
                        .map(key => {
                            const value = apiErrors[key];
                            const messages = Array.isArray(value) ? value.join(', ') : value;
                            return `${key}: ${messages}`;
                        })
                        .join('\n');
                    errorMessage = `Помилка валідації:\n${errorMessages}`;
                }
            } else if (err.message) {
                errorMessage = `Помилка: ${err.message}`;
            }

            setPopup({
                open: true,
                message: errorMessage,
                severity: 'error'
            });
        }
    };

    const handleFilterChange = (event, newFilter) => {
        if (newFilter !== null) {
            setFilterRole(newFilter);
        }
    };

    const handleClosePopup = () => {
        setPopup({ ...popup, open: false });
    };

    // Filter users based on selected role
    const filteredUsers = users.filter(user => {
        if (filterRole === 'all') return true;
        if (filterRole === 'admins') return user.is_staff;
        if (filterRole === 'operators') return user.is_operator && !user.is_staff;
        if (filterRole === 'users') return !user.is_staff && !user.is_operator;
        return true;
    });

    if (loading) {
        return (
            <Container sx={{ display: 'flex', justifyContent: 'center', mt: 5 }}>
                <CircularProgress />
            </Container>
        );
    }

    return (
        <Container component="main" maxWidth="xl" sx={{ mt: 4, mb: 4, px: { xs: 2, sm: 3 } }}>
            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'stretch', sm: 'center' }, mb: 3, gap: { xs: 2, sm: 0 } }}>
                <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 700, fontSize: { xs: '1.5rem', sm: '2rem' }, mb: { xs: 1, sm: 0 } }}>
                    Керування Користувачами та Ролями
                </Typography>
                <Button
                    variant="contained"
                    color="primary"
                    onClick={() => setCreateUserModalOpen(true)}
                    sx={{
                        borderRadius: 1,
                        fontSize: { xs: '0.875rem', sm: '1rem' },
                        width: { xs: '100%', sm: 'auto' }
                    }}
                >
                    + Створити Користувача
                </Button>
            </Box>

            {/* Filter Buttons */}
            <Box sx={{ mb: 3, display: 'flex', justifyContent: 'center', overflowX: 'auto', px: { xs: 0, sm: 2 } }}>
                <ToggleButtonGroup
                    value={filterRole}
                    exclusive
                    onChange={handleFilterChange}
                    aria-label="user role filter"
                    sx={{
                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                        borderRadius: 2,
                        flexWrap: { xs: 'nowrap', sm: 'wrap' },
                        '& .MuiToggleButton-root': {
                            borderRadius: 2,
                            px: { xs: 2, sm: 3 },
                            py: 1,
                            textTransform: 'none',
                            fontWeight: 500,
                            fontSize: { xs: '0.875rem', sm: '1rem' },
                            whiteSpace: 'nowrap'
                        }
                    }}
                >
                    <ToggleButton value="all">
                        Всі ({users.length})
                    </ToggleButton>
                    <ToggleButton value="admins">
                        Адміністратори ({users.filter(u => u.is_staff).length})
                    </ToggleButton>
                    <ToggleButton value="operators">
                        Оператори ({users.filter(u => u.is_operator && !u.is_staff).length})
                    </ToggleButton>
                    <ToggleButton value="users">
                        Користувачі ({users.filter(u => !u.is_staff && !u.is_operator).length})
                    </ToggleButton>
                </ToggleButtonGroup>
            </Box>

            <UserManagementTable
                users={filteredUsers}
                onMakeOperator={handleMakeOperatorClick}
                onRemoveOperator={(userId) => handleAction(userId, 'remove-operator')}
                onMakeAdmin={(userId) => handleAction(userId, 'make-admin')}
                onRemoveAdmin={(userId) => handleAction(userId, 'remove-admin')}
            />

            <OperatorAssignmentDialog
                open={operatorModal.open}
                onClose={() => setOperatorModal({ open: false, userId: null, lotId: '' })}
                onConfirm={handleMakeOperatorConfirm}
                lotId={operatorModal.lotId}
                onLotIdChange={handleLotIdChange}
            />

            <Dialog open={createUserModalOpen} onClose={() => setCreateUserModalOpen(false)}>
                <DialogTitle>Створити Нового Користувача</DialogTitle>
                <DialogContent>
                    <CreateUserForm
                        onSubmit={handleCreateUser}
                        onCancel={() => setCreateUserModalOpen(false)}
                    />
                </DialogContent>
            </Dialog>

            {/* Error/Success Popup */}
            <ErrorPopup
                open={popup.open}
                onClose={handleClosePopup}
                message={popup.message}
                severity={popup.severity}
            />
        </Container>
    );
};

export default UserManagementPage;