import React from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

const Modal = ({ isOpen, onClose, title, children, size = 'medium', footer, zIndex = 1000, variant = 'default' }) => {
  const sizeClasses = {
    small: 'max-w-md',
    medium: 'max-w-2xl',
    large: 'max-w-4xl',
    xlarge: 'max-w-6xl',
    full: 'max-w-7xl',
    wide: 'max-w-[85vw]'
  }

  // Simple color variants for header
  const variantColors = {
    default: 'bg-primary',
    primary: 'bg-purple-600',
    success: 'bg-green-600',
    warning: 'bg-amber-600',
    danger: 'bg-red-600',
    info: 'bg-cyan-600'
  }

  const headerColorClass = variantColors[variant] || variantColors.default

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className={cn(sizeClasses[size], "max-h-[90vh] overflow-hidden p-0")}
        style={{ zIndex }}
      >
        {title && (
          <DialogHeader className={cn("px-6 py-4 border-b", headerColorClass)}>
            <DialogTitle className="text-xl font-semibold text-white">{title}</DialogTitle>
          </DialogHeader>
        )}
        <div className="px-6 py-4 overflow-y-auto max-h-[calc(90vh-140px)] custom-scrollbar">
          {children}
        </div>
        {footer && (
          <DialogFooter className="px-6 py-4 border-t border-gray-200 bg-gray-50">
            {footer}
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  )
}

export default Modal
