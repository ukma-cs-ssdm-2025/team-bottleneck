import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Header from '../components/layout/Header';
import HomePage from '../pages/HomePage';
import ProfilePage from '../pages/ProfilePage';

function AppRouter() {
    return (
        <BrowserRouter>
            <Header />
            <main>
                <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/profile" element={<ProfilePage />} />
                </Routes>
            </main>
        </BrowserRouter>
    );
}
export default AppRouter;