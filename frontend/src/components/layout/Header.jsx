import React from 'react';
import { AppBar, Toolbar, Typography, Button } from '@mui/material';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

function Header() {
    // ⭐️ ДОДАНО isAdmin ⭐️
    const { isAuthenticated, user, logout, isAdmin, isOperator: isOperatorContext } = useAuth(); 
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    // Оскільки ми вже виправили isOperator в AuthContext, краще використовувати його:
    const isOperator = isOperatorContext; 
    
    // Перевірка: КАРТА прихована, якщо це Адмін АБО Оператор
    const showMapButton = !isOperator && !isAdmin; 

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

                {/* ⭐️ НОВЕ: ADMIN Panel Link (Видно ТІЛЬКИ Адміну) ⭐️ */}
                {isAdmin && (
                    <Button color="inherit" component={Link} to="/admin">
                        ПАНЕЛЬ АДМІНА
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