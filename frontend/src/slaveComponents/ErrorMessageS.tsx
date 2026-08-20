type Props = {
  readonly message: string;
  readonly onRetry: () => void;
};

export const ErrorMessage = ({ message, onRetry }: Props): JSX.Element => (
  <div className="flex flex-1 flex-col items-center justify-center gap-4 py-16">
    <p className="text-red-600">{message}</p>
    <button
      type="button"
      onClick={onRetry}
      className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
    >
      Spróbuj ponownie
    </button>
  </div>
);