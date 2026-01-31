-- ================================================
-- RENTAL MANAGEMENT SYSTEM - FUNCTIONS & TRIGGERS
-- ================================================
-- Automated functions and triggers for business logic
-- Handles timestamp updates, auto-population, and status management

-- ================================================
-- UTILITY FUNCTIONS
-- ================================================

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to automatically set created_by to current user
CREATE OR REPLACE FUNCTION public.set_created_by()
RETURNS TRIGGER AS $$
BEGIN
    NEW.created_by = auth.uid();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ================================================
-- BUSINESS LOGIC FUNCTIONS
-- ================================================

-- Function to automatically update property status based on lease changes
CREATE OR REPLACE FUNCTION public.auto_update_property_status()
RETURNS TRIGGER AS $$
BEGIN
    -- When a new lease becomes active, mark property as occupied
    IF (TG_OP = 'INSERT' OR TG_OP = 'UPDATE') AND NEW.status = 'active' THEN
        UPDATE public.properties 
        SET status = 'occupied' 
        WHERE id = NEW.property_id 
        AND status != 'inactive';  -- Don't override inactive status
    END IF;
    
    -- When a lease ends (terminated or expired), check if property should be available
    IF (TG_OP = 'UPDATE' OR TG_OP = 'DELETE') THEN
        -- Use OLD for DELETE, NEW for UPDATE
        DECLARE
            lease_property_id uuid;
            active_lease_count integer;
        BEGIN
            IF TG_OP = 'DELETE' THEN
                lease_property_id := OLD.property_id;
            ELSE
                lease_property_id := NEW.property_id;
            END IF;
            
            -- Check if there are any other active leases for this property
            SELECT COUNT(*) INTO active_lease_count
            FROM public.lease_agreements
            WHERE property_id = lease_property_id 
            AND status = 'active'
            AND id != COALESCE(NEW.id, OLD.id);
            
            -- If no active leases remain, mark property as available
            IF active_lease_count = 0 THEN
                UPDATE public.properties 
                SET status = 'available' 
                WHERE id = lease_property_id 
                AND status = 'occupied';  -- Only change if currently occupied
            END IF;
        END;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Function to automatically assign 'tenant' role to new user registrations
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'tenant');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ================================================
-- APPLY TRIGGERS TO TABLES
-- ================================================

-- USER ROLES TRIGGERS
CREATE TRIGGER update_user_roles_updated_at 
    BEFORE UPDATE ON public.user_roles
    FOR EACH ROW 
    EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-assign tenant role on new user registration
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW 
    EXECUTE FUNCTION public.handle_new_user();

-- PROPERTIES TRIGGERS
CREATE TRIGGER update_properties_updated_at 
    BEFORE UPDATE ON public.properties
    FOR EACH ROW 
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER set_properties_created_by 
    BEFORE INSERT ON public.properties
    FOR EACH ROW 
    WHEN (NEW.created_by IS NULL)
    EXECUTE FUNCTION public.set_created_by();

-- TENANTS TRIGGERS
CREATE TRIGGER update_tenants_updated_at 
    BEFORE UPDATE ON public.tenants
    FOR EACH ROW 
    EXECUTE FUNCTION public.update_updated_at_column();

-- LEASE AGREEMENTS TRIGGERS
CREATE TRIGGER update_leases_updated_at 
    BEFORE UPDATE ON public.lease_agreements
    FOR EACH ROW 
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER set_leases_created_by 
    BEFORE INSERT ON public.lease_agreements
    FOR EACH ROW 
    WHEN (NEW.created_by IS NULL)
    EXECUTE FUNCTION public.set_created_by();

-- Auto-update property status when lease status changes
CREATE TRIGGER auto_property_status_on_lease_change
    AFTER INSERT OR UPDATE OR DELETE ON public.lease_agreements
    FOR EACH ROW 
    EXECUTE FUNCTION public.auto_update_property_status();

-- BILLING ITEMS TRIGGERS
CREATE TRIGGER update_billing_items_updated_at 
    BEFORE UPDATE ON public.billing_items
    FOR EACH ROW 
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER set_billing_items_created_by 
    BEFORE INSERT ON public.billing_items
    FOR EACH ROW 
    WHEN (NEW.created_by IS NULL)
    EXECUTE FUNCTION public.set_created_by();

-- PAYMENTS TRIGGERS
CREATE TRIGGER update_payments_updated_at 
    BEFORE UPDATE ON public.payments
    FOR EACH ROW 
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER set_payments_created_by 
    BEFORE INSERT ON public.payments
    FOR EACH ROW 
    WHEN (NEW.created_by IS NULL)
    EXECUTE FUNCTION public.set_created_by();

-- METERS TRIGGERS
CREATE TRIGGER update_meters_updated_at 
    BEFORE UPDATE ON public.meters
    FOR EACH ROW 
    EXECUTE FUNCTION public.update_updated_at_column();

-- UTILITY PRICES TRIGGERS
CREATE TRIGGER update_utility_prices_updated_at 
    BEFORE UPDATE ON public.utility_prices
    FOR EACH ROW 
    EXECUTE FUNCTION public.update_updated_at_column();

-- PROPERTY EXPENSES TRIGGERS
CREATE TRIGGER update_expenses_updated_at 
    BEFORE UPDATE ON public.property_expenses
    FOR EACH ROW 
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER set_expenses_created_by 
    BEFORE INSERT ON public.property_expenses
    FOR EACH ROW 
    WHEN (NEW.created_by IS NULL)
    EXECUTE FUNCTION public.set_created_by();

-- ATTACHMENTS TRIGGERS
-- Note: uploaded_by should be set explicitly, but we provide fallback
CREATE TRIGGER set_attachments_uploaded_by 
    BEFORE INSERT ON public.attachments
    FOR EACH ROW 
    WHEN (NEW.uploaded_by IS NULL)
    EXECUTE FUNCTION public.set_created_by();

-- METER READINGS TRIGGERS
-- created_by should be set explicitly, but we provide fallback
CREATE TRIGGER set_meter_readings_created_by 
    BEFORE INSERT ON public.meter_readings
    FOR EACH ROW 
    WHEN (NEW.created_by IS NULL)
    EXECUTE FUNCTION public.set_created_by();
