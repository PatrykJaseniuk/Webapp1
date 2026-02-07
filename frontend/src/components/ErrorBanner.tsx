import styles from './ErrorBanner.module.css';

interface ErrorBannerProps {
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
