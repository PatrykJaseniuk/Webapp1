import { TenantsSingle } from '@/masterComponents/TenantsSingle';
import { TenantsFormFields } from '@/slaveComponents/TenantsFormFields';
import { LoadingSpinner } from '@/slaveComponents/LoadingSpinner';

const FormError = (
  <div className="flex flex-col items-center justify-center gap-4 py-16">
    <p className="text-red-600">Nie udało się załadować najemcy.</p>
  </div>
);

export const TenantsFormPage = (): JSX.Element => (
  <TenantsSingle
    FormFieldsComponent={TenantsFormFields}
    LoadingComponent={<LoadingSpinner />}
    ErrorComponent={FormError}
  />
);