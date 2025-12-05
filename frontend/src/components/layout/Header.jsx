import React, { useEffect } from 'react';
import { AppBar, Toolbar, Typography, Button, Box } from '@mui/material';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

function Header() {
    const { isAuthenticated, user, logout, isAdmin, isOperator: isOperatorContext } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    const isOperator = isOperatorContext;
    const showHomeButton = !isOperator && !isAdmin;

    useEffect(() => {
        if (isOperator && !isAdmin && location.pathname === '/') {
            navigate('/operator');
        }
    }, [isOperator, isAdmin, location.pathname, navigate]);

    return (
        <AppBar position="static" sx={{ background: '#FFFFFF', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
            <Toolbar>
                <Box
                    component={isOperator && !isAdmin ? 'div' : Link}
                    to={isOperator && !isAdmin ? undefined : '/'}
                    onClick={() => {
                        if (isOperator && !isAdmin) {
                            navigate('/operator');
                        }
                    }}
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        textDecoration: 'none',
                        flexGrow: 1,
                        gap: 1.5,
                        cursor: 'pointer'
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
                    {showHomeButton && (
                        <Button
                            component={Link}
                            to="/"
                            sx={{
                                color: '#6B7280',
                                fontWeight: 600,
                                textTransform: 'none',
                                '&:hover': {
                                    backgroundColor: 'rgba(107, 114, 128, 0.1)'
                                }
                            }}
                        >
                            Головна
                        </Button>
                    )}

                    {isAdmin && (
                        <Button
                            component={Link}
                            to="/admin"
                            sx={{
                                color: '#6B7280',
                                fontWeight: 600,
                                textTransform: 'none',
                                '&:hover': {
                                    backgroundColor: 'rgba(107, 114, 128, 0.1)'
                                }
                            }}
                        >
                            Адмін
                        </Button>
                    )}

                    {isOperator && (
                        <Button
                            component={Link}
                            to="/operator"
                            sx={{
                                color: '#6B7280',
                                fontWeight: 600,
                                textTransform: 'none',
                                '&:hover': {
                                    backgroundColor: 'rgba(107, 114, 128, 0.1)'
                                }
                            }}
                        >
                            Оператор
                        </Button>
                    )}

                    {isAuthenticated ? (
                        <>
                            <Button
                                component={Link}
                                to="/profile"
                                sx={{
                                    color: '#6B7280',
                                    fontWeight: 600,
                                    textTransform: 'none',
                                    '&:hover': {
                                        backgroundColor: 'rgba(107, 114, 128, 0.1)'
                                    }
                                }}
                            >
                                Профіль
                            </Button>
                            <Button
                                onClick={handleLogout}
                                sx={{
                                    color: '#EF4444',
                                    fontWeight: 600,
                                    textTransform: 'none',
                                    '&:hover': {
                                        backgroundColor: 'rgba(239, 68, 68, 0.1)'
                                    }
                                }}
                            >
                                Вийти
                            </Button>
                        </>
                    ) : (
                        <>
                            <Button
                                component={Link}
                                to="/login"
                                sx={{
                                    color: '#6B7280',
                                    fontWeight: 600,
                                    textTransform: 'none',
                                    '&:hover': {
                                        backgroundColor: 'rgba(107, 114, 128, 0.1)'
                                    }
                                }}
                            >
                                Увійти
                            </Button>
                            <Button
                                component={Link}
                                to="/register"
                                variant="contained"
                                sx={{
                                    background: 'linear-gradient(135deg, #34D399 0%, #059669 100%)',
                                    color: '#FFFFFF',
                                    fontWeight: 600,
                                    textTransform: 'none',
                                    borderRadius: '12px',
                                    px: 2,
                                    boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)',
                                    '&:hover': {
                                        background: 'linear-gradient(135deg, #34D399 0%, #059669 100%)',
                                        boxShadow: '0 4px 12px rgba(16, 185, 129, 0.4)',
                                    }
                                }}
                            >
                                Зареєструватися
                            </Button>
                        </>
                    )}
                </Box>
            </Toolbar>
        </AppBar>
    );
}

export default Header;