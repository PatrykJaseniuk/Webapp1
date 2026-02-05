import styles from './ErrorBanner.module.css';

interface ErrorBannerProps {
    message: string;
    onClose?: () => void;
}

export const ErrorBanner = ({ message, onClose }: ErrorBannerProps) => (
    <div className={styles.errorBanner}>
        <span className={styles.icon}>⚠️</span>
        <span className={styles.message}>{message}</span>
        {onClose && (
            <button className={styles.closeButton} onClick={onClose}>
                ×
            </button>
        )}
    </div>
);