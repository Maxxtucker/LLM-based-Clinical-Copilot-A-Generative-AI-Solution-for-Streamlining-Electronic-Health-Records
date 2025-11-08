import React from "react";

export default function ConfirmDialog({ 
  open, 
  title, 
  description, 
  onConfirm, 
  onCancel,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel"
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-white rounded-lg p-6 max-w-sm w-full shadow-lg">
        <h3 className="text-lg font-semibold mb-4">{title}</h3>
        <p className="mb-6">{description}</p>
        <div className="flex justify-end gap-4">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded border border-gray-300 hover:bg-gray-100"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
