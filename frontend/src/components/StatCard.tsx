import styles from './StatCard.module.css';

interface StatCardProps {
    label: string;
    value: string | number;
    icon?: string;
    color?: 'blue' | 'green' | 'orange' | 'purple';
}

export const StatCard = ({ label, value, icon, color = 'blue' }: StatCardProps) => (
    <div className={`${styles.card} ${styles[color]}`}>
        {icon && <div className={styles.icon}>{icon}</div>}
        <div className={styles.content}>
            <div className={styles.value}>{value}</div>
            <div className={styles.label}>{label}</div>
        </div>
    </div>
);
