import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { DollarSign, X, Check } from 'lucide-react';

interface PromptDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: (value: string) => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
  placeholder?: string;
  initialValue?: string;
  type?: 'text' | 'number';
}

export function PromptDialog({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  placeholder = 'Enter value...',
  initialValue = '',
  type = 'text'
}: PromptDialogProps) {
  const [value, setValue] = useState(initialValue);

  useEffect(() => {
    if (isOpen) {
      setValue(initialValue);
    }
  }, [isOpen, initialValue]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value.trim()) {
      onConfirm(value);
    }
  };

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
            <form onSubmit={handleSubmit} className="p-8">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-sky-500/10 text-sky-500 flex items-center justify-center">
                  <DollarSign className="w-6 h-6" />
                </div>
                <h2 className="text-xl font-black text-white uppercase tracking-tight">{title}</h2>
              </div>
              
              <p className="text-neutral-400 font-medium leading-relaxed mb-6">
                {message}
              </p>

              <div className="mb-8">
                <input
                  autoFocus
                  type={type}
                  step={type === 'number' ? 'any' : undefined}
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  placeholder={placeholder}
                  className="w-full px-6 py-4 bg-[#0a0a0a] border border-[#262626] rounded-2xl text-white focus:border-sky-500/50 focus:outline-none transition-all font-bold placeholder:text-neutral-800"
                />
              </div>
              
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={onCancel}
                  className="flex-1 px-6 py-4 bg-[#1f1f1f] text-neutral-400 rounded-2xl font-bold hover:text-white transition-all flex items-center justify-center gap-2"
                >
                  <X className="w-4 h-4" />
                  {cancelText}
                </button>
                <button
                  type="submit"
                  disabled={!value.trim()}
                  className="flex-1 px-6 py-4 bg-sky-500 text-black rounded-2xl font-bold hover:bg-sky-400 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Check className="w-4 h-4" />
                  {confirmText}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
