import { useParams } from 'react-router-dom';
import { TenantsSingle } from '@/masterComponents/TenantsSingle';
import { TenantsFormFields } from '@/slaveComponents/TenantsFormFields';

export const TenantsFormPage = (): JSX.Element => {
  const { id } = useParams<{ readonly id: string }>();

  return (
    <TenantsSingle
      id={id}
      FormFieldsComponent={TenantsFormFields}
    />
  );
};
