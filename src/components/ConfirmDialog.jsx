import React from 'react';
import Modal from './Modal';
import {
    ExclamationCircleIcon,
    InformationCircleIcon,
    ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

const ConfirmDialog = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = '确认',
    cancelText = '取消',
    type = 'danger'
}) => {

    const getTypeConfig = () => {
        switch (type) {
            case 'danger':
                return {
                    icon: <ExclamationCircleIcon className="w-6 h-6 text-red-600" />,
                    confirmBtn: 'bg-red-600 hover:bg-red-700 focus:ring-red-500',
                    variant: 'danger'
                };
            case 'warning':
                return {
                    icon: <ExclamationTriangleIcon className="w-6 h-6 text-yellow-600" />,
                    confirmBtn: 'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500',
                    variant: 'warning'
                };
            case 'info':
                return {
                    icon: <InformationCircleIcon className="w-6 h-6 text-blue-600" />,
                    confirmBtn: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500',
                    variant: 'info'
                };
            default:
                return {
                    icon: <ExclamationCircleIcon className="w-6 h-6 text-gray-600" />,
                    confirmBtn: 'bg-gray-600 hover:bg-gray-700 focus:ring-gray-500',
                    variant: 'default'
                };
        }
    };

    const config = getTypeConfig();

    const renderFooter = () => (
        <div className="flex justify-end gap-3">
            <button
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
            >
                {cancelText}
            </button>
            <button
                onClick={() => {
                    onConfirm();
                    onClose();
                }}
                className={`px-4 py-2 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors ${config.confirmBtn}`}
            >
                {confirmText}
            </button>
        </div>
    );

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={
                <div className="flex items-center gap-2">
                    {config.icon}
                    <span>{title}</span>
                </div>
            }
            size="small"
            footer={renderFooter()}
            variant={config.variant}
        >
            <div className="text-gray-600 leading-relaxed text-base py-2">
                {message}
            </div>
        </Modal>
    );
};

export default ConfirmDialog;
