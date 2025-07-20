-- Create subscription table for tracking Stripe subscriptions
CREATE TABLE IF NOT EXISTS subscription (
    id SERIAL PRIMARY KEY,
    shop_domain VARCHAR(255) UNIQUE NOT NULL,
    stripe_customer_id VARCHAR(255),
    stripe_subscription_id VARCHAR(255),
    status VARCHAR(50) DEFAULT 'inactive',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_subscription_shop_domain ON subscription(shop_domain);
CREATE INDEX IF NOT EXISTS idx_subscription_stripe_subscription_id ON subscription(stripe_subscription_id);