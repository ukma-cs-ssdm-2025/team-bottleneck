
import React from 'react';
import { 
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, 
    Paper, Button, Box, Typography, Chip, Tooltip 
} from '@mui/material';

const RoleChip = ({ is_staff, is_operator, operator_lot_id }) => {
    
    if (is_staff) {
        return <Chip label="Адмін" color="primary" variant="outlined" size="small" />;
    }
    if (is_operator) {
        return (
            <Tooltip title={`Закріплений за Lot ID: ${operator_lot_id || 'N/A'}`}>
                <Chip label={`Оператор`} color="secondary" variant="outlined" size="small" />
            </Tooltip>
        );
    }
    return <Chip label="Водій" size="small" />;
};

const UserManagementTable = ({ users, onMakeOperator, onRemoveOperator, onMakeAdmin, onRemoveAdmin }) => {
    
    
    if (!users || users.length === 0) {
        return <Typography color="text.secondary" sx={{ mt: 2 }}>Користувачів поки що немає.</Typography>;
    }

    return (
        <TableContainer component={Paper} elevation={3}>
            <Table sx={{ minWidth: 1000 }} aria-label="user management table">
                <TableHead sx={{ backgroundColor: 'primary.main' }}>
                    <TableRow>
                        <TableCell sx={{ fontWeight: 'bold', color: 'white' }}>ID</TableCell>
                        <TableCell sx={{ fontWeight: 'bold', color: 'white' }}>Email</TableCell>
                        <TableCell sx={{ fontWeight: 'bold', color: 'white' }}>Ім'я</TableCell>
                        <TableCell sx={{ fontWeight: 'bold', color: 'white' }}>Прізвище</TableCell>
                        <TableCell sx={{ fontWeight: 'bold', color: 'white' }}>Поточна роль</TableCell>
                        <TableCell sx={{ fontWeight: 'bold', color: 'white' }} align="center">Дії</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {users.map((user) => (
                        <TableRow
                            key={user.id}
                            sx={{ '&:last-child td, &:last-child th': { border: 0 }, '&:hover': { backgroundColor: '#f5f5f5' } }}
                        >
                            <TableCell component="th" scope="row">{user.id}</TableCell>
                            <TableCell>{user.email}</TableCell>
                            <TableCell>{user.first_name || 'N/A'}</TableCell>
                            <TableCell>{user.last_name || 'N/A'}</TableCell>
                            <TableCell>
                                <RoleChip 
                                    is_staff={user.is_staff} 
                                    is_operator={user.is_operator} 
                                    operator_lot_id={user.lot_id} 
                                />
                            </TableCell>
                            <TableCell align="center">
                                <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                                    {/* Дії для Адміна */}
                                    {user.is_staff ? (
                                        <Button 
                                            size="small" 
                                            variant="outlined" 
                                            color="error" 
                                            onClick={() => onRemoveAdmin(user.id)}
                                            disabled={user.is_superuser}
                                        >
                                            Зняти Адміна
                                        </Button>
                                    ) : (
                                        <Button 
                                            size="small" 
                                            variant="outlined" 
                                            color="success" 
                                            onClick={() => onMakeAdmin(user.id)}
                                        >
                                            Зробити Адміном
                                        </Button>
                                    )}
                                    
                                    
                                    {user.is_operator ? (
                                        <Button 
                                            size="small" 
                                            variant="outlined" 
                                            color="error" 
                                            onClick={() => onRemoveOperator(user.id)}
                                        >
                                            Зняти Оператора
                                        </Button>
                                    ) : (
                                        <Button 
                                            size="small" 
                                            variant="outlined" 
                                            color="secondary" 
                                            onClick={() => onMakeOperator(user.id)}
                                            disabled={user.is_staff}
                                        >
                                            Зробити Оператором
                                        </Button>
                                    )}
                                </Box>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </TableContainer>
    );
};

export default UserManagementTable;