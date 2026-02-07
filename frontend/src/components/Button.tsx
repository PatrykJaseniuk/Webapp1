import styles from './Button.module.css';

interface ButtonProps {
    label: string;
    onClick?: () => void;
    disabled?: boolean;
<<<<<<< HEAD
    variant?: 'primary' | 'secondary';
=======
    variant?: 'primary' | 'secondary' | 'danger';
>>>>>>> LLM(claude-haiku-4-5)
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
<<<<<<< HEAD
        className={`${styles.button} ${styles[variant]}`}
        onClick={onClick}
        disabled={disabled}
        type={type}
    >
        {label}
    </button>
);
=======
        type={type}
        className={`${styles.button} ${styles[variant]}`}
        onClick={onClick}
        disabled={disabled}
    >
        {label}
    </button>
);
>>>>>>> LLM(claude-haiku-4-5)
