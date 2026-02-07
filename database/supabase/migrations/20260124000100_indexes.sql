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

-- BILLING ITEMS INDEXES
CREATE INDEX idx_billing_items_lease_id ON public.billing_items(lease_id);
CREATE INDEX idx_billing_items_status ON public.billing_items(status);
CREATE INDEX idx_billing_items_due_date ON public.billing_items(due_date);
CREATE INDEX idx_billing_items_type ON public.billing_items(item_type);
CREATE INDEX idx_billing_items_created_by ON public.billing_items(created_by);
-- Composite index for unpaid/overdue items
CREATE INDEX idx_billing_unpaid ON public.billing_items(status, due_date) 
    WHERE status IN ('pending', 'overdue');

-- PAYMENTS INDEXES
CREATE INDEX idx_payments_billing_item_id ON public.payments(billing_item_id);
CREATE INDEX idx_payments_date ON public.payments(payment_date DESC);
CREATE INDEX idx_payments_method ON public.payments(payment_method);
CREATE INDEX idx_payments_created_by ON public.payments(created_by);

-- METERS INDEXES
CREATE INDEX idx_meters_property_id ON public.meters(property_id);
CREATE INDEX idx_meters_type ON public.meters(meter_type);
CREATE INDEX idx_meters_active ON public.meters(active);

-- METER READINGS INDEXES
CREATE INDEX idx_meter_readings_meter_id ON public.meter_readings(meter_id);
CREATE INDEX idx_meter_readings_date ON public.meter_readings(reading_date DESC);
CREATE INDEX idx_meter_readings_created_by ON public.meter_readings(created_by);

-- UTILITY BILLS INDEXES
CREATE INDEX idx_utility_bills_lease_id ON public.utility_bills(lease_id);
CREATE INDEX idx_utility_bills_meter_id ON public.utility_bills(meter_id);
CREATE INDEX idx_utility_bills_billing_item_id ON public.utility_bills(billing_item_id);
CREATE INDEX idx_utility_bills_start_reading ON public.utility_bills(start_reading_id);
CREATE INDEX idx_utility_bills_end_reading ON public.utility_bills(end_reading_id);
CREATE INDEX idx_utility_bills_period ON public.utility_bills(billing_period_start, billing_period_end);

-- UTILITY PRICES INDEXES
CREATE INDEX idx_utility_prices_type ON public.utility_prices(utility_type);
CREATE INDEX idx_utility_prices_date ON public.utility_prices(effective_date DESC);
-- Composite index for finding current price
CREATE INDEX idx_utility_prices_type_date ON public.utility_prices(utility_type, effective_date DESC);

-- PROPERTY EXPENSES INDEXES
CREATE INDEX idx_expenses_property_id ON public.property_expenses(property_id);
CREATE INDEX idx_expenses_type ON public.property_expenses(expense_type);
CREATE INDEX idx_expenses_date ON public.property_expenses(expense_date DESC);
CREATE INDEX idx_expenses_created_by ON public.property_expenses(created_by);
