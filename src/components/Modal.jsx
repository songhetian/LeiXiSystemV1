import React, { useEffect } from 'react'

const Modal = ({ isOpen, onClose, title, children, size = 'medium', footer, zIndex = 1000, variant = 'default', noPadding = false }) => {
  if (!isOpen) return null

  const sizeClasses = {
    small: 'max-w-md',
    medium: 'max-w-2xl',
    large: 'max-w-4xl',
    xlarge: 'max-w-6xl',
    ultra: 'max-w-[1100px]',
    mega: 'max-w-[1300px]',
    full: 'max-w-7xl',
    wide: 'max-w-[85vw]',
    xwide: 'max-w-[95vw]'
  }

  // Simple color variants
  const variantColors = {
    default: '#3b82f6',
    primary: '#8b5cf6',
    success: '#10b981',
    warning: '#f59e0b',
    danger: '#ef4444',
    info: '#06b6d4'
  }

  const headerColor = variantColors[variant] || variantColors.default

  // Handle escape key press
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [onClose])

  return (
    <div className="fixed inset-0 flex items-center justify-center" style={{ zIndex }}>
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fadeIn"
        onClick={onClose}
      ></div>
      <div
        className={`relative z-10 bg-white rounded-2xl shadow-2xl ${sizeClasses[size]} w-full mx-4 max-h-[96vh] overflow-hidden animate-slideUp`}
      >
        {title && (
          <div
            className="px-8 py-5 border-b"
            style={{
              backgroundColor: headerColor,
              borderBottomColor: headerColor
            }}
          >
            <h2 className="text-xl font-semibold text-white">{title}</h2>
          </div>
        )}
        <div className={`${noPadding ? '' : 'px-8 py-6'} overflow-y-auto max-h-[calc(96vh-160px)] custom-scrollbar`}>
          {children}
        </div>
        {footer && (
          <div className="px-8 py-5 border-t border-gray-200 bg-gray-50">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}

export default Modal
