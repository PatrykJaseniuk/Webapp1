import { PropertiesSingle } from '@/masterComponents/PropertiesSingle';
import { PropertiesFormFields } from '@/slaveComponents/PropertiesFormFields';
import { LoadingSpinner } from '@/slaveComponents/LoadingSpinner';

const FormError = (
  <div className="flex flex-col items-center justify-center gap-4 py-16">
    <p className="text-red-600">Nie udało się załadować nieruchomości.</p>
  </div>
);

export const PropertiesFormPage = (): JSX.Element => (
  <PropertiesSingle
    FormFieldsComponent={PropertiesFormFields}
    LoadingComponent={<LoadingSpinner />}
    ErrorComponent={FormError}
  />
);