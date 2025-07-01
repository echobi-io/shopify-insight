# Database Setup Instructions for EchoIQ Product Insights

This document explains how to set up the required database functions for the Product Insights feature to work with real data.

## Required Database Functions

The Product Insights page requires two PostgreSQL functions to be created in your Supabase database:

1. `get_product_performance` - Fetches product metrics and performance data
2. `get_product_trend` - Fetches daily trend data for top products

## Setup Instructions

### Step 1: Access Supabase SQL Editor

1. Go to your Supabase project dashboard
2. Navigate to the "SQL Editor" section
3. Create a new query

### Step 2: Execute the Product Functions SQL

Copy and paste the entire contents of `src/lib/database/product_functions.sql` into the SQL editor and execute it.

This will create:
- `get_product_performance(merchant_id, start_date, end_date)` function
- `get_product_trend(merchant_id, product_ids[], start_date, end_date)` function
- Proper permissions for authenticated users

### Step 3: Verify Function Creation

You can verify the functions were created successfully by running:

```sql
-- Check if functions exist
SELECT routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_name IN ('get_product_performance', 'get_product_trend');
```

### Step 4: Test the Functions (Optional)

You can test the functions with sample data:

```sql
-- Test get_product_performance
SELECT * FROM get_product_performance(
  '11111111-1111-1111-1111-111111111111'::UUID,
  '2024-01-01'::TIMESTAMP,
  '2024-12-31'::TIMESTAMP
);

-- Test get_product_trend
SELECT * FROM get_product_trend(
  '11111111-1111-1111-1111-111111111111'::UUID,
  ARRAY['product-id-1', 'product-id-2']::UUID[],
  '2024-01-01'::TIMESTAMP,
  '2024-12-31'::TIMESTAMP
);
```

## Database Schema Requirements

For these functions to work, your database must have the following tables with the expected structure:

### Product Table
```sql
"Product" (
  id UUID PRIMARY KEY,
  merchant_id UUID,
  title TEXT,
  handle TEXT,
  product_type TEXT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)
```

### Order Table
```sql
"Order" (
  id UUID PRIMARY KEY,
  merchant_id UUID,
  customer_id UUID,
  financial_status TEXT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)
```

### LineItem Table
```sql
"LineItem" (
  id UUID PRIMARY KEY,
  order_id UUID,
  product_id UUID,
  quantity INTEGER,
  price NUMERIC,
  created_at TIMESTAMP
)
```

## Performance Optimization

The SQL file includes optional index creation commands (commented out). Uncomment and run these for better performance:

```sql
CREATE INDEX IF NOT EXISTS idx_order_merchant_created ON "Order"(merchant_id, created_at);
CREATE INDEX IF NOT EXISTS idx_order_financial_status ON "Order"(financial_status);
CREATE INDEX IF NOT EXISTS idx_lineitem_product ON "LineItem"(product_id);
CREATE INDEX IF NOT EXISTS idx_lineitem_order ON "LineItem"(order_id);
CREATE INDEX IF NOT EXISTS idx_product_merchant ON "Product"(merchant_id);
```

## Function Details

### get_product_performance

**Parameters:**
- `merchant_id` (UUID): The merchant's unique identifier
- `start_date` (TIMESTAMP): Start of the date range
- `end_date` (TIMESTAMP): End of the date range

**Returns:**
- `id`: Product ID
- `name`: Product title
- `sku`: Product handle or ID
- `category`: Product type
- `total_revenue`: Total revenue for the period
- `units_sold`: Total units sold
- `avg_price`: Average price per unit
- `profit_margin`: Calculated profit margin (currently fixed at 30%)
- `performance_score`: Performance score (0-100 scale)

### get_product_trend

**Parameters:**
- `merchant_id` (UUID): The merchant's unique identifier
- `product_ids` (UUID[]): Array of product IDs to analyze
- `start_date` (TIMESTAMP): Start of the date range
- `end_date` (TIMESTAMP): End of the date range

**Returns:**
- `date`: Date of the data point
- `revenue`: Total revenue for that date
- `units`: Total units sold for that date

## Troubleshooting

### Common Issues:

1. **Permission Denied**: Make sure you're running the SQL as a database owner or with sufficient privileges
2. **Table Not Found**: Ensure your database has the required tables with the correct names and structure
3. **Function Not Found**: Verify the functions were created successfully using the verification query above

### Error Handling:

The application includes proper error handling, so if the functions don't exist or return errors, the Product Insights page will:
- Show empty states instead of crashing
- Log errors to the console for debugging
- Display user-friendly messages

## Next Steps

After setting up these functions:

1. Deploy your application
2. Navigate to the Product Insights page
3. Select a date range that contains order data
4. Verify that real product data is displayed instead of empty states

The functions will automatically calculate metrics like growth rates, category performance, and trend data based on your actual Shopify order and product data.