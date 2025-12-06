import React from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogContentText,
    DialogActions,
    Button,
} from '@mui/material';

/**
 * ConfirmDialog - Reusable confirmation dialog component
 * Replaces window.confirm() with a styled Material-UI dialog
 */
const ConfirmDialog = ({
    open,
    onClose,
    onConfirm,
    title = 'Підтвердження',
    message,
    confirmText = 'Підтвердити',
    cancelText = 'Скасувати',
    confirmColor = 'primary',
}) => {
    const handleConfirm = () => {
        onConfirm();
        onClose();
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            PaperProps={{
                style: {
                    borderRadius: 12,
                    minWidth: '400px',
                },
            }}
        >
            <DialogTitle sx={{ fontWeight: 600 }}>{title}</DialogTitle>
            <DialogContent>
                <DialogContentText sx={{ whiteSpace: 'pre-line' }}>
                    {message}
                </DialogContentText>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2 }}>
                <Button onClick={onClose} sx={{ borderRadius: 1 }}>
                    {cancelText}
                </Button>
                <Button
                    onClick={handleConfirm}
                    variant="contained"
                    color={confirmColor}
                    sx={{ borderRadius: 1 }}
                    autoFocus
                >
                    {confirmText}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default ConfirmDialog;
