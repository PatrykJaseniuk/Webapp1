import styles from './ErrorBanner.module.css';

interface ErrorBannerProps {
<<<<<<< HEAD
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
=======
    msg: string;
    onDismiss?: () => void;
}

export const ErrorBanner = ({ msg, onDismiss }: ErrorBannerProps) => (
    <div className={styles.banner}>
        <span className={styles.icon}>⚠️</span>
        <span className={styles.message}>{msg}</span>
        {onDismiss && (
            <button className={styles.dismiss} onClick={onDismiss}>
                ✕
            </button>
        )}
    </div>
);
>>>>>>> LLM(claude-haiku-4-5)
