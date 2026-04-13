"use client"
import { database } from "@/api/database"

import { useAsync } from "react-use"


export default () => {


    const res = useAsync(async () => {

        return await database.from('tenants').select('*, lease_agreements(*)',)
    })
    const data = res.value?.data
    const newRec = data && data[0]
    const handleInsert = async (data: any) => newRec && (async () => {
        newRec.email = 'borysek'
        const { lease_agreements, id, ...withoutLeasAgreaments } = newRec
        withoutLeasAgreaments.email = "borysek"
        const res = await database.from('tenants').insert(withoutLeasAgreaments)
        console.log(res)
    })()




    res.value?.data && console.log(res.value.data)
    return (
        <div>
            {JSON.stringify(res.value)}
            <button onClick={handleInsert}>insert</button>
        </div>
    )
}