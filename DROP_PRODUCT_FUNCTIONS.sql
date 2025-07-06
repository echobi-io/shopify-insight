-- Drop the problematic product performance functions
-- This will prevent any 500 errors from the RPC calls

DROP FUNCTION IF EXISTS get_product_performance(UUID, TIMESTAMP, TIMESTAMP);
DROP FUNCTION IF EXISTS get_product_trend(UUID, UUID[], TIMESTAMP, TIMESTAMP);

-- Note: The application now uses direct table queries instead of these RPC functions
-- This provides better performance and avoids timeout issues