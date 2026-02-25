'use client';
import { database } from '@/api/database';
import { useNavigate } from '@/routes/useNavigate';
import { routes } from '@/routes';
import { ManyRecords } from '@/components/shared/ManyRecords';

export const ViewAllProperties = () => {
    const navigate = useNavigate();

    return (
        <ManyRecords
            columns={{
                'name': {
                    hidden: false,
                    // label: 'marian'
                    cellRender(value, row) {
                        return <div> witam {value as string}</div>
                    },

                },
            }}
            query={() => database.from('properties').select('id,  address, name, status')}
            // hiddenColumns={['created_by', 'updated_at', 'notes']}
            onRowClick={(row) => navigate(routes.landlord.properties({ id: row.id as string }))}
            onAdd={() => navigate(routes.landlord.properties({ action: 'new' }))}
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