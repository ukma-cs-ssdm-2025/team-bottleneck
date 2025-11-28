import React from 'react';
import { 
    Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Typography
} from '@mui/material';

const OperatorAssignmentDialog = ({ 
    open, 
    onClose, 
    onConfirm, 
    lotId, 
    onLotIdChange 
}) => {
    const isLotIdValid = lotId && !isNaN(parseInt(lotId));

    return (
        <Dialog open={open} onClose={onClose}>
            <DialogTitle>Зробити користувача оператором</DialogTitle>
            <DialogContent>
                <Typography>
                    Вкажіть ID паркувального майданчика, за яким буде закріплений оператор.
                </Typography>
                <TextField
                    autoFocus
                    margin="dense"
                    label="ID Паркувального Майданчика (Lot ID)"
                    type="number"
                    fullWidth
                    variant="standard"
                    value={lotId}
                    onChange={(e) => onLotIdChange(e.target.value)}
                    sx={{ mt: 2 }}
                />
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Скасувати</Button>
                <Button 
                    onClick={onConfirm} 
                    disabled={!isLotIdValid}
                    variant="contained"
                >
                    Підтвердити
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default OperatorAssignmentDialog;