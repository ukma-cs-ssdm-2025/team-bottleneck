import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Header from '../components/layout/Header';
import HomePage from '../pages/HomePage';
import ProfilePage from '../pages/ProfilePage';
import RegisterPage from '../pages/RegisterPage';
import SingleLoginPage from '../pages/SingleLoginPage';

import OperatorPage from '../pages/OperatorPage.jsx';
import LotDetailsPage from '../pages/LotDetailsPage.jsx';
import SpotSelectionPage from '../pages/SpotSelectionPage.jsx'
import BookingCreatePage from '../pages/BookingCreatePage.jsx';
import SpotCreatePage from '../pages/SpotCreatePage.jsx';
import OperatorSpotDetailsPage from '../pages/SpotDetailsPage.jsx';

import AdminRoute from './AdminRoute';
import AdminDashboardPage from '../pages/AdminDashboardPage';
import ParkingLotListPage from '../pages/ParkingLotListPage';
import ParkingLotCreatePage from '../pages/ParkingLotCreatePage';
import ParkingLotEditPage from '../pages/ParkingLotEditPage';
import UserManagementPage from '../pages/UserManagementPage';

function AppRouter() {
    return (
        <BrowserRouter>
            <Header />
            <main>
                <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/register" element={<RegisterPage />} />

                    <Route path="/login" element={<SingleLoginPage />} />

                    <Route path="/profile" element={<ProfilePage />} />
                    <Route path="/operator" element={<OperatorPage />} />
                    <Route path="/operator/lots/:lotId/spots/:spotId" element={<OperatorSpotDetailsPage />} />

                    <Route path="/operator/lots/:lotId/spots/create" element={<SpotCreatePage />} />

                    <Route path="/lots/:id" element={<LotDetailsPage />} />
                    <Route path="/lots/:lotId/spots" element={<SpotSelectionPage />} />
                    <Route path="/booking/create" element={<BookingCreatePage />} />

                    <Route path="/admin" element={<AdminRoute />}>
                        <Route index element={<AdminDashboardPage />} />
                        <Route path="lots" element={<ParkingLotListPage />} />
                        <Route path="lots/create" element={<ParkingLotCreatePage />} />
                        <Route path="lots/edit/:id" element={<ParkingLotEditPage />} />
                        <Route path="users" element={<UserManagementPage />} />
                        <Route path="operator/:lotId" element={<OperatorPage />} />
                    </Route>

                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </main>
        </BrowserRouter>
    );
}

export default AppRouter;