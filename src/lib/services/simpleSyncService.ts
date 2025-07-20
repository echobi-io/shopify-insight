import { supabase } from '../supabaseClient';

export class SimpleSyncService {
  static async initializeShopData(shop: string): Promise<void> {
    try {
      console.log(`Initializing shop data for: ${shop}`);
      
      // Generate a proper merchant ID (UUID format)
      const merchantId = crypto.randomUUID();
      
      // First, ensure the shop exists in the shops table with merchant_id
      const { data: shopData, error: shopError } = await supabase
        .from('shops')
        .upsert({
          shop_domain: shop,
          merchant_id: merchantId,
          last_sync_at: new Date().toISOString(),
          sync_status: 'initialized'
        }, {
          onConflict: 'shop_domain',
          ignoreDuplicates: false
        })
        .select('id, merchant_id')
        .single();

      if (shopError) {
        console.error('Error creating/updating shop:', shopError);
        return;
      }

      const finalMerchantId = shopData.merchant_id;
      console.log(`Using merchant ID: ${finalMerchantId} for shop: ${shop}`);

      // Create default settings for the shop using merchant_id
      const { error: settingsError } = await supabase
        .from('settings')
        .upsert({
          merchant_id: finalMerchantId,
          financial_year_start: '01-01',
          financial_year_end: '12-31',
          default_date_range: 'financial_current',
          timezone: 'UTC',
          currency: 'USD',
          churn_period_days: 180,
          cost_of_acquisition: 50,
          gross_profit_margin: 30,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'merchant_id'
        });

      if (settingsError) {
        console.error('Error creating settings:', settingsError);
      } else {
        console.log('Shop settings initialized successfully');
      }

      console.log(`Shop initialization complete for: ${shop} with merchant ID: ${finalMerchantId}`);
    } catch (error) {
      console.error('Error initializing shop data:', error);
    }
  }

  static async getShopSettings(shop: string): Promise<any> {
    try {
      const { data: shopData, error: shopError } = await supabase
        .from('shops')
        .select('merchant_id')
        .eq('shop_domain', shop)
        .single();

      if (shopError || !shopData) {
        return null;
      }

      const { data: settings, error: settingsError } = await supabase
        .from('settings')
        .select('*')
        .eq('merchant_id', shopData.merchant_id)
        .single();

      if (settingsError) {
        console.error('Error getting settings:', settingsError);
        return null;
      }

      return settings;
    } catch (error) {
      console.error('Error getting shop settings:', error);
      return null;
    }
  }

  static async getMerchantIdFromShop(shop: string): Promise<string | null> {
    try {
      const { data: shopData, error: shopError } = await supabase
        .from('shops')
        .select('merchant_id')
        .eq('shop_domain', shop)
        .single();

      if (shopError || !shopData) {
        console.error('Error getting merchant ID for shop:', shop, shopError);
        return null;
      }

      return shopData.merchant_id;
    } catch (error) {
      console.error('Error getting merchant ID from shop:', error);
      return null;
    }
  }
}