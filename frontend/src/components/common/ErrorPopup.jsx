import React from 'react';
import { Snackbar, Alert } from '@mui/material';

/**
 * ErrorPopup - Global component for displaying dismissible error/success messages
 *
 * IMPORTANT: message must be a string, not an object!
 */
const ErrorPopup = ({
                        open,
                        onClose,
                        message,
                        severity = 'error',
                        autoHideDuration = 6000
                    }) => {
    const handleClose = (event, reason) => {
        if (reason === 'clickaway') {
            return;
        }
        onClose();
    };

    // CRITICAL: Convert message to string if it's not already
    let safeMessage = '';

    if (typeof message === 'string') {
        safeMessage = message;
    } else if (message && typeof message === 'object') {
        // If message is an object, stringify it
        try {
            safeMessage = JSON.stringify(message);
        } catch (e) {
            safeMessage = 'Виникла помилка';
        }
    } else {
        safeMessage = String(message || 'Виникла помилка');
    }

    return (
        <Snackbar
            open={open}
            autoHideDuration={autoHideDuration}
            onClose={handleClose}
            anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
            sx={{ mt: 8 }}
        >
            <Alert
                severity={severity}
                variant="filled"
                onClose={handleClose}
                sx={{
                    width: '100%',
                    minWidth: '300px',
                    maxWidth: '600px',
                    borderRadius: '12px',
                    boxShadow: '0 8px 30px rgba(0, 0, 0, 0.08)',
                    fontSize: '1rem',
                    fontWeight: 500,
                }}
            >
                {safeMessage}
            </Alert>
        </Snackbar>
    );
};

export default ErrorPopup;