import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Header from '../components/layout/Header';
import HomePage from '../pages/HomePage';
import ProfilePage from '../pages/ProfilePage';
import RegisterPage from '../pages/RegisterPage';
import UserLoginPage from '../pages/UserLoginPage';
import OperatorLoginPage from '../pages/OperatorLoginPage';
import ChooseLoginPage from '../pages/ChooseLoginPage';
import LotDetailsPage from '../pages/LotDetailsPage.jsx';
import SpotSelectionPage from '../pages/SpotSelectionPage.jsx'
import BookingCreatePage from '../pages/BookingCreatePage.jsx';
import OperatorPage from '../pages/OperatorPage.jsx';
import SpotCreatePage from '../pages/SpotCreatePage.jsx';
import OperatorSpotDetailsPage from '../pages/SpotDetailsPage.jsx';

function AppRouter() {
    return (
        <BrowserRouter>
            <Header />
            <main>
                <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/register" element={<RegisterPage />} />
                    <Route path="/me" element={<ChooseLoginPage />} />
                    <Route path="/user/login" element={<UserLoginPage />} />
                    <Route path="/operator/login" element={<OperatorLoginPage />} />
                    <Route path="/profile" element={<ProfilePage />} />
                    <Route path="/operator" element={<OperatorPage />} />

                    {/* Operator Management Routes */}
                    <Route path="/operator/lots/:lotId/spots/create" element={<SpotCreatePage />} />
                    <Route path="/operator/lots/:lotId/spots/:spotId" element={<OperatorSpotDetailsPage />} />

                    {/* Public/User Routes */}
                    <Route path="/lots/:id" element={<LotDetailsPage />} />
                    <Route path="/lots/:lotId/spots" element={<SpotSelectionPage />} />
                    <Route path="/booking/create" element={<BookingCreatePage />} />
                </Routes>
            </main>
        </BrowserRouter>
    );
}
export default AppRouter;