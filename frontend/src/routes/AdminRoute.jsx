

import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigate, Outlet } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';

const AdminRoute = () => {
    const { isAuthenticated, isAdmin, loading, isOperator } = useAuth(); 

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 5 }}>
                <CircularProgress />
            </Box>
        );
    }
    
    
    if (!isAuthenticated || !isAdmin) {
        if (isOperator) {
            return <Navigate to="/operator" replace />;
        }
        
        return <Navigate to="/" replace />; 
    }

    return <Outlet />;
};

export default AdminRoute;