import { AppBar, Box, Button, Toolbar, useTheme } from '@mui/material';
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import BioChefLogo from '../../img/BioChefWhite.svg';

const Navbar = () => {
    const theme = useTheme();
    const location = useLocation();

    const isActive = (path) => location.pathname === path;

    const buttonStyle = (active) => ({
        color: 'white',
        textTransform: 'none',
        fontSize: '1rem',
        marginRight: 2,
        position: 'relative',
        '&:after': {
            content: '""',
            position: 'absolute',
            bottom: -2,
            left: 0,
            width: active ? '100%' : '0%',
            height: 2,
            backgroundColor: 'white',
            transition: 'width 0.3s ease-in-out',
        },
        '&:hover': {
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            '&:after': {
                width: '100%',
            },
        },
    });

    return (
        <AppBar position="static" color="primary" elevation={0}>
            <Toolbar>
                {/* Logo */}
                <BioChefLogo style={{ maxWidth: '75px', marginRight: '15px' }} />

                {/* Links */}
                <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center' }}>
                    <Button
                        component={Link}
                        to="/"
                        sx={buttonStyle(isActive('/'))}
                    >
                        Tools
                    </Button>
                    <Button
                        component={Link}
                        to="/workflow"
                        sx={buttonStyle(isActive('/workflow'))}
                    >
                        Workflow Builder
                    </Button>
                </Box>
            </Toolbar>
        </AppBar>
    );
};

export default Navbar;