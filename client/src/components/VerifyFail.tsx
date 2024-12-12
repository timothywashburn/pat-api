import React from 'react';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';

const VerifyFail: React.FC = () => {
    const [searchParams] = useSearchParams();
    const error = searchParams.get('error');

    const getErrorContent = () => {
        switch (error) {
            case 'already-verified':
                return {
                    icon: <CheckCircle2 className="h-12 w-12 text-blue-600" />,
                    iconBgColor: 'bg-blue-100',
                    title: 'Already Verified',
                    message: "Your email has already been verified. You can continue using the app.",
                    buttonColor: 'bg-blue-600 hover:bg-blue-700'
                };
            case 'invalid-token':
                return {
                    icon: <AlertCircle className="h-12 w-12 text-red-600" />,
                    iconBgColor: 'bg-red-100',
                    title: 'Verification Failed',
                    message: "This verification link is invalid or has expired. Please request a new verification email.",
                    buttonColor: 'bg-red-600 hover:bg-red-700'
                };
            case 'verification-failed':
            default:
                return {
                    icon: <AlertCircle className="h-12 w-12 text-red-600" />,
                    iconBgColor: 'bg-red-100',
                    title: 'Verification Failed',
                    message: "We couldn't verify your email at this time. Please try again later or contact support if the issue persists.",
                    buttonColor: 'bg-red-600 hover:bg-red-700'
                };
        }
    };

    const handleReturnToApp = () => {
        window.location.href = 'pat.timothyw.dev://';
    };

    const content = getErrorContent();

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
                <div className="mb-6 flex justify-center">
                    <div className={`rounded-full ${content.iconBgColor} p-3`}>
                        {content.icon}
                    </div>
                </div>
                <h1 className="text-2xl font-bold text-gray-900 mb-4">
                    {content.title}
                </h1>
                <p className="text-gray-600 mb-8">
                    {content.message}
                </p>
                <div className="space-y-4">
                    <button
                        onClick={handleReturnToApp}
                        className={`w-full ${content.buttonColor} text-white rounded-lg px-4 py-3 font-medium transition-colors`}
                    >
                        Return to App
                    </button>
                </div>
            </div>
        </div>
    );
};

export default VerifyFail;