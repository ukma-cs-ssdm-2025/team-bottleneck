import React from 'react';
import { AppBar, Toolbar, Typography, Button } from '@mui/material';
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
        <AppBar position="static">
            <Toolbar>
   
                <Typography
                    variant="h6"
                    component={Link}
                    to="/"
                    sx={{ flexGrow: 1, color: 'inherit', textDecoration: 'none' }}
                >
                    Розумна Парковка
                </Typography>

  
                {showMapButton && (
                    <Button color="inherit" component={Link} to="/">
                        КАРТА
                    </Button>
                )}

  
                {isAdmin && (
                    <Button color="inherit" component={Link} to="/admin">
                        ПАНЕЛЬ АДМІНА
                    </Button>
                )}
                
    
                {isOperator && (
                    <Button color="inherit" component={Link} to="/operator">
                        ПАНЕЛЬ ОПЕРАТОРА
                    </Button>
                )}

       
                {isAuthenticated ? (
                    <>
                     
                        <Button color="inherit" component={Link} to="/profile">
                            МІЙ ПРОФІЛЬ
                        </Button>
                        <Button color="inherit" onClick={handleLogout}>
                            ВИЙТИ
                        </Button>
                    </>
                ) : (
                    <>
                        <Button color="inherit" component={Link} to="/login">
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