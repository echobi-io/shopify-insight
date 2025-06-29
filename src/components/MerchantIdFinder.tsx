import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { supabase } from '@/lib/supabaseClient'
import { AlertCircle, CheckCircle, Database, RefreshCw, Copy } from 'lucide-react'

interface MerchantInfo {
  merchant_id: string
  orders_count: number
  customers_count: number
  products_count: number
  total_revenue: number
  date_range: {
    earliest: string
    latest: string
  }
}

export default function MerchantIdFinder() {
  const [merchants, setMerchants] = useState<MerchantInfo[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedMerchant, setSelectedMerchant] = useState<string>('')

  const findMerchantIds = async () => {
    setLoading(true)
    try {
      console.log('🔍 Finding merchant IDs in database...')

      // Get unique merchant IDs from orders table
      const { data: merchantIds, error: merchantError } = await supabase
        .from('orders')
        .select('merchant_id')
        .not('merchant_id', 'is', null)

      if (merchantError) {
        console.error('❌ Error fetching merchant IDs:', merchantError)
        return
      }

      // Get unique merchant IDs
      const uniqueMerchantIds = [...new Set(merchantIds?.map(m => m.merchant_id) || [])]
      console.log('📊 Found merchant IDs:', uniqueMerchantIds)

      // Get detailed info for each merchant
      const merchantInfoPromises = uniqueMerchantIds.map(async (merchantId) => {
        try {
          // Get orders info
          const { data: orders, error: ordersError } = await supabase
            .from('orders')
            .select('total_price, created_at')
            .eq('merchant_id', merchantId)

          // Get customers count
          const { count: customersCount } = await supabase
            .from('customers')
            .select('*', { count: 'exact', head: true })
            .eq('merchant_id', merchantId)

          // Get products count
          const { count: productsCount } = await supabase
            .from('products')
            .select('*', { count: 'exact', head: true })
            .eq('merchant_id', merchantId)

          if (ordersError) {
            console.error(`❌ Error fetching data for merchant ${merchantId}:`, ordersError)
            return null
          }

          const totalRevenue = orders?.reduce((sum, order) => sum + (parseFloat(order.total_price) || 0), 0) || 0
          const dates = orders?.map(o => o.created_at).filter(Boolean).sort() || []

          return {
            merchant_id: merchantId,
            orders_count: orders?.length || 0,
            customers_count: customersCount || 0,
            products_count: productsCount || 0,
            total_revenue: totalRevenue,
            date_range: {
              earliest: dates[0] || 'N/A',
              latest: dates[dates.length - 1] || 'N/A'
            }
          }
        } catch (error) {
          console.error(`❌ Error processing merchant ${merchantId}:`, error)
          return null
        }
      })

      const merchantInfos = (await Promise.all(merchantInfoPromises)).filter(Boolean) as MerchantInfo[]
      setMerchants(merchantInfos)

      // Auto-select the merchant with the most data
      if (merchantInfos.length > 0) {
        const bestMerchant = merchantInfos.reduce((best, current) => 
          current.orders_count > best.orders_count ? current : best
        )
        setSelectedMerchant(bestMerchant.merchant_id)
      }

    } catch (error) {
      console.error('❌ Error finding merchant IDs:', error)
    } finally {
      setLoading(false)
    }
  }

  const copyMerchantId = (merchantId: string) => {
    navigator.clipboard.writeText(merchantId)
    alert(`Copied merchant ID: ${merchantId}`)
  }

  const updateAppMerchantId = async (merchantId: string) => {
    alert(`To use merchant ID ${merchantId}, I need to update the dashboard.tsx file. Please confirm this is the correct merchant ID to use.`)
  }

  useEffect(() => {
    findMerchantIds()
  }, [])

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Database className="h-5 w-5 mr-2" />
            Merchant ID Finder
          </CardTitle>
          <div className="flex flex-wrap gap-2">
            <Button onClick={findMerchantIds} disabled={loading} size="sm">
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Scan Database
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-8">
                <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2" />
                <p>Scanning database for merchant IDs...</p>
              </div>
            ) : merchants.length === 0 ? (
              <div className="text-center py-8">
                <AlertCircle className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
                <p>No merchant IDs found in the database</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="text-sm text-gray-600 mb-4">
                  Found {merchants.length} merchant(s) in your database. The app is currently hardcoded to use: 
                  <code className="bg-gray-100 px-2 py-1 rounded ml-1">11111111-1111-1111-1111-111111111111</code>
                </div>

                {merchants.map((merchant) => (
                  <div key={merchant.merchant_id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <code className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                          {merchant.merchant_id}
                        </code>
                        {selectedMerchant === merchant.merchant_id && (
                          <Badge variant="default">Recommended</Badge>
                        )}
                      </div>
                      <div className="flex space-x-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => copyMerchantId(merchant.merchant_id)}
                        >
                          <Copy className="h-3 w-3 mr-1" />
                          Copy
                        </Button>
                        <Button 
                          size="sm" 
                          onClick={() => updateAppMerchantId(merchant.merchant_id)}
                        >
                          Use This ID
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Orders:</span>
                        <div className="font-semibold">{merchant.orders_count.toLocaleString()}</div>
                      </div>
                      <div>
                        <span className="text-gray-500">Customers:</span>
                        <div className="font-semibold">{merchant.customers_count.toLocaleString()}</div>
                      </div>
                      <div>
                        <span className="text-gray-500">Products:</span>
                        <div className="font-semibold">{merchant.products_count.toLocaleString()}</div>
                      </div>
                      <div>
                        <span className="text-gray-500">Revenue:</span>
                        <div className="font-semibold">
                          ${merchant.total_revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                      </div>
                    </div>

                    <div className="text-xs text-gray-500">
                      <span>Date Range: </span>
                      <span>{merchant.date_range.earliest.split('T')[0]} to {merchant.date_range.latest.split('T')[0]}</span>
                    </div>
                  </div>
                ))}

                {selectedMerchant && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-semibold text-blue-900 mb-2">Next Steps:</h4>
                    <ol className="list-decimal list-inside text-sm text-blue-800 space-y-1">
                      <li>Copy the recommended merchant ID above</li>
                      <li>I'll update the dashboard to use your real merchant ID</li>
                      <li>Refresh the materialized views with your data</li>
                      <li>Your dashboard will show real data!</li>
                    </ol>
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}