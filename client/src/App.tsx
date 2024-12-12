import React from 'react';
import { Routes, Route } from 'react-router-dom';
import VerifySuccess from './components/VerifySuccess';
import VerifyFail from './components/VerifyFail';

const App = () => {
    return (
        <Routes>
            <Route path="/verify-success" element={<VerifySuccess />} />
            <Route path="/verify-fail" element={<VerifyFail />} />
        </Routes>
    );
};

export default App;