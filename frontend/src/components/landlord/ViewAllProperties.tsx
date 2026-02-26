'use client';
import { database } from '@/api/database';
import { routes } from '@/routes';
import { ManyRecords } from '@/components/coreComponents/ManyRecords';
import { useRouter } from 'next/navigation';

export const ViewAllProperties = () => {
    const router = useRouter();

    return (
        <ManyRecords
            columns={{
                'name': {
                    hidden: false,
                    // label: 'marian'
                    fieldOutput(value, row) {
                        return <div> witam {value as string}</div>
                    },

                },
            }}
            query={() => database.from('properties').select('id,  address, name, status, lease_agreements(*)')}
            // hiddenColumns={['created_by', 'updated_at', 'notes']}
            onRowClick={(row) => router.push(routes.landlord.properties({ id: row.id as string }))}
            onAdd={() => router.push(routes.landlord.properties({ action: 'new' }))}
        />
    );
};

// address: string;
//                 bedrooms: number | null;
//                 created_at: string | null;
//                 created_by: string | null;
//                 deposit_amount: number;
//                 id: string;
//                 monthly_rent: number;
//                 name: string;
//                 notes: string | null;
//                 property_type: string;
//                 size_sqm: number | null;
//                 status: string;
// updated_at: string | null;