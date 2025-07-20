import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export class SimpleSyncService {
  static async initializeShopData(shop: string): Promise<void> {
    try {
      console.log(`Initializing shop data for: ${shop}`);
      
      // Get shop ID
      const { data: shopData, error: shopError } = await supabase
        .from('shops')
        .select('id')
        .eq('shop_domain', shop)
        .single();

      if (shopError || !shopData) {
        console.error('Shop not found:', shopError);
        return;
      }

      const shopId = shopData.id;

      // Create default settings for the shop
      const { error: settingsError } = await supabase
        .from('settings')
        .upsert({
          shop_id: shopId,
          merchant_id: shop.replace('.myshopify.com', ''),
          data_period: 30,
          churn_days: 90,
          currency: 'USD',
          timezone: 'UTC',
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'shop_id'
        });

      if (settingsError) {
        console.error('Error creating settings:', settingsError);
      } else {
        console.log('Shop settings initialized successfully');
      }

      // Update shop sync status
      await supabase
        .from('shops')
        .update({ 
          last_sync_at: new Date().toISOString(),
          sync_status: 'initialized'
        })
        .eq('id', shopId);

      console.log(`Shop initialization complete for: ${shop}`);
    } catch (error) {
      console.error('Error initializing shop data:', error);
    }
  }

  static async getShopSettings(shop: string): Promise<any> {
    try {
      const { data: shopData, error: shopError } = await supabase
        .from('shops')
        .select('id')
        .eq('shop_domain', shop)
        .single();

      if (shopError || !shopData) {
        return null;
      }

      const { data: settings, error: settingsError } = await supabase
        .from('settings')
        .select('*')
        .eq('shop_id', shopData.id)
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
}