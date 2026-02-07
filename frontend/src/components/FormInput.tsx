import styles from './FormInput.module.css';

interface FormInputProps {
    label: string;
<<<<<<< HEAD
    type: 'text' | 'email' | 'password' | 'number' | 'date' | 'select';
=======
    type?: 'text' | 'email' | 'password' | 'number' | 'date' | 'select';
>>>>>>> LLM(claude-haiku-4-5)
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    required?: boolean;
<<<<<<< HEAD
    error?: string;
    options?: { value: string; label: string }[];
=======
    disabled?: boolean;
    options?: { value: string; label: string }[];
    error?: string;
>>>>>>> LLM(claude-haiku-4-5)
}

export const FormInput = ({
    label,
<<<<<<< HEAD
    type,
    value,
    onChange,
    placeholder = '',
    required = false,
    error,
    options = []
=======
    type = 'text',
    value,
    onChange,
    placeholder,
    required = false,
    disabled = false,
    options = [],
    error,
>>>>>>> LLM(claude-haiku-4-5)
}: FormInputProps) => (
    <div className={styles.inputGroup}>
        <label className={styles.label}>
            {label}
            {required && <span className={styles.required}>*</span>}
        </label>
<<<<<<< HEAD

=======
>>>>>>> LLM(claude-haiku-4-5)
        {type === 'select' ? (
            <select
                className={`${styles.input} ${error ? styles.error : ''}`}
                value={value}
                onChange={(e) => onChange(e.target.value)}
<<<<<<< HEAD
                required={required}
            >
                <option value="">{placeholder || 'Select an option'}</option>
                {options.map((option) => (
                    <option key={option.value} value={option.value}>
                        {option.label}
=======
                disabled={disabled}
                required={required}
            >
                <option value="">Select {label}</option>
                {options.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                        {opt.label}
>>>>>>> LLM(claude-haiku-4-5)
                    </option>
                ))}
            </select>
        ) : (
            <input
<<<<<<< HEAD
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
=======
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
>>>>>>> LLM(claude-haiku-4-5)
