-- ================================================
-- RENTAL MANAGEMENT SYSTEM - INDEXES
-- ================================================
-- Performance indexes for all tables
-- Optimizes common query patterns

-- USER ROLES INDEXES
-- (Primary key on user_id already indexed)

-- PROPERTIES INDEXES
CREATE INDEX idx_properties_status ON public.property(property_status);
CREATE INDEX idx_properties_created_by ON public.property(created_by);
CREATE INDEX idx_properties_type ON public.property(property_type);

-- TENANTS INDEXES
CREATE INDEX idx_tenants_user_id ON public.tenant(user_id);
CREATE INDEX idx_tenants_status ON public.tenant(tenant_status);
CREATE INDEX idx_tenants_email ON public.tenant(email);

-- LEASE AGREEMENTS INDEXES
CREATE INDEX idx_leases_tenant_id ON public.lease_agreement(tenant_id);
CREATE INDEX idx_leases_property_id ON public.lease_agreement(property_id);
CREATE INDEX idx_leases_status ON public.lease_agreement(lease_status);
CREATE INDEX idx_leases_dates ON public.lease_agreement(start_date, end_date);
CREATE INDEX idx_leases_created_by ON public.lease_agreement(created_by);
-- Composite index for finding active leases per property
CREATE INDEX idx_leases_property_active ON public.lease_agreement(property_id, lease_status) 
    WHERE lease_status = 'active';

-- ATTACHMENTS INDEXES
CREATE INDEX idx_attachments_related ON public.attachment(related_to_type, related_to_id);
CREATE INDEX idx_attachments_type ON public.attachment(file_type);
CREATE INDEX idx_attachments_created_by ON public.attachment(created_by);
CREATE INDEX idx_attachments_created_at ON public.attachment(created_at DESC);

-- FINANCIAL ENTRIES INDEXES
CREATE INDEX idx_financial_entries_lease_id ON public.financial_entry(lease_id);
CREATE INDEX idx_financial_entries_property_id ON public.financial_entry(property_id);
CREATE INDEX idx_financial_entries_treasury_id ON public.financial_entry(treasury_id);
CREATE INDEX idx_financial_entries_value_date ON public.financial_entry(value_date);
CREATE INDEX idx_financial_entries_created_by ON public.financial_entry(created_by);
-- Composite index for the per-lease ledger (FIFO ageing walks value_date in order)
CREATE INDEX idx_financial_entries_lease_value ON public.financial_entry(lease_id, value_date);
-- Composite index for the per-treasury cash statement
CREATE INDEX idx_financial_entries_treasury_value ON public.financial_entry(treasury_id, value_date);

-- TREASURIES INDEXES
CREATE INDEX idx_treasuries_is_active ON public.treasury(is_active);
CREATE INDEX idx_treasuries_created_by ON public.treasury(created_by);

-- LEASE DEPOSIT SETTLEMENT INDEX
CREATE INDEX idx_leases_deposit_entry_id ON public.lease_agreement(deposit_entry_id);
