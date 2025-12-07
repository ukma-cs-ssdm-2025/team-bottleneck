import { 
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, 
    Paper, Button, Box, Typography 
} from '@mui/material';
import { Link } from 'react-router-dom';
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

const ParkingLotsTable = ({ lots, onDelete }) => {

    if (!lots || lots.length === 0) {
        return <Typography color="text.secondary">Паркувальних майданчиків поки що немає.</Typography>;
    }

    return (
        <StyledTableContainer component={Paper}>
            <Table sx={{ minWidth: 700 }} aria-label="parking lot table">
                <StyledTableHead>
                    <TableRow>
                        <StyledHeaderCell>ID</StyledHeaderCell>
                        <StyledHeaderCell>Назва</StyledHeaderCell>
                        <StyledHeaderCell>Адреса</StyledHeaderCell>
                        <StyledHeaderCell align="right">Ціна (грн/год)</StyledHeaderCell>
                        <StyledHeaderCell>Опис</StyledHeaderCell>
                        <StyledHeaderCell align="center">Дії</StyledHeaderCell>
                    </TableRow>
                </StyledTableHead>
                <TableBody>
                    {lots.map((lot) => (
                        <StyledTableRow key={lot.id}>
                            <TableCell component="th" scope="row">
                                {lot.id}
                            </TableCell>
                            <TableCell>{lot.name}</TableCell>
                            <TableCell>{lot.city}, {lot.street} {lot.building}</TableCell>
                            <TableCell align="right">
                                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                                    {lot.base_price_per_hour ? `${lot.base_price_per_hour} грн` : 'Не вказано'}
                                </Typography>
                            </TableCell>
                            <TableCell>
                                <Typography variant="body2" color="text.secondary">
                                    {lot.description || 'Немає опису'}
                                </Typography>
                            </TableCell>
                            <TableCell align="center">
                                <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                                    <Button
                                        size="small"
                                        variant="outlined"
                                        component={Link}
                                        to={`/admin/lots/edit/${lot.id}`}
                                        sx={{ borderRadius: 1 }}
                                    >
                                        Редагувати
                                    </Button>
                                    <Button
                                        size="small"
                                        variant="outlined"
                                        color="error"
                                        onClick={() => onDelete(lot.id, lot.name)}
                                        sx={{ borderRadius: 1 }}
                                    >
                                        Видалити
                                    </Button>
                                </Box>
                            </TableCell>
                        </StyledTableRow>
                    ))}
                </TableBody>
            </Table>
        </StyledTableContainer>
    );
};

export default ParkingLotsTable;