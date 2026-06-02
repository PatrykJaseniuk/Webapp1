type TenantDetailPageProps = {
  readonly tenantId: string;
};

export const TenantDetailPage = ({
  tenantId,
}: TenantDetailPageProps): JSX.Element => (
  <div className="space-y-6">
    <h1 className="text-2xl font-bold text-gray-900">Najemca</h1>
    <p className="text-gray-500">ID: {tenantId}</p>
  </div>
);