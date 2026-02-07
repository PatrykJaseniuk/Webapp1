import styles from './Loading.module.css';

interface LoadingProps {
    message?: string;
}

export const Loading = ({ message = 'Loading...' }: LoadingProps) => (
    <div className={styles.container}>
        <div className={styles.spinner}></div>
        <p className={styles.message}>{message}</p>
    </div>
);
