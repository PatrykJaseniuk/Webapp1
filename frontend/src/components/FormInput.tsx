import styles from './FormInput.module.css';

interface FormInputProps {
    label: string;
    type: 'text' | 'email' | 'password' | 'number' | 'date' | 'select';
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    required?: boolean;
    error?: string;
    options?: { value: string; label: string }[];
}

export const FormInput = ({
    label,
    type,
    value,
    onChange,
    placeholder = '',
    required = false,
    error,
    options = []
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
                required={required}
            >
                <option value="">{placeholder || 'Select an option'}</option>
                {options.map((option) => (
                    <option key={option.value} value={option.value}>
                        {option.label}
                    </option>
                ))}
            </select>
        ) : (
            <input
                className={`${styles.input} ${error ? styles.error : ''}`}
                type={type}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                required={required}
            />
        )}

        {error && <span className={styles.errorText}>{error}</span>}
    </div>
);