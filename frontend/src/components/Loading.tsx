import styles from './Loading.module.css';

interface LoadingProps {
    message?: string;
}

export const Loading = ({ message = 'Loading...' }: LoadingProps) => (
<<<<<<< HEAD
    <div className={styles.loading}>
        <div className={styles.spinner}></div>
        <p className={styles.message}>{message}</p>
    </div>
);
=======
    <div className={styles.container}>
        <div className={styles.spinner}></div>
        <p className={styles.message}>{message}</p>
    </div>
);
>>>>>>> LLM(claude-haiku-4-5)
