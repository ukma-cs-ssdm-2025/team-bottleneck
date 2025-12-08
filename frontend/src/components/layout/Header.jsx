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
                        gap: { xs: 0.5, sm: 1.5 },
                        cursor: 'pointer'
                    }}
                >
                    <img
                        src="/logo.png"
                        alt="SmartParking Logo"
                        style={{ height: '32px', width: 'auto' }}
                    />
                    <Typography
                        variant="h6"
                        sx={{
                            color: '#111827',
                            fontWeight: 700,
                            fontSize: { xs: '1rem', sm: '1.25rem' },
                            display: { xs: 'none', sm: 'block' }
                        }}
                    >
                        SmartParking
                    </Typography>
                </Box>

                <Box sx={{ display: 'flex', gap: { xs: 0.5, sm: 1 }, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                    {showHomeButton && (
                        <Button
                            component={Link}
                            to="/"
                            sx={{
                                color: '#6B7280',
                                fontWeight: 600,
                                textTransform: 'none',
                                fontSize: { xs: '0.875rem', sm: '1rem' },
                                px: { xs: 1, sm: 2 },
                                minWidth: { xs: 'auto', sm: '64px' },
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
                                fontSize: { xs: '0.875rem', sm: '1rem' },
                                px: { xs: 1, sm: 2 },
                                minWidth: { xs: 'auto', sm: '64px' },
                                '&:hover': {
                                    backgroundColor: 'rgba(107, 114, 128, 0.1)'
                                }
                            }}
                        >
                            <Box component="span" sx={{ display: { xs: 'none', md: 'inline' } }}>Панель адміністратора</Box>
                            <Box component="span" sx={{ display: { xs: 'inline', md: 'none' } }}>Адмін</Box>
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
                                fontSize: { xs: '0.875rem', sm: '1rem' },
                                px: { xs: 1, sm: 2 },
                                minWidth: { xs: 'auto', sm: '64px' },
                                '&:hover': {
                                    backgroundColor: 'rgba(107, 114, 128, 0.1)'
                                }
                            }}
                        >
                            <Box component="span" sx={{ display: { xs: 'none', md: 'inline' } }}>Панель оператора</Box>
                            <Box component="span" sx={{ display: { xs: 'inline', md: 'none' } }}>Оператор</Box>
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
                                    fontSize: { xs: '0.875rem', sm: '1rem' },
                                    px: { xs: 1, sm: 2 },
                                    minWidth: { xs: 'auto', sm: '64px' },
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
                                    fontSize: { xs: '0.875rem', sm: '1rem' },
                                    px: { xs: 1, sm: 2 },
                                    minWidth: { xs: 'auto', sm: '64px' },
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
                                    fontSize: { xs: '0.875rem', sm: '1rem' },
                                    px: { xs: 1, sm: 2 },
                                    minWidth: { xs: 'auto', sm: '64px' },
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
                                    fontSize: { xs: '0.875rem', sm: '1rem' },
                                    px: { xs: 1.5, sm: 2 },
                                    minWidth: { xs: 'auto', sm: '64px' },
                                    boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)',
                                    '&:hover': {
                                        background: 'linear-gradient(135deg, #34D399 0%, #059669 100%)',
                                        boxShadow: '0 4px 12px rgba(16, 185, 129, 0.4)',
                                    }
                                }}
                            >
                                <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>Зареєструватися</Box>
                                <Box component="span" sx={{ display: { xs: 'inline', sm: 'none' } }}>Реєстрація</Box>
                            </Button>
                        </>
                    )}
                </Box>
            </Toolbar>
        </AppBar>
    );
}

export default Header;