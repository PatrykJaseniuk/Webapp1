-- ================================================
-- RENTAL MANAGEMENT SYSTEM - SEED DATA
-- ================================================
-- Initial reference data for the rental management system
-- Only includes utility prices as baseline data

-- ================================================
-- UTILITY PRICES - HISTORICAL RATES
-- ================================================
-- Seed with historical utility prices for billing calculations
-- Prices are in PLN (Polish Zloty) per unit

INSERT INTO public.utility_prices (utility_type, price_per_unit, effective_date) VALUES
    -- 2024 Rates
    ('electricity', 0.65, '2024-01-01'),
    ('water', 5.50, '2024-01-01'),
    ('gas', 0.45, '2024-01-01'),
    ('heating', 0.35, '2024-01-01'),
    
    -- 2025 Rates (adjusted for inflation)
    ('electricity', 0.70, '2025-01-01'),
    ('water', 6.00, '2025-01-01'),
    ('gas', 0.50, '2025-01-01'),
    ('heating', 0.38, '2025-01-01'),
    
    -- 2026 Rates (current)
    ('electricity', 0.75, '2026-01-01'),
    ('water', 6.50, '2026-01-01'),
    ('gas', 0.55, '2026-01-01'),
    ('heating', 0.42, '2026-01-01');

-- ================================================
-- NOTES
-- ================================================
-- Properties, tenants, and leases should be added through the UI
-- This ensures proper authentication context and created_by tracking
-- The landlord/admin will populate the system with actual data
