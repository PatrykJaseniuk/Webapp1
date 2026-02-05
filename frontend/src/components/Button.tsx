import styles from './Button.module.css';

interface ButtonProps {
    label: string;
    onClick?: () => void;
    disabled?: boolean;
    variant?: 'primary' | 'secondary';
    type?: 'button' | 'submit' | 'reset';
}

export const Button = ({
    label,
    onClick,
    disabled = false,
    variant = 'primary',
    type = 'button'
}: ButtonProps) => (
    <button
        className={`${styles.button} ${styles[variant]}`}
        onClick={onClick}
        disabled={disabled}
        type={type}
    >
        {label}
    </button>
);