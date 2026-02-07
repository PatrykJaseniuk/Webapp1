import { ReactNode } from 'react';
import styles from './Card.module.css';

interface CardProps {
    title?: string;
    children: ReactNode;
    className?: string;
}

export const Card = ({ title, children, className = '' }: CardProps) => (
    <div className={`${styles.card} ${className}`}>
        {title && <h2 className={styles.title}>{title}</h2>}
        <div className={styles.content}>{children}</div>
    </div>
);
