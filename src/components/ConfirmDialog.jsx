import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { AlertTriangle, Info, AlertCircle, X } from 'lucide-react';
import { cn } from '@/lib/utils';

const ConfirmDialog = ({ isOpen, onClose, onConfirm, title, message, confirmText = '确认', cancelText = '取消', type = 'danger' }) => {
    const getTypeConfig = () => {
        switch (type) {
            case 'danger':
                return {
                    icon: AlertTriangle,
                    iconBg: 'bg-red-100',
                    iconColor: 'text-red-600',
                    confirmBtn: 'bg-red-600 hover:bg-red-700'
                };
            case 'warning':
                return {
                    icon: AlertTriangle,
                    iconBg: 'bg-yellow-100',
                    iconColor: 'text-yellow-600',
                    confirmBtn: 'bg-yellow-600 hover:bg-yellow-700'
                };
            case 'info':
                return {
                    icon: Info,
                    iconBg: 'bg-blue-100',
                    iconColor: 'text-blue-600',
                    confirmBtn: 'bg-blue-600 hover:bg-blue-700'
                };
            default:
                return {
                    icon: AlertCircle,
                    iconBg: 'bg-gray-100',
                    iconColor: 'text-gray-600',
                    confirmBtn: 'bg-gray-600 hover:bg-gray-700'
                };
        }
    };

    const config = getTypeConfig();
    const Icon = config.icon;

    return (
        <AlertDialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <AlertDialogContent className="max-w-md">
                <AlertDialogHeader>
                    <div className="flex items-center gap-3">
                        <div className={cn("p-2 rounded-xl", config.iconBg)}>
                            <Icon className={cn("w-6 h-6", config.iconColor)} />
                        </div>
                        <AlertDialogTitle className="text-lg font-bold">{title}</AlertDialogTitle>
                    </div>
                </AlertDialogHeader>
                <AlertDialogDescription className="text-gray-600 leading-relaxed pt-2">
                    {message}
                </AlertDialogDescription>
                <AlertDialogFooter className="flex gap-3 sm:gap-3">
                    <AlertDialogCancel
                        onClick={onClose}
                        className="flex-1 border-gray-200 hover:bg-gray-50"
                    >
                        {cancelText}
                    </AlertDialogCancel>
                    <AlertDialogAction
                        onClick={() => {
                            onConfirm();
                            onClose();
                        }}
                        className={cn("flex-1", config.confirmBtn)}
                    >
                        {confirmText}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
};

export default ConfirmDialog;
