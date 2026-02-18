'use client';

import { Database } from "@/api/database.types";


interface ManyAttachmentsProps {
    isLoading: boolean;
    onRecordClick: (id: string) => void;
    data: Database['public']['Tables']['attachments']['Row'][];
}

export const ManyAttachments = ({ isLoading, onRecordClick, data }: ManyAttachmentsProps) => (
    <h1>Components for displaying atachments. Just record without headers. Implementation of generic container (tabel, grid, or something else)</h1>
);