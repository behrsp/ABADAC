import React from 'react';
import { Trash2, AlertTriangle, X } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDestructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title = 'Confirmar Exclusão',
  message,
  confirmLabel = 'Sim, Excluir',
  cancelLabel = 'Cancelar',
  isDestructive = true,
  onConfirm,
  onCancel
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-3xl p-6 sm:p-7 shadow-2xl flex flex-col justify-between">
        <button
          onClick={onCancel}
          className="absolute top-5 right-5 p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-900 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-start gap-4 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-red-950/80 border border-red-800/80 text-red-400 flex items-center justify-center shrink-0">
            <Trash2 className="w-6 h-6 text-red-500" />
          </div>

          <div className="min-w-0 pr-4">
            <h3 className="text-lg font-bold text-white leading-tight">
              {title}
            </h3>
            <p className="text-xs sm:text-sm text-zinc-300 mt-1.5 leading-relaxed">
              {message}
            </p>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-zinc-800/80 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white text-xs font-semibold transition"
          >
            {cancelLabel}
          </button>

          <button
            type="button"
            onClick={onConfirm}
            className={`px-5 py-2.5 rounded-xl font-bold text-xs text-white shadow-lg transition ${
              isDestructive
                ? 'bg-red-600 hover:bg-red-500 shadow-red-600/20'
                : 'bg-amber-500 hover:bg-amber-400 text-black shadow-amber-500/20'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
