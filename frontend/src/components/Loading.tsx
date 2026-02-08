'use client';

import { useState, useEffect } from 'react';
import styles from './Loading.module.css';

interface LoadingProps {
    message?: string;
}

export const Loading = ({ message = 'Loading...' }: LoadingProps) => {
    const [show, setShow] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => setShow(true), 1000);
        return () => clearTimeout(timer);
    }, []);

    return show ? (
        <div className={styles.container}>
            <div className={styles.spinner}></div>
            <p className={styles.message}>{message}</p>
        </div>
    ) : null;
};
