"use client"

import { BillingForm } from "@/components/landlord/BillingForm";
import { BillingList } from "@/components/landlord/BillingList";
import { useSearchParams } from "next/navigation";


export default function Page() {

    const searchParams = useSearchParams();
    const action = searchParams.get('action');

    return (
        action === 'new' ? <BillingForm /> : <BillingList />
    );
}
