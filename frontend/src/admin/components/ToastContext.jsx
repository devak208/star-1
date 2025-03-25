"use client"

import React, { createContext, useContext, useState } from "react"

// Create a context for toast notifications
const ToastContext = createContext()

// Types of toast messages
const TOAST_TYPES = {
  SUCCESS: "success",
  ERROR: "error",
  INFO: "info",
  WARNING: "warning",
}

// Toast component that will be displayed
const Toast = ({ message, type, onClose }) => {
  // Define styles based on toast type
  const getTypeStyles = () => {
    switch (type) {
      case TOAST_TYPES.SUCCESS:
        return "bg-green-50 text-green-800 border-green-200"
      case TOAST_TYPES.ERROR:
        return "bg-red-50 text-red-800 border-red-200"
      case TOAST_TYPES.WARNING:
        return "bg-yellow-50 text-yellow-800 border-yellow-200"
      case TOAST_TYPES.INFO:
      default:
        return "bg-blue-50 text-blue-800 border-blue-200"
    }
  }

  // Define icon based on toast type
  const getIcon = () => {
    switch (type) {
      case TOAST_TYPES.SUCCESS:
        return (
          <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
          </svg>
        )
      case TOAST_TYPES.ERROR:
        return (
          <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"></path>
          </svg>
        )
      case TOAST_TYPES.WARNING:
        return (
          <svg className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd"></path>
          </svg>
        )
      case TOAST_TYPES.INFO:
      default:
        return (
          <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"></path>
          </svg>
        )
    }
  }

  return (
    <div
      className={`flex items-center p-4 mb-4 border rounded-lg shadow-sm ${getTypeStyles()}`}
      role="alert"
    >
      <div className="inline-flex items-center justify-center flex-shrink-0 w-8 h-8 mr-3">
        {getIcon()}
      </div>
      <div className="text-sm font-normal">{message}</div>
      <button
        type="button"
        className="ml-auto -mx-1.5 -my-1.5 rounded-lg p-1.5 inline-flex items-center justify-center h-8 w-8 hover:bg-gray-100"
        onClick={onClose}
        aria-label="Close"
      >
        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"></path>
        </svg>
      </button>
    </div>
  )
}

// Toast provider component
export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([])

  // Add a new toast
  const showToast = (message, type = TOAST_TYPES.INFO, duration = 5000) => {
    const id = Date.now().toString()
    
    setToasts((prevToasts) => [
      ...prevToasts,
      { id, message, type, duration },
    ])

    // Auto-dismiss toast after specified duration
    if (duration > 0) {
      setTimeout(() => {
        removeToast(id)
      }, duration)
    }

    return id
  }

  // Remove a toast by ID
  const removeToast = (id) => {
    setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id))
  }

  // Value to be provided by the context
  const contextValue = {
    showToast,
    removeToast,
    toasts,
  }

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      
      {/* Toast container - fixed at the top right of the screen */}
      {toasts.length > 0 && (
        <div className="fixed top-4 right-4 z-50 max-w-xs w-full flex flex-col items-end space-y-2">
          {toasts.map((toast) => (
            <Toast
              key={toast.id}
              message={toast.message}
              type={toast.type}
              onClose={() => removeToast(toast.id)}
            />
          ))}
        </div>
      )}
    </ToastContext.Provider>
  )
}

// Custom hook to use toast context
export const useToast = () => {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider")
  }
  return context
}

export default ToastContext
