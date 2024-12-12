import React from 'react';
import { Check } from 'lucide-react';

const VerifySuccess: React.FC = () => {
    const handleReturnToApp = () => {
        window.location.href = 'pat.timthyw.dev://verify-success';
    };

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
                <div className="mb-6 flex justify-center">
                    <div className="rounded-full bg-green-100 p-3">
                        <Check className="h-12 w-12 text-green-600" />
                    </div>
                </div>
                <h1 className="text-2xl font-bold text-gray-900 mb-4">
                    Email Verified!
                </h1>
                <p className="text-gray-600 mb-8">
                    Your email has been successfully verified.
                </p>
                <button
                    onClick={handleReturnToApp}
                    className="w-full bg-green-600 text-white rounded-lg px-4 py-3 font-medium hover:bg-green-700 transition-colors"
                >
                    Return to App
                </button>
            </div>
        </div>
    );
};

export default VerifySuccess;