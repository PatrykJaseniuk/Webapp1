'use client';
import styles from '@/components/styles/feedback.module.css';

interface ConfirmDialogProps {
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
    loading?: boolean;
}

export const ConfirmDialog = ({
    message,
    onConfirm,
    onCancel,
    loading = false,
}: ConfirmDialogProps) => (
    <div className={styles.overlay}>
        <div className={styles.dialog}>
            <p className={styles.dialogMessage}>{message}</p>
            <div className={styles.dialogActions}>
                <button className={styles.dialogCancel} onClick={onCancel} disabled={loading}>
                    Anuluj
                </button>
                <button className={styles.dialogConfirm} onClick={onConfirm} disabled={loading}>
                    {loading ? 'Usuwanie...' : 'Potwierdź'}
                </button>
            </div>
        </div>
    </div>
);
