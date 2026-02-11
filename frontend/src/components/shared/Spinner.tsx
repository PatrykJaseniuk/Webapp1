'use client';

export const Spinner = () => (
    <div role="status" aria-label="Ładowanie">
        <div className="spinner" />
        <span className="srOnly">Ładowanie...</span>
    </div>
);
