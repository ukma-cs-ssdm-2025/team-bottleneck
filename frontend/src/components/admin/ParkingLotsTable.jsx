import { 
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, 
    Paper, Button, Box, Typography 
} from '@mui/material';
import { Link } from 'react-router-dom';

const ParkingLotsTable = ({ lots, onDelete }) => {
    
    if (!lots || lots.length === 0) {
        return <Typography color="text.secondary">Паркувальних майданчиків поки що немає.</Typography>;
    }
    
    return (
        <TableContainer component={Paper} elevation={3}>
            <Table sx={{ minWidth: 700 }} aria-label="parking lot table">
                <TableHead sx={{ backgroundColor: 'primary.light' }}>
                    <TableRow>
                        <TableCell sx={{ fontWeight: 'bold', color: 'white' }}>ID</TableCell>
                        <TableCell sx={{ fontWeight: 'bold', color: 'white' }}>Назва</TableCell>
                        <TableCell sx={{ fontWeight: 'bold', color: 'white' }}>Адреса</TableCell>
                        <TableCell sx={{ fontWeight: 'bold', color: 'white' }} align="right">Ціна (грн/год)</TableCell>
                        <TableCell sx={{ fontWeight: 'bold', color: 'white' }}>Сервіси</TableCell>
                        <TableCell sx={{ fontWeight: 'bold', color: 'white' }} align="center">Дії</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {lots.map((lot) => (
                        <TableRow
                            key={lot.id}
                            sx={{ '&:last-child td, &:last-child th': { border: 0 }, '&:hover': { backgroundColor: '#f5f5f5' } }}
                        >
                            <TableCell component="th" scope="row">
                                {lot.id}
                            </TableCell>
                            <TableCell>{lot.name}</TableCell>
                            <TableCell>{lot.city}, {lot.street}</TableCell>
                            <TableCell align="right">
                                <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                                    {lot.hourly_rate}
                                </Typography>
                            </TableCell>
                            <TableCell>
                                
                                {lot.additional_services || 'Немає'}
                            </TableCell>
                            <TableCell align="center">
                                <Button 
                                    size="small" 
                                    component={Link} 
                                    to={`/admin/lots/edit/${lot.id}`} 
                                    sx={{ mr: 1 }}
                                >
                                    Редагувати
                                </Button>
                                <Button 
                                    size="small" 
                                    color="error" 
                                    onClick={() => onDelete(lot.id, lot.name)}
                                >
                                    Видалити
                                </Button>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </TableContainer>
    );
};

export default ParkingLotsTable;