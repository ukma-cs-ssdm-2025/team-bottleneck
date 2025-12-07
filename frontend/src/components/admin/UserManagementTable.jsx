import React from 'react';
import {
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Paper, Button, Box, Typography, Chip, Tooltip
} from '@mui/material';
import { styled } from '@mui/material/styles';

const StyledTableContainer = styled(TableContainer)(({ theme }) => ({
    borderRadius: 16,
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
}));

const StyledTableHead = styled(TableHead)(({ theme }) => ({
    backgroundColor: theme.palette.primary.main,
}));

const StyledHeaderCell = styled(TableCell)(({ theme }) => ({
    fontWeight: 600,
    color: 'white',
}));

const StyledTableRow = styled(TableRow)(({ theme }) => ({
    '&:last-child td, &:last-child th': { border: 0 },
    '&:hover': {
        backgroundColor: 'rgba(0, 0, 0, 0.02)',
        transition: 'background-color 0.2s'
    },
}));

const RoleChip = ({ is_staff, is_operator, operator_lot_id }) => {

    if (is_staff) {
        return <Chip label="Адмін" color="primary" variant="outlined" size="small" />;
    }
    if (is_operator) {
        return (
            <Tooltip title={`Закріплений за Lot ID: ${operator_lot_id || 'N/A'}`}>
                <Chip label="Оператор" color="secondary" variant="outlined" size="small" />
            </Tooltip>
        );
    }
    return <Chip label="Користувач" size="small" />;
};

const UserManagementTable = ({ users, onMakeOperator, onRemoveOperator, onMakeAdmin, onRemoveAdmin }) => {


    if (!users || users.length === 0) {
        return <Typography color="text.secondary" sx={{ mt: 2 }}>Користувачів поки що немає.</Typography>;
    }

    return (
        <StyledTableContainer component={Paper}>
            <Table sx={{ minWidth: 1000 }} aria-label="user management table">
                <StyledTableHead>
                    <TableRow>
                        <StyledHeaderCell>ID</StyledHeaderCell>
                        <StyledHeaderCell>Email</StyledHeaderCell>
                        <StyledHeaderCell>Ім'я</StyledHeaderCell>
                        <StyledHeaderCell>Прізвище</StyledHeaderCell>
                        <StyledHeaderCell>Поточна роль</StyledHeaderCell>
                        <StyledHeaderCell align="center">Дії</StyledHeaderCell>
                    </TableRow>
                </StyledTableHead>
                <TableBody>
                    {users.map((user) => (
                        <StyledTableRow key={user.id}>
                            <TableCell component="th" scope="row">{user.id}</TableCell>
                            <TableCell>{user.email}</TableCell>
                            <TableCell>{user.first_name || '—'}</TableCell>
                            <TableCell>{user.last_name || '—'}</TableCell>
                            <TableCell>
                                <RoleChip
                                    is_staff={user.is_staff}
                                    is_operator={user.is_operator}
                                    operator_lot_id={user.lot_id}
                                />
                            </TableCell>
                            <TableCell align="center">
                                <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', flexWrap: 'wrap' }}>
                                    {/* Дії для Адміна */}
                                    {user.is_staff ? (
                                        <Button
                                            size="small"
                                            variant="outlined"
                                            color="error"
                                            onClick={() => onRemoveAdmin(user.id)}
                                            disabled={user.is_superuser}
                                            sx={{ borderRadius: 1, minWidth: '160px' }}
                                        >
                                            Зняти Адміна
                                        </Button>
                                    ) : (
                                        <Button
                                            size="small"
                                            variant="outlined"
                                            color="success"
                                            onClick={() => onMakeAdmin(user.id)}
                                            sx={{ borderRadius: 1, minWidth: '160px' }}
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
                                            sx={{ borderRadius: 1, minWidth: '160px' }}
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
                                            sx={{ borderRadius: 1, minWidth: '160px' }}
                                        >
                                            Зробити Оператором
                                        </Button>
                                    )}
                                </Box>
                            </TableCell>
                        </StyledTableRow>
                    ))}
                </TableBody>
            </Table>
        </StyledTableContainer>
    );
};

export default UserManagementTable;