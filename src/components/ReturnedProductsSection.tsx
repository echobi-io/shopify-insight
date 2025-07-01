import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { ChevronDown, ChevronRight, RotateCcw, AlertTriangle, Package, TrendingDown } from 'lucide-react'
import { formatCurrency } from '@/lib/utils/settingsUtils'
import { ReturnedProduct, ReturnReason } from '@/lib/fetchers/getReturnedProductsData'

interface ReturnedProductsSectionProps {
  products: ReturnedProduct[]
  totalReturns: number
  totalReturnValue: number
  avgReturnRate: number
}

interface ReturnReasonRowProps {
  reason: ReturnReason
  isLast: boolean
}

const ReturnReasonRow: React.FC<ReturnReasonRowProps> = ({ reason, isLast }) => (
  <div className={`flex items-center justify-between py-2 px-4 ${!isLast ? 'border-b border-gray-100' : ''}`}>
    <div className="flex items-center space-x-3">
      <div className="w-2 h-2 bg-red-400 rounded-full"></div>
      <span className="text-sm font-light text-gray-700">{reason.reason}</span>
    </div>
    <div className="flex items-center space-x-4 text-sm">
      <span className="font-light text-gray-600">{reason.count} units</span>
      <span className="font-light text-gray-600">{formatCurrency(reason.totalValue)}</span>
      <Badge variant="outline" className="font-light text-xs">
        {reason.percentage.toFixed(1)}%
      </Badge>
    </div>
  </div>
)

interface ProductRowProps {
  product: ReturnedProduct
  isExpanded: boolean
  onToggleExpand: () => void
}

