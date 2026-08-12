import { match } from 'ts-pattern';
import type { TransactionSProps } from '@/masterComponents/TransactionM';
import { LoadingSpinner } from './LoadingSpinnerS';
import { ErrorMessage } from './ErrorMessageS';
import { TRANSACTION_STATUS_LABEL, TRANSACTION_TYPE_LABEL } from './domain';
import { txnStatusPillClass } from './pills';
import { formatPln } from './format';
import { labelClass, sectionClass, sectionTitleClass, valueClass } from './detail';

type Data = Extract<TransactionSProps['asyncData'], { readonly tag: 'fulfilled' }>['data'];
type NavLinkTo = TransactionSProps['navLinkTo'];

type DetailContentProps = {
  readonly data: Data;
  readonly navLinkTo: NavLinkTo;
};

const DetailContent = ({
  data,
  navLinkTo,
}: DetailContentProps): JSX.Element => {
  const t = data.transaction;
  return (
    <div className="mx-auto max-w-4xl space-y-6 py-8">
      <div className="[&_a]:text-sm [&_a]:text-blue-600 hover:[&_a]:text-blue-800 hover:[&_a]:underline">
        {navLinkTo.linkToTransactions({ style: {}, content: '← Powrót' })}
        <h1 className="mt-1 text-2xl font-bold text-gray-900">Transakcja</h1>
      </div>

      <div className={sectionClass}>
        <h2 className={sectionTitleClass}>Dane transakcji</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <div><p className={labelClass}>Typ</p><p className={valueClass}>{TRANSACTION_TYPE_LABEL[t.type] ?? t.type}</p></div>
          <div><p className={labelClass}>Status</p><span className={txnStatusPillClass(t.transaction_status)}>{TRANSACTION_STATUS_LABEL[t.transaction_status] ?? t.transaction_status}</span></div>
          <div><p className={labelClass}>Kwota</p><p className={`text-sm font-semibold ${t.amount >= 0 ? 'text-green-700' : 'text-red-700'}`}>{formatPln(t.amount)}</p></div>
          <div><p className={labelClass}>Termin płatności</p><p className={valueClass}>{t.due_date}</p></div>
          {t.property_id !== null && data.propertyName !== null ?
            <div><p className={labelClass}>Nieruchomość</p><span className="[&_a]:text-blue-600 hover:[&_a]:text-blue-800 hover:[&_a]:underline">{navLinkTo.toProperty({ id: t.property_id, style: {}, content: data.propertyName })}</span></div> :
            undefined}
          {t.lease_id !== null && data.leaseDescription !== null ?
            <div><p className={labelClass}>Umowa</p><span className="[&_a]:text-blue-600 hover:[&_a]:text-blue-800 hover:[&_a]:underline">{navLinkTo.toLease({ id: t.lease_id, style: {}, content: data.leaseDescription })}</span></div> :
            undefined}
        </div>
        <div className="mt-4"><p className={labelClass}>Opis</p><p className={`${valueClass} mt-1`}>{t.description}</p></div>
      </div>
    </div>
  );
};

export const TransactionDetailS = (props: TransactionSProps): JSX.Element => (
  <div className="min-h-[400px]">
    {match(props.asyncData)
      .with({ tag: 'pending' }, () => <LoadingSpinner />)
      .with({ tag: 'rejected' }, ({ message, onRetry }) => (<ErrorMessage message={message} onRetry={onRetry} />))
      .with({ tag: 'fulfilled' }, ({ data }) => (
        <DetailContent
          data={data}
          navLinkTo={props.navLinkTo}
        />
      ))
      .exhaustive()}
  </div>
);