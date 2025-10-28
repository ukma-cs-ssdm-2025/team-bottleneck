import React from 'react';
import { AppBar, Toolbar, Typography, Button } from '@mui/material';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

function Header() {
    const { isAuthenticated, user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    // Check if the current user is an operator assigned to a lot
    const isOperator = isAuthenticated && user?.is_operator && user?.lot_id;
    const showMapButton = !isOperator;

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
                {showMapButton && (
                    <Button color="inherit" component={Link} to="/">
                        КАРТА
                    </Button>
                )}

                {/* Operator Panel Link (Only for operators) */}
                {isOperator && (
                    <Button color="inherit" component={Link} to="/operator">
                        ПАНЕЛЬ ОПЕРАТОРА
                    </Button>
                )}

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