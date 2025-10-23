

import React from 'react';
import { AppBar, Toolbar, Typography, Button } from '@mui/material';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext'; // <-- Import useAuth hook

function Header() {
    // 1. Get authentication state and functions from the context
    const { isAuthenticated, logout } = useAuth();
    const navigate = useNavigate();

    // Handler for logging out
    const handleLogout = () => {
        logout(); // Clears tokens from local storage and updates isAuthenticated to false
        navigate('/'); // Redirect to the home/map page
    };

    return (
        <AppBar position="static">
            <Toolbar>
                {/* Application Title / Link to Home */}
                <Typography 
                    variant="h6" 
                    component={Link} 
                    to="/" 
                    sx={{ flexGrow: 1, color: 'inherit', textDecoration: 'none' }}
                >
                    Розумна Парковка
                </Typography>

                {/* Navigation Links */}
                <Button color="inherit" component={Link} to="/">
                    КАРТА
                </Button>

                {/* Conditional rendering based on authentication status */}
                {isAuthenticated ? (
                    <>
                        {/* Links for Authenticated Users */}
                        <Button color="inherit" component={Link} to="/profile">
                            МІЙ ПРОФІЛЬ
                        </Button>
                        <Button color="inherit" onClick={handleLogout}>
                            ВИЙТИ
                        </Button>
                    </>
                ) : (
                    <>
                        {/* Links for Guest Users */}
                        <Button color="inherit" component={Link} to="/me">
                            УВІЙТИ
                        </Button>
                        <Button color="inherit" component={Link} to="/register">
                            ЗАРЕЄСТРУВАТИСЯ
                        </Button>
                    </>
                )}
            </Toolbar>
        </AppBar>
    );
}

export default Header;