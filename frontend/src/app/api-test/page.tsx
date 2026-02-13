"use client"
import { database } from "@/api/database"
import { useAsync } from "react-use"

export default () => {

    // najpierw wywoływane jest filtrowanie (WHERE) a póżniej INNERJOIN
    const propertiesStatus = useAsync(async () => {
        return await database

            .from("properties")
            .select('*, lease_agreements!inner(*,tenants!inner(*))')
            .eq('lease_agreements.tenants.email', 'anna.nowak@test.local')
        // .eq('lease_agreements.', 'Maria Kowalska')
    })
    // const propertyDetails = useAsync(async () => {
    //     return await database
    //         .from('properties')
    //         .select(`
    //             *,
    //             meters(
    //                 *,
    //                 meter_readings(
    //                     *
    //                 )
    //             ),
    //             lease_agreements(
    //                 *,
    //                 tenants(
    //                     first_name,
    //                     last_name,
    //                     email,
    //                     phone
    //                 ),
    //                 billing_items(
    //                     *,
    //                     payments(
    //                         *
    //                     )
    //                 )
    //             ),
    //             property_expenses(
    //                 *
    //             ),
    //             attachments(
    //                 *
    //             )
    //         `)
    //         .eq('id', id)
    //         .single();
    // })


    console.log(propertiesStatus)


    return (
        <div>
            <h1>API TEST</h1>

            <h1>1</h1>

        </div>
    )
}