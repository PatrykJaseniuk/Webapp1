import { useParams } from 'react-router-dom';
import { PropertiesSingle } from '@/masterComponents/PropertiesSingle';
import { PropertiesFormFields } from '@/slaveComponents/PropertiesFormFields';

export const PropertiesFormPage = (): JSX.Element => {
  const { id } = useParams<{ readonly id: string }>();

  return (
    <PropertiesSingle
      id={id}
      FormFieldsComponent={PropertiesFormFields}
    />
  );
};
