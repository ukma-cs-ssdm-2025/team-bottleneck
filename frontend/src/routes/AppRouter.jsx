import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Header from '../components/layout/Header';
import HomePage from '../pages/HomePage';
import ProfilePage from '../pages/ProfilePage';
import RegisterPage from '../pages/RegisterPage';
import LoginPage from '../pages/LoginPage';
import LotDetailsPage from '../pages/LotDetailsPage.jsx';
import SpotSelectionPage from '../pages/SpotSelectionPage.jsx'


function AppRouter() {
    return (
        <BrowserRouter>
            <Header />
            <main>
                <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/register" element={<RegisterPage />} />
                    <Route path="/me" element={<LoginPage />} />
                    <Route path="/profile" element={<ProfilePage />} />
                    <Route path="/lots/:id" element={<LotDetailsPage />} />
                    <Route path="/lots/:lotId/spots" element={<SpotSelectionPage />} />
                </Routes>
            </main>
        </BrowserRouter>
    );
}
export default AppRouter;