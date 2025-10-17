import React from 'react';
import { AppBar, Toolbar, Typography, Button } from '@mui/material';
import { Link } from 'react-router-dom';

function Header() {
    return (
        <AppBar position="static">
            <Toolbar>
                <Typography variant="h6" component={Link} to="/" sx={{ flexGrow: 1, color: 'inherit', textDecoration: 'none' }}>
                    Розумна Парковка
                </Typography>
                <Button color="inherit" component={Link} to="/">Карта</Button>
                <Button color="inherit" component={Link} to="/profile">Мій профіль</Button>
            </Toolbar>
        </AppBar>
    );
}
export default Header;