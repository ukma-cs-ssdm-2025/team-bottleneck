// frontend/src/pages/LoginPage.jsx

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { loginUser } from '../api/parkingAPI'; // Uses Basic Auth

const LoginPage = () => {
    const [formData, setFormData] = useState({
        username: '',
        password: '',
    });
    // State for displaying general errors
    const [error, setError] = useState(null); 
    const [isLoading, setIsLoading] = useState(false); // Loading state
    
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    // Function to render detailed error messages
    const renderErrorMessage = (err) => {
        if (err.response && err.response.status === 401) {
            return 'Невірне ім\'я користувача або пароль. Перевірте введені дані.';
        }
        if (err.response && err.response.status === 500) {
            return 'Сервер тимчасово недоступний. Спробуйте пізніше.';
        }
        if (err.response && err.response.data && err.response.data.detail) {
            return err.response.data.detail;
        }
        if (err.request) {
            return 'Не вдалося з\'єднатися з сервером. Перевірте ваше інтернет-з\'єднання.';
        }
        return 'Виникла невідома помилка під час входу. Спробуйте ще раз.';
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true); // Start loading

        try {
            // 1. Send credentials to verify via Basic Auth
            const userData = await loginUser(formData); 
            
            // 2. Save credentials (username, password) and user data in context
            login(formData.username, formData.password, userData); 
            
            // 3. Redirect to the protected page (profile)
            navigate('/profile'); 
        } catch (err) {
            // Show detailed error message to the user
            setError(renderErrorMessage(err));
            // Log full error in console for debugging
            console.error('Login failed with error:', err.response || err);
        } finally {
            setIsLoading(false); // Stop loading
        }
    };

    return (
        <div 
            className="login-container" 
            style={{ 
                padding: '20px', 
                maxWidth: '400px', 
                margin: '30px auto', 
                border: '1px solid #ccc', 
                borderRadius: '5px' 
            }}
        >
            <h2>Login</h2>
            
            {/* Display detailed error message */}
            {error && (
                <p 
                    className="error-message" 
                    style={{ 
                        color: 'red', 
                        border: '1px solid red', 
                        padding: '10px', 
                        borderRadius: '3px' 
                    }}
                >
                    {error}
                </p>
            )}
            
            <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px' }}>
                        Username:
                    </label>
                    <input 
                        type="text" 
                        name="username" 
                        value={formData.username} 
                        onChange={handleChange} 
                        required 
                        disabled={isLoading}
                        style={{ 
                            width: '100%', 
                            padding: '10px', 
                            boxSizing: 'border-box', 
                            border: '1px solid #ccc' 
                        }} 
                    />
                </div>
                <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', marginBottom: '5px' }}>
                        Password:
                    </label>
                    <input 
                        type="password" 
                        name="password" 
                        value={formData.password} 
                        onChange={handleChange} 
                        required 
                        disabled={isLoading}
                        style={{ 
                            width: '100%', 
                            padding: '10px', 
                            boxSizing: 'border-box', 
                            border: '1px solid #ccc' 
                        }} 
                    />
                </div>
                
                <button 
                    type="submit" 
                    disabled={isLoading}
                    style={{ 
                        padding: '10px 15px', 
                        backgroundColor: isLoading ? '#64b5f6' : '#2196F3',
                        color: 'white', 
                        border: 'none', 
                        borderRadius: '5px',
                        cursor: isLoading ? 'wait' : 'pointer' 
                    }}
                >
                    {isLoading ? 'Please wait...' : 'Log in'}
                </button>
                
                <p style={{ marginTop: '15px', textAlign: 'center' }}>
                    Don’t have an account? <Link to="/register">Register</Link>
                </p>
            </form>
        </div>
    );
};

export default LoginPage;
