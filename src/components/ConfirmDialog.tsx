import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertCircle, X, Check } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
}

export function ConfirmDialog({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger'
}: ConfirmDialogProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-[#141414] border border-[#262626] rounded-[32px] w-full max-w-md shadow-2xl overflow-hidden"
          >
            <div className="p-8">
              <div className="flex items-center gap-4 mb-6">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                  variant === 'danger' ? 'bg-red-500/10 text-red-500' :
                  variant === 'warning' ? 'bg-orange-500/10 text-orange-500' :
                  'bg-sky-500/10 text-sky-500'
                }`}>
                  <AlertCircle className="w-6 h-6" />
                </div>
                <h2 className="text-xl font-black text-white uppercase tracking-tight">{title}</h2>
              </div>
              
              <p className="text-neutral-400 font-medium leading-relaxed mb-8">
                {message}
              </p>
              
              <div className="flex gap-4">
                <button
                  onClick={onCancel}
                  className="flex-1 px-6 py-4 bg-[#1f1f1f] text-neutral-400 rounded-2xl font-bold hover:text-white transition-all flex items-center justify-center gap-2"
                >
                  <X className="w-4 h-4" />
                  {cancelText}
                </button>
                <button
                  onClick={onConfirm}
                  className={`flex-1 px-6 py-4 rounded-2xl font-bold text-black transition-all flex items-center justify-center gap-2 ${
                    variant === 'danger' ? 'bg-red-500 hover:bg-red-400' :
                    variant === 'warning' ? 'bg-orange-500 hover:bg-orange-400' :
                    'bg-sky-500 hover:bg-sky-400'
                  }`}
                >
                  <Check className="w-4 h-4" />
                  {confirmText}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
