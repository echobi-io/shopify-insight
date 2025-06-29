import { supabase } from '@/lib/supabaseClient'

const MERCHANT_ID = '11111111-1111-1111-1111-111111111111'

interface CustomerFeatures {
  customer_id: string
  total_spent: number
  orders_count: number
  avg_order_value: number
  days_since_last_order: number
  recency_score: number
  frequency_score: number
  monetary_score: number
}

interface ClusterResult {
  customer_id: string
  cluster_label: string
  features: CustomerFeatures
  confidence: number
}

/**
 * Simple K-means clustering implementation for customer segmentation
 * This is a basic implementation - in production you'd use a more sophisticated ML library
 */
export class CustomerClustering {
  private features: CustomerFeatures[] = []
  private clusters: ClusterResult[] = []
  private k: number = 5 // Number of clusters

  async loadCustomerFeatures(): Promise<void> {
    try {
      // Get customer data with calculated features
      const { data: customers, error } = await supabase
        .from('customers')
        .select(`
          id,
          total_spent,
          orders_count,
          last_order_date,
          created_at
        `)
        .eq('merchant_id', MERCHANT_ID)
        .not('total_spent', 'is', null)
        .not('orders_count', 'is', null)

      if (error) throw error

      if (!customers || customers.length === 0) {
        console.log('No customer data available for clustering')
        return
      }

      // Calculate features for each customer
      this.features = customers.map(customer => {
        const totalSpent = customer.total_spent || 0
        const ordersCount = customer.orders_count || 0
        const avgOrderValue = ordersCount > 0 ? totalSpent / ordersCount : 0
        
        // Calculate days since last order
        const lastOrderDate = customer.last_order_date ? new Date(customer.last_order_date) : new Date(customer.created_at)
        const daysSinceLastOrder = Math.floor((Date.now() - lastOrderDate.getTime()) / (1000 * 60 * 60 * 24))
        
        // Calculate RFM scores (Recency, Frequency, Monetary)
        const recencyScore = this.calculateRecencyScore(daysSinceLastOrder)
        const frequencyScore = this.calculateFrequencyScore(ordersCount)
        const monetaryScore = this.calculateMonetaryScore(totalSpent)

        return {
          customer_id: customer.id,
          total_spent: totalSpent,
          orders_count: ordersCount,
          avg_order_value: avgOrderValue,
          days_since_last_order: daysSinceLastOrder,
          recency_score: recencyScore,
          frequency_score: frequencyScore,
          monetary_score: monetaryScore
        }
      })

      console.log(`Loaded ${this.features.length} customer features for clustering`)
    } catch (error) {
      console.error('Error loading customer features:', error)
      throw error
    }
  }

  private calculateRecencyScore(daysSinceLastOrder: number): number {
    // Score from 1-5, where 5 is most recent
    if (daysSinceLastOrder <= 30) return 5
    if (daysSinceLastOrder <= 60) return 4
    if (daysSinceLastOrder <= 90) return 3
    if (daysSinceLastOrder <= 180) return 2
    return 1
  }

  private calculateFrequencyScore(ordersCount: number): number {
    // Score from 1-5, where 5 is most frequent
    if (ordersCount >= 10) return 5
    if (ordersCount >= 5) return 4
    if (ordersCount >= 3) return 3
    if (ordersCount >= 2) return 2
    return 1
  }

  private calculateMonetaryScore(totalSpent: number): number {
    // Score from 1-5, where 5 is highest spending
    if (totalSpent >= 1000) return 5
    if (totalSpent >= 500) return 4
    if (totalSpent >= 200) return 3
    if (totalSpent >= 50) return 2
    return 1
  }

