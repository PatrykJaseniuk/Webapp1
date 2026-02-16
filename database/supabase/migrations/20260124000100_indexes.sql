-- ================================================
-- RENTAL MANAGEMENT SYSTEM - INDEXES
-- ================================================
-- Performance indexes for all tables
-- Optimizes common query patterns

-- USER ROLES INDEXES
-- (Primary key on user_id already indexed)

-- PROPERTIES INDEXES
CREATE INDEX idx_properties_status ON public.properties(status);
CREATE INDEX idx_properties_created_by ON public.properties(created_by);
CREATE INDEX idx_properties_type ON public.properties(property_type);

-- TENANTS INDEXES
CREATE INDEX idx_tenants_user_id ON public.tenants(user_id);
CREATE INDEX idx_tenants_status ON public.tenants(status);
CREATE INDEX idx_tenants_email ON public.tenants(email);

-- LEASE AGREEMENTS INDEXES
CREATE INDEX idx_leases_tenant_id ON public.lease_agreements(tenant_id);
CREATE INDEX idx_leases_property_id ON public.lease_agreements(property_id);
CREATE INDEX idx_leases_status ON public.lease_agreements(status);
CREATE INDEX idx_leases_dates ON public.lease_agreements(start_date, end_date);
CREATE INDEX idx_leases_created_by ON public.lease_agreements(created_by);
-- Composite index for finding active leases per property
CREATE INDEX idx_leases_property_active ON public.lease_agreements(property_id, status) 
    WHERE status = 'active';

-- ATTACHMENTS INDEXES
CREATE INDEX idx_attachments_related ON public.attachments(related_to_type, related_to_id);
CREATE INDEX idx_attachments_type ON public.attachments(file_type);
CREATE INDEX idx_attachments_created_by ON public.attachments(created_by);
CREATE INDEX idx_attachments_created_at ON public.attachments(created_at DESC);

-- TRANSACTIONS INDEXES
CREATE INDEX idx_transactions_lease_id ON public.transactions(lease_id);
CREATE INDEX idx_transactions_property_id ON public.transactions(property_id);
CREATE INDEX idx_transactions_status ON public.transactions(status);
CREATE INDEX idx_transactions_due_date ON public.transactions(due_date);
CREATE INDEX idx_transactions_type ON public.transactions(type);
CREATE INDEX idx_transactions_created_by ON public.transactions(created_by);
-- Composite index for unpaid/overdue transactions
CREATE INDEX idx_transactions_unpaid ON public.transactions(status, due_date) 
    WHERE status IN ('pending', 'overdue');