const ProductRow: React.FC<ProductRowProps> = ({ product, isExpanded, onToggleExpand }) => (
  <>
    <TableRow className="hover:bg-gray-50">
      <TableCell>
        <Collapsible open={isExpanded} onOpenChange={onToggleExpand}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="p-0 h-auto font-normal">
              <div className="flex items-center space-x-2">
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4 text-gray-400" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-gray-400" />
                )}
                <div className="text-left">
                  <div className="font-medium text-black">{product.name}</div>
                  <div className="text-sm font-light text-gray-500">SKU: {product.sku}</div>
                </div>
              </div>
            </Button>
          </CollapsibleTrigger>
        </Collapsible>
      </TableCell>
      <TableCell>
        <Badge variant="outline" className="font-light">
          {product.category || 'Uncategorized'}
        </Badge>
      </TableCell>
      <TableCell className="text-right font-light">
        <div className="flex items-center justify-end space-x-1">
          <RotateCcw className="h-4 w-4 text-red-500" />
          <span>{product.totalReturns}</span>
        </div>
      </TableCell>
      <TableCell className="text-right font-light">
        <span className="text-red-600">{formatCurrency(product.totalReturnValue)}</span>
      </TableCell>
      <TableCell className="text-right font-light">
        <span className={`${
          product.returnRate > 10 ? 'text-red-600' :
          product.returnRate > 5 ? 'text-yellow-600' :
          'text-green-600'
        }`}>
          {product.returnRate.toFixed(1)}%
        </span>
      </TableCell>
      <TableCell className="text-right font-light">
        {formatCurrency(product.avgReturnValue)}
      </TableCell>
      <TableCell className="text-center">
        <Badge 
          variant={product.returnReasons.length > 0 ? "destructive" : "secondary"}
          className="font-light"
        >
          {product.returnReasons.length} reasons
        </Badge>
      </TableCell>
    </TableRow>
    <TableRow>
      <TableCell colSpan={7} className="p-0">
        <Collapsible open={isExpanded}>
          <CollapsibleContent>
            <div className="bg-gray-50 border-t border-gray-200">
              <div className="p-4">
                <div className="flex items-center space-x-2 mb-3">
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                  <span className="text-sm font-medium text-gray-700">Return Reasons Breakdown</span>
                </div>
                {product.returnReasons.length > 0 ? (
                  <div className="bg-white rounded-lg border border-gray-200">
                    {product.returnReasons.map((reason, index) => (
                      <ReturnReasonRow 
                        key={reason.reason}
                        reason={reason}
                        isLast={index === product.returnReasons.length - 1}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <Package className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm font-light text-gray-500">No specific return reasons recorded</p>
                  </div>
                )}
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </TableCell>
    </TableRow>
  </>
)

const ReturnedProductsSection: React.FC<ReturnedProductsSectionProps> = ({
  products,
  totalReturns,
  totalReturnValue,
  avgReturnRate
}) => {
  const [showAll, setShowAll] = useState(false)
  const [expandedProducts, setExpandedProducts] = useState<Set<string>>(new Set())

  const displayedProducts = showAll ? products : products.slice(0, 5)

  const toggleProductExpansion = (productId: string) => {
    const newExpanded = new Set(expandedProducts)
    if (newExpanded.has(productId)) {
      newExpanded.delete(productId)
    } else {
      newExpanded.add(productId)
    }
    setExpandedProducts(newExpanded)
  }

  if (products.length === 0) {
    return (
      <Card className="card-minimal">
        <CardHeader>
          <CardTitle className="text-lg font-medium text-black flex items-center">
            <RotateCcw className="h-5 w-5 mr-2 text-green-600" />
            Top Returned Products
          </CardTitle>
          <CardDescription className="font-light text-gray-600">
            Products with the highest return rates and volumes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Package className="h-12 w-12 text-green-400 mx-auto mb-4" />
            <p className="text-gray-600 font-light mb-2">No returns found for this period</p>
            <p className="text-sm text-gray-500 font-light">This is great news for your business!</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="card-minimal">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg font-medium text-black flex items-center">
              <RotateCcw className="h-5 w-5 mr-2 text-red-500" />
              Top Returned Products
            </CardTitle>
            <CardDescription className="font-light text-gray-600">
              Products with the highest return rates and volumes
            </CardDescription>
          </div>
          
          {/* Summary Stats */}
          <div className="flex space-x-6 text-sm">
            <div className="text-center">
              <div className="font-medium text-red-600">{totalReturns}</div>
              <div className="font-light text-gray-500">Total Returns</div>
            </div>
            <div className="text-center">
              <div className="font-medium text-red-600">{formatCurrency(totalReturnValue)}</div>
              <div className="font-light text-gray-500">Return Value</div>
            </div>
            <div className="text-center">
              <div className="font-medium text-red-600">{avgReturnRate.toFixed(1)}%</div>
              <div className="font-light text-gray-500">Avg Return Rate</div>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Returns</TableHead>
                <TableHead className="text-right">Return Value</TableHead>
                <TableHead className="text-right">Return Rate</TableHead>
                <TableHead className="text-right">Avg Return Value</TableHead>
                <TableHead className="text-center">Reasons</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayedProducts.map((product) => (
                <ProductRow
                  key={product.id}
                  product={product}
                  isExpanded={expandedProducts.has(product.id)}
                  onToggleExpand={() => toggleProductExpansion(product.id)}
                />
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Show More/Less Button */}
        {products.length > 5 && (
          <div className="flex justify-center mt-6">
            <Button
              variant="outline"
              onClick={() => setShowAll(!showAll)}
              className="font-light"
            >
              {showAll ? (
                <>
                  <ChevronDown className="h-4 w-4 mr-2 rotate-180" />
                  Show Less
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4 mr-2" />
                  Show {products.length - 5} More
                </>
              )}
            </Button>
          </div>
        )}

        {/* Legend */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center space-x-6 text-sm">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="font-light text-gray-600">Low Return Rate (&lt;5%)</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <span className="font-light text-gray-600">Medium Return Rate (5-10%)</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span className="font-light text-gray-600">High Return Rate (&gt;10%)</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default ReturnedProductsSection