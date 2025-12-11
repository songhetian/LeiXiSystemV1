// [SHADCN-REPLACED]
import React from 'react'
import { Dialog, DialogContent } from './ui/dialog'

const Modal = ({ isOpen, onClose, title, children, size = 'medium', footer, zIndex = 1000, variant = 'default' }) => {
  const sizeClasses = {
    small: 'max-w-md',
    medium: 'max-w-2xl',
    large: 'max-w-4xl',
    xlarge: 'max-w-6xl',
    full: 'max-w-7xl',
    wide: 'max-w-[85vw]'
  }

  const variantColors = {
    default: '#3b82f6',
    primary: '#8b5cf6',
    success: '#10b981',
    warning: '#f59e0b',
    danger: '#ef4444',
    info: '#06b6d4'
  }

  const headerColor = variantColors[variant] || variantColors.default

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent className={`w-full ${sizeClasses[size]}`} style={{ zIndex }}>
        {title && (
          <div className="px-6 py-4 border-b" style={{ backgroundColor: headerColor, borderBottomColor: headerColor }}>
            <h2 className="text-xl font-semibold text-white">{title}</h2>
          </div>
        )}
        <div className="px-6 py-4 overflow-y-auto max-h-[calc(90vh-140px)] custom-scrollbar">
          {children}
        </div>
        {footer && (
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
            {footer}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

export default Modal
