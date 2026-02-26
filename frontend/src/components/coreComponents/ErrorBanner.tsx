'use client';
import styles from '@/components/styles/shared.module.css';

interface ErrorBannerProps {
    msg: string;
    retry?: () => void;
}

export const ErrorBanner = ({ msg, retry }: ErrorBannerProps) => (
    <div className={styles.banner} role="alert">
        <span className={styles.bannerMessage}>Błąd: {msg}</span>
        {retry && (
            <button className={styles.retryButton} onClick={retry}>
                Ponów
            </button>
        )}
    </div>
);
