import React, { useEffect, useState } from 'react';

export type ToastType = 'success' | 'warning' | 'danger';

interface ErrorPopupProps {
    message: string;
    type: ToastType;
    icon?: React.ReactNode;
    onClose?: () => void;
    autoClose?: boolean;
    duration?: number;
}

const ErrorPopup: React.FC<ErrorPopupProps> = ({
    message,
    type = 'danger',
    icon,
    onClose,
    autoClose = true,
    duration = 5000,
}) => {
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        if (autoClose) {
            const timer = setTimeout(() => {
                setIsVisible(false);
                setTimeout(() => {
                    onClose?.();
                }, 300); // Allow time for fade-out animation
            }, duration);

            return () => clearTimeout(timer);
        }
    }, [duration, onClose, autoClose]);

    const handleClose = () => {
        setIsVisible(false);
        setTimeout(() => {
            onClose?.();
        }, 300);
    };

    return (
        <div className="fixed top-23">
            <div
            className={`relative w-full max-w-200 flex flex-wrap items-center justify-center py-3 pl-4 pr-14 rounded-lg text-base font-medium transition-all duration-300 border-solid border ${
                isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'
            } ${
                type === 'danger'
                ? 'border-[#f85149] text-[#b22b2b] bg-[linear-gradient(#f851491a,#f851491a)]'
                : type === 'warning'
                    ? 'border-[#f0ad4e] text-[#8a6d3b] bg-[linear-gradient(#f0ad4e1a,#f0ad4e1a)]'
                    : 'border-[#4caf50] text-[#3c763d] bg-[linear-gradient(#4caf501a,#4caf501a)]'
            }`}
            >
            <button
                onClick={handleClose}
                type="button"
                aria-label="close-error"
                className={`absolute right-4 p-1 rounded-md transition-opacity border opacity-40 hover:opacity-100 ${
                type === 'danger' ? 'text-[#f85149] border-[#f85149]' :
                type === 'warning' ? 'text-[#f0ad4e] border-[#f0ad4e]' :
                'text-[#4caf50] border-[#4caf50]'
                }`}
            >
                <svg
                stroke="currentColor"
                fill="none"
                strokeWidth="2"
                viewBox="0 0 24 24"
                strokeLinecap="round"
                strokeLinejoin="round"
                height="16"
                width="16"
                className="h-4 w-4"
                xmlns="http://www.w3.org/2000/svg"
                >
                <path d="M18 6 6 18"></path>
                <path d="m6 6 12 12"></path>
                </svg>
            </button>
            <p className="flex flex-row items-center mr-auto gap-x-2">
                {icon || (
                <svg
                    stroke="currentColor"
                    fill="none"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    height="28"
                    width="28"
                    className="h-7 w-7"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path>
                    <path d="M12 9v4"></path>
                    <path d="M12 17h.01"></path>
                </svg>
                )}
                {message}
            </p>
            </div>
        </div>
    );
};

export default ErrorPopup;
