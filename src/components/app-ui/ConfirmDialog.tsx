import Button from './Button';

interface ConfirmDialogProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  title?: string;
  message?: string;
  loading?: boolean;
}

export default function ConfirmDialog({
  isOpen,
  onConfirm,
  onCancel,
  title = 'هل أنت متأكد؟',
  message = 'الحذف نهائي ومش هينفع ترجعه',
  loading = false,
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center no-print" dir="rtl">
      <div className="absolute inset-0 bg-black/50" onClick={onCancel} />
      <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 max-w-sm w-full mx-4">
        <div className="text-center">
          <div className="text-5xl mb-4">🗑️</div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{title}</h3>
          <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">{message}</p>
          <div className="flex gap-3">
            <Button variant="danger" fullWidth loading={loading} onClick={onConfirm}>
              حذف
            </Button>
            <Button variant="outline" fullWidth onClick={onCancel} disabled={loading}>
              إلغاء
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
