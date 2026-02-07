import styles from './FormInput.module.css';

interface FormInputProps {
    label: string;
    type?: 'text' | 'email' | 'password' | 'number' | 'date' | 'select';
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    required?: boolean;
    disabled?: boolean;
    options?: { value: string; label: string }[];
    error?: string;
}

export const FormInput = ({
    label,
    type = 'text',
    value,
    onChange,
    placeholder,
    required = false,
    disabled = false,
    options = [],
    error,
}: FormInputProps) => (
    <div className={styles.inputGroup}>
        <label className={styles.label}>
            {label}
            {required && <span className={styles.required}>*</span>}
        </label>
        {type === 'select' ? (
            <select
                className={`${styles.input} ${error ? styles.error : ''}`}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                disabled={disabled}
                required={required}
            >
                <option value="">Select {label}</option>
                {options.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                        {opt.label}
                    </option>
                ))}
            </select>
        ) : (
            <input
                type={type}
                className={`${styles.input} ${error ? styles.error : ''}`}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                disabled={disabled}
                required={required}
            />
        )}
        {error && <span className={styles.errorText}>{error}</span>}
    </div>
);
