'use client';

interface ErrorBannerProps {
    msg: string;
    retry?: () => void;
}

export const ErrorBanner = ({ msg, retry }: ErrorBannerProps) => (
    <div role="alert">
        <span>Błąd: {msg}</span>
        {retry && (
            <button onClick={retry}>
                Ponów
            </button>
        )}
    </div>
);