  /**
   * Simple clustering based on RFM scores
   * This creates meaningful business segments rather than pure mathematical clusters
   */
  performRFMClustering(): ClusterResult[] {
    if (this.features.length === 0) {
      console.log('No features available for clustering')
      return []
    }

    this.clusters = this.features.map(feature => {
      const { recency_score, frequency_score, monetary_score } = feature
      
      // Define clusters based on RFM combinations
      let cluster_label: string
      let confidence: number = 0.8

      if (recency_score >= 4 && frequency_score >= 4 && monetary_score >= 4) {
        cluster_label = 'Champions' // Best customers
        confidence = 0.95
      } else if (recency_score >= 3 && frequency_score >= 3 && monetary_score >= 4) {
        cluster_label = 'Loyal Customers' // High value, regular buyers
        confidence = 0.9
      } else if (recency_score >= 4 && frequency_score <= 2 && monetary_score >= 3) {
        cluster_label = 'Big Spenders' // High value but infrequent
        confidence = 0.85
      } else if (recency_score >= 4 && frequency_score >= 3 && monetary_score <= 2) {
        cluster_label = 'Potential Loyalists' // Recent and frequent but low spend
        confidence = 0.8
      } else if (recency_score <= 2 && frequency_score >= 3 && monetary_score >= 3) {
        cluster_label = 'At Risk' // Were good customers but haven't bought recently
        confidence = 0.9
      } else if (recency_score <= 2 && frequency_score <= 2 && monetary_score >= 3) {
        cluster_label = 'Cannot Lose Them' // High value but inactive
        confidence = 0.95
      } else if (recency_score >= 3 && frequency_score <= 2 && monetary_score <= 2) {
        cluster_label = 'New Customers' // Recent but low engagement
        confidence = 0.75
      } else {
        cluster_label = 'Others' // Everyone else
        confidence = 0.7
      }

      return {
        customer_id: feature.customer_id,
        cluster_label,
        features: feature,
        confidence
      }
    })

    console.log(`Generated ${this.clusters.length} customer clusters`)
    return this.clusters
  }

  async saveClustersToDatabase(): Promise<void> {
    if (this.clusters.length === 0) {
      console.log('No clusters to save')
      return
    }

    try {
      // Clear existing clusters for this merchant
      const { error: deleteError } = await supabase
        .from('customer_clusters')
        .delete()
        .eq('merchant_id', MERCHANT_ID)

      if (deleteError) {
        console.error('Error clearing existing clusters:', deleteError)
      }

      // Insert new clusters
      const clustersToInsert = this.clusters.map(cluster => ({
        customer_id: cluster.customer_id,
        merchant_id: MERCHANT_ID,
        cluster_label: cluster.cluster_label,
        cluster_features: cluster.features,
        confidence: cluster.confidence
      }))

      const { error: insertError } = await supabase
        .from('customer_clusters')
        .insert(clustersToInsert)

      if (insertError) {
        console.error('Error inserting clusters:', insertError)
        throw insertError
      }

      console.log(`Successfully saved ${this.clusters.length} clusters to database`)
    } catch (error) {
      console.error('Error saving clusters to database:', error)
      throw error
    }
  }

  /**
   * Main method to run the complete clustering process
   */
  async runClustering(): Promise<ClusterResult[]> {
    try {
      console.log('Starting customer clustering process...')
      
      await this.loadCustomerFeatures()
      const clusters = this.performRFMClustering()
      await this.saveClustersToDatabase()
      
      console.log('Customer clustering completed successfully')
      return clusters
    } catch (error) {
      console.error('Error in customer clustering process:', error)
      throw error
    }
  }

  /**
   * Get cluster summary statistics
   */
  getClusterSummary(): { [key: string]: any } {
    if (this.clusters.length === 0) return {}

    const summary: { [key: string]: any } = {}
    
    // Group by cluster label
    const groupedClusters = this.clusters.reduce((acc, cluster) => {
      if (!acc[cluster.cluster_label]) {
        acc[cluster.cluster_label] = []
      }
      acc[cluster.cluster_label].push(cluster)
      return acc
    }, {} as { [key: string]: ClusterResult[] })

    // Calculate summary stats for each cluster
    Object.entries(groupedClusters).forEach(([label, clusters]) => {
      const features = clusters.map(c => c.features)
      
      summary[label] = {
        count: clusters.length,
        avg_total_spent: features.reduce((sum, f) => sum + f.total_spent, 0) / features.length,
        avg_orders_count: features.reduce((sum, f) => sum + f.orders_count, 0) / features.length,
        avg_order_value: features.reduce((sum, f) => sum + f.avg_order_value, 0) / features.length,
        avg_recency_score: features.reduce((sum, f) => sum + f.recency_score, 0) / features.length,
        avg_frequency_score: features.reduce((sum, f) => sum + f.frequency_score, 0) / features.length,
        avg_monetary_score: features.reduce((sum, f) => sum + f.monetary_score, 0) / features.length,
        avg_confidence: clusters.reduce((sum, c) => sum + c.confidence, 0) / clusters.length
      }
    })

    return summary
  }
}

/**
 * Utility function to run customer clustering
 */
export async function runCustomerClustering(): Promise<ClusterResult[]> {
  const clustering = new CustomerClustering()
  return await clustering.runClustering()
}

/**
 * Utility function to get cluster summary
 */
export async function getCustomerClusterSummary(): Promise<{ [key: string]: any }> {
  const clustering = new CustomerClustering()
  await clustering.loadCustomerFeatures()
  clustering.performRFMClustering()
  return clustering.getClusterSummary()
}