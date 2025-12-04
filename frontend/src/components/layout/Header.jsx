import React from 'react';
import { AppBar, Toolbar, Typography, Button, Box } from '@mui/material';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

function Header() {
    const { isAuthenticated, user, logout, isAdmin, isOperator: isOperatorContext } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    const isOperator = isOperatorContext;
    const showMapButton = !isOperator && !isAdmin;

    return (
        <AppBar position="static" sx={{ background: '#FFFFFF', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
            <Toolbar>
                <Box
                    component={Link}
                    to="/"
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        textDecoration: 'none',
                        flexGrow: 1,
                        gap: 1.5,
                    }}
                >
                    <img
                        src="/logo.png"
                        alt="SmartParking Logo"
                        style={{ height: '40px', width: 'auto' }}
                    />
                    <Typography variant="h6" sx={{ color: '#111827', fontWeight: 700 }}>
                        SmartParking
                    </Typography>
                </Box>

                <Box sx={{ display: 'flex', gap: 1 }}>
                    {showMapButton && (
                        <Button component={Link} to="/" sx={{ color: '#6B7280' }}>
                            Головна
                        </Button>
                    )}

                    {isAdmin && (
                        <Button component={Link} to="/admin" sx={{ color: '#6B7280' }}>
                            Адмін
                        </Button>
                    )}

                    {isOperator && (
                        <Button component={Link} to="/operator" sx={{ color: '#6B7280' }}>
                            Оператор
                        </Button>
                    )}

                    {isAuthenticated ? (
                        <>
                            <Button component={Link} to="/profile" sx={{ color: '#6B7280' }}>
                                Профіль
                            </Button>
                            <Button onClick={handleLogout} sx={{ color: '#6B7280' }}>
                                Вийти
                            </Button>
                        </>
                    ) : (
                        <>
                            <Button component={Link} to="/login" sx={{ color: '#6B7280' }}>
                                Увійти
                            </Button>
                            <Button
                                component={Link}
                                to="/register"
                                sx={{
                                    background: 'linear-gradient(135deg, #34D399 0%, #059669 100%)',
                                    color: '#FFFFFF',
                                    '&:hover': {
                                        background: 'linear-gradient(135deg, #34D399 0%, #059669 100%)',
                                    }
                                }}
                            >
                                Реєстрація
                            </Button>
                        </>
                    )}
                </Box>
            </Toolbar>
        </AppBar>
    );
}

export default Header;