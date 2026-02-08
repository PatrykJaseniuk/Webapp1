import styles from './SuccessBanner.module.css';

interface SuccessBannerProps {
    msg: string;
}

export const SuccessBanner = ({ msg }: SuccessBannerProps) => (
    <div className={styles.banner}>
        <span className={styles.icon}>✓</span>
        <span className={styles.message}>{msg}</span>
    </div>
);
