import React from 'react';
import { Modal, Button } from 'antd';
import { ExclamationCircleOutlined, InfoCircleOutlined, WarningOutlined } from '@ant-design/icons';

// 简单的类名合并函数替代 cn
const cn = (...classes) => classes.filter(Boolean).join(' ');

const ConfirmDialog = ({ isOpen, onClose, onConfirm, title, message, confirmText = '确认', cancelText = '取消', type = 'danger' }) => {
    const getTypeConfig = () => {
        switch (type) {
            case 'danger':
                return {
                    icon: <ExclamationCircleOutlined />,
                    iconColor: 'text-red-600',
                    confirmBtn: 'bg-red-600 hover:bg-red-700'
                };
            case 'warning':
                return {
                    icon: <WarningOutlined />,
                    iconColor: 'text-yellow-600',
                    confirmBtn: 'bg-yellow-600 hover:bg-yellow-700'
                };
            case 'info':
                return {
                    icon: <InfoCircleOutlined />,
                    iconColor: 'text-blue-600',
                    confirmBtn: 'bg-blue-600 hover:bg-blue-700'
                };
            default:
                return {
                    icon: <ExclamationCircleOutlined />,
                    iconColor: 'text-gray-600',
                    confirmBtn: 'bg-gray-600 hover:bg-gray-700'
                };
        }
    };

    const config = getTypeConfig();

    return (
        <Modal
            open={isOpen}
            onCancel={onClose}
            onOk={() => {
                onConfirm();
                onClose();
            }}
            title={
                <div className="flex items-center gap-3">
                    <span className={cn("text-xl", config.iconColor)}>
                        {config.icon}
                    </span>
                    <span className="text-lg font-bold">{title}</span>
                </div>
            }
            okText={confirmText}
            cancelText={cancelText}
            okButtonProps={{
                className: config.confirmBtn
            }}
        >
            <div className="text-gray-600 leading-relaxed pt-2">
                {message}
            </div>
        </Modal>
    );
};

export default ConfirmDialog;
