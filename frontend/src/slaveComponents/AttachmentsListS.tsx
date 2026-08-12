type Attachment = {
  readonly id: string;
  readonly file_url: string;
  readonly file_name: string;
  readonly description: string | null;
  readonly file_type: string | null;
  readonly file_size: number | null;
};

export const AttachmentsListS = ({ attachments }: { readonly attachments: readonly Attachment[] }): JSX.Element => (
  <div className="space-y-2">
    {attachments.map((a) => (
      <div key={a.id} className="flex items-center justify-between rounded border border-gray-100 px-4 py-2">
        <div><a href={a.file_url} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline">{a.file_name}</a>{a.description !== null ? <p className="text-xs text-gray-500">{a.description}</p> : undefined}</div>
        <span className="text-xs text-gray-400">{a.file_type ?? 'inny'}{a.file_size !== null ? ` · ${(a.file_size / 1024).toFixed(0)} KB` : ''}</span>
      </div>
    ))}
  </div>
);

export const AttachmentsSectionS = ({
  attachments,
  emptyMessage,
}: {
  readonly attachments: readonly Attachment[];
  readonly emptyMessage: string;
}): JSX.Element =>
  attachments.length === 0 ?
    <p className="text-sm text-gray-500">{emptyMessage}</p> :
    <AttachmentsListS attachments={attachments} />;