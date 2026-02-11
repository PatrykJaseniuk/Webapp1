'use client';

import styles from './Spinner.module.css';

export const Spinner = () => (
    <div className={styles.container} role="status" aria-label="Ładowanie">
        <div className={styles.spinner} />
        <span className={styles.srOnly}>Ładowanie...</span>
    </div>
);
