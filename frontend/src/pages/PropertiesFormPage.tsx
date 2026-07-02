import { useParams } from 'react-router-dom';
import { PropertiesSingle } from '@/masterComponents/PropertiesSingle';
import { PropertiesFormFields } from '@/slaveComponents/PropertiesFormFields';
import { LoadingSpinner } from '@/slaveComponents/LoadingSpinner';

const FormError = (
  <div className="flex flex-col items-center justify-center gap-4 py-16">
    <p className="text-red-600">Nie udało się załadować nieruchomości.</p>
  </div>
);

export const PropertiesFormPage = (): JSX.Element => {
  const { id } = useParams<{ readonly id: string }>();

  return (
    <PropertiesSingle
      id={id}
      FormFieldsComponent={PropertiesFormFields}
      LoadingComponent={<LoadingSpinner />}
      ErrorComponent={FormError}
    />
  );
};
