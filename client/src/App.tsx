import React from 'react';
import { Routes, Route } from 'react-router-dom';
import VerifySuccess from './components/VerifySuccess';

const App = () => {
    return (
        <Routes>
            <Route path="/verify-success" element={<VerifySuccess />} />
        </Routes>
    );
};

export default App;