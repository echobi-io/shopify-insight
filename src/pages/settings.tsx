import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { 
  Calendar,
  Save,
  RefreshCw,
  Settings as SettingsIcon,
  AlertTriangle,
  CheckCircle,
  Users
} from 'lucide-react'
import AppLayout from '@/components/Layout/AppLayout'
import { getSettings, saveSettings, AppSettings, DEFAULT_SETTINGS, clearSettingsCache } from '@/lib/fetchers/getSettingsData'
import { clearCurrencyCache } from '@/lib/utils/currencyUtils'
import { useShop, withShopAuth } from '@/contexts/ShopContext'

const SettingsPage: React.FC = () => {
  const { shop, session, isAuthenticated } = useShop()
  const [settings, setSettings] = useState<AppSettings>({ ...DEFAULT_SETTINGS, merchant_id: shop || '' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Load settings from database on component mount
  useEffect(() => {
    if (shop && isAuthenticated) {
      loadSettings()
    }
  }, [shop, isAuthenticated])

  const loadSettings = async () => {
    if (!shop) {
      setMessage({ type: 'error', text: 'No shop identified. Please ensure you are properly authenticated.' })
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const loadedSettings = await getSettings(shop)
      setSettings(loadedSettings)
    } catch (error) {
      console.error('Error loading settings:', error)
      setMessage({ type: 'error', text: 'Failed to load settings. Using defaults.' })
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: keyof AppSettings, value: string) => {
    setSettings(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const validateSettings = (): string | null => {
    // Validate financial year dates (MM-DD format)
    const startParts = settings.financialYearStart.split('-')
    const endParts = settings.financialYearEnd.split('-')
    
    if (startParts.length !== 2 || endParts.length !== 2) {
      return 'Please enter valid dates in MM-DD format'
    }
    
    const startMonth = parseInt(startParts[0])
    const startDay = parseInt(startParts[1])
    const endMonth = parseInt(endParts[0])
    const endDay = parseInt(endParts[1])
    
    if (startMonth < 1 || startMonth > 12 || endMonth < 1 || endMonth > 12) {
      return 'Please enter valid months (01-12)'
    }
    
    if (startDay < 1 || startDay > 31 || endDay < 1 || endDay > 31) {
      return 'Please enter valid days (01-31)'
    }
    
    // Validate churn period
    const churnPeriod = parseInt(settings.churnPeriodDays.toString())
    if (isNaN(churnPeriod) || churnPeriod < 30 || churnPeriod > 365) {
      return 'Churn period must be between 30 and 365 days'
    }
    
    return null
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      setMessage(null)
      
      // Validate settings
      const validationError = validateSettings()
      if (validationError) {
        setMessage({ type: 'error', text: validationError })
        return
      }
      
      // Save to database
      const success = await saveSettings(settings)
      
      if (success) {
        // Clear both settings and currency cache to force reload
        clearSettingsCache()
        clearCurrencyCache()
        
        // Also save to localStorage as backup
        localStorage.setItem('echobi-settings', JSON.stringify(settings))
        
        setMessage({ type: 'success', text: 'Settings saved successfully!' })
        
        // Clear success message after 3 seconds
        setTimeout(() => setMessage(null), 3000)
      } else {
        setMessage({ type: 'error', text: 'Failed to save settings. Please try again.' })
      }
      
    } catch (error) {
      console.error('Error saving settings:', error)
      setMessage({ type: 'error', text: 'Failed to save settings. Please try again.' })
    } finally {
      setSaving(false)
    }
  }

  const handleReset = () => {
    setSettings({ ...DEFAULT_SETTINGS, merchant_id: shop || '' })
    setMessage({ type: 'success', text: 'Settings reset to defaults' })
    setTimeout(() => setMessage(null), 3000)
  }

  return (
    <AppLayout loading={loading} loadingMessage="Loading settings...">
      <div className="p-8">
          {/* Page Header */}
          <div className="mb-8">
            <div className="flex items-center space-x-3 mb-2">
              <SettingsIcon className="w-8 h-8 text-black" />
              <h1 className="text-3xl font-light text-black">Settings</h1>
            </div>
            <p className="text-gray-600 font-light">Configure application preferences and financial parameters</p>
          </div>

          {/* Status Message */}
          {message && (
            <Alert className={`mb-6 ${message.type === 'success' ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
              {message.type === 'success' ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-red-600" />
              )}
              <AlertDescription className={`${message.type === 'success' ? 'text-green-800' : 'text-red-800'} font-light`}>
                {message.text}
              </AlertDescription>
            </Alert>
          )}

          <div className="max-w-4xl">
            {/* Financial Settings */}
            <Card className="card-minimal mb-8">
              <CardHeader>
                <CardTitle className="text-xl font-medium text-black flex items-center">
                  <Calendar className="w-5 h-5 mr-2" />
                  Financial Year Settings
                </CardTitle>
                <CardDescription className="font-light text-gray-600">
                  Define your financial year period for accurate reporting and analysis
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="financialYearStart" className="text-sm font-medium text-black">
                      Financial Year Start Date
                    </Label>
                    <Input
                      id="financialYearStart"
                      type="text"
                      placeholder="MM-DD"
                      value={settings.financialYearStart}
                      onChange={(e) => handleInputChange('financialYearStart', e.target.value)}
                      className="font-light"
                    />
                    <p className="text-xs text-gray-500 font-light">
                      Enter in MM-DD format (e.g., 01-01 for January 1st)
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="financialYearEnd" className="text-sm font-medium text-black">
                      Financial Year End Date
                    </Label>
                    <Input
                      id="financialYearEnd"
                      type="text"
                      placeholder="MM-DD"
                      value={settings.financialYearEnd}
                      onChange={(e) => handleInputChange('financialYearEnd', e.target.value)}
                      className="font-light"
                    />
                    <p className="text-xs text-gray-500 font-light">
                      Enter in MM-DD format (e.g., 12-31 for December 31st)
                    </p>
                  </div>
                </div>
                
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start space-x-2">
                    <Calendar className="w-4 h-4 text-blue-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-blue-900">Financial Year Period</p>
                      <p className="text-sm text-blue-700 font-light">
                        {settings.financialYearStart} to {settings.financialYearEnd} (each year)
                      </p>
                      <p className="text-xs text-blue-600 font-light mt-1">
                        This period will be used as the default date range for financial reports and year-over-year comparisons.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Customer Analytics Settings */}
            <Card className="card-minimal mb-8">
              <CardHeader>
                <CardTitle className="text-xl font-medium text-black flex items-center">
                  <Users className="w-5 h-5 mr-2" />
                  Customer Analytics Settings
                </CardTitle>
                <CardDescription className="font-light text-gray-600">
                  Configure customer behavior analysis and churn detection parameters
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="churnPeriodDays" className="text-sm font-medium text-black">
                      Churn Period (Days)
                    </Label>
                    <Input
                      id="churnPeriodDays"
                      type="number"
                      min="30"
                      max="365"
                      value={settings.churnPeriodDays}
                      onChange={(e) => handleInputChange('churnPeriodDays', e.target.value)}
                      className="font-light"
                    />
                    <p className="text-xs text-gray-500 font-light">
                      Days without purchase before churned (30-365)
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="costOfAcquisition" className="text-sm font-medium text-black">
                      Cost of Acquisition ({settings.currency})
                    </Label>
                    <Input
                      id="costOfAcquisition"
                      type="number"
                      min="0"
                      step="0.01"
                      value={settings.costOfAcquisition}
                      onChange={(e) => handleInputChange('costOfAcquisition', e.target.value)}
                      className="font-light"
                    />
                    <p className="text-xs text-gray-500 font-light">
                      Average cost to acquire a new customer
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="grossProfitMargin" className="text-sm font-medium text-black">
                      Gross Profit Margin (%)
                    </Label>
                    <Input
                      id="grossProfitMargin"
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={settings.grossProfitMargin}
                      onChange={(e) => handleInputChange('grossProfitMargin', e.target.value)}
                      className="font-light"
                    />
                    <p className="text-xs text-gray-500 font-light">
                      Average gross profit margin percentage
                    </p>
                  </div>
                </div>
                
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <div className="flex items-start space-x-2">
                    <Users className="w-4 h-4 text-orange-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-orange-900">Customer Analytics Configuration</p>
                      <p className="text-sm text-orange-700 font-light">
                        Customers with no purchases in the last {settings.churnPeriodDays} days will be marked as churned. 
                        Cost of acquisition and profit margins are used in cohort analysis to show breakeven points.
                      </p>
                      <p className="text-xs text-orange-600 font-light mt-1">
                        These settings affect customer risk calculations, retention analysis, churn predictions, and cohort breakeven analysis.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Application Settings */}
            <Card className="card-minimal mb-8">
              <CardHeader>
                <CardTitle className="text-xl font-medium text-black">Application Settings</CardTitle>
                <CardDescription className="font-light text-gray-600">
                  General application preferences and defaults
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="defaultDateRange" className="text-sm font-medium text-black">
                      Default Date Range
                    </Label>
                    <select
                      id="defaultDateRange"
                      value={settings.defaultDateRange}
                      onChange={(e) => handleInputChange('defaultDateRange', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md font-light focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="last_7_days">Last 7 Days</option>
                      <option value="last_30_days">Last 30 Days</option>
                      <option value="last_90_days">Last 90 Days</option>
                      <option value="last_6_months">Last 6 Months</option>
                      <option value="last_year">Last Year (365 days)</option>
                      <option value="this_month">This Calendar Month</option>
                      <option value="this_year">This Calendar Year</option>
                      <option value="calendar_2024">Calendar Year 2024</option>
                      <option value="calendar_2023">Calendar Year 2023</option>
                      <option value="financial_current">Current Financial Year</option>
                      <option value="financial_previous">Previous Financial Year</option>
                    </select>
                    <p className="text-xs text-gray-500 font-light">
                      Default date range when loading dashboards
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="currency" className="text-sm font-medium text-black">
                      Currency
                    </Label>
                    <select
                      id="currency"
                      value={settings.currency}
                      onChange={(e) => handleInputChange('currency', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md font-light focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="USD">USD ($)</option>
                      <option value="EUR">EUR (€)</option>
                      <option value="GBP">GBP (£)</option>
                      <option value="CAD">CAD (C$)</option>
                      <option value="AUD">AUD (A$)</option>
                    </select>
                    <p className="text-xs text-gray-500 font-light">
                      Display currency for all monetary values
                    </p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="timezone" className="text-sm font-medium text-black">
                    Timezone
                  </Label>
                  <select
                    id="timezone"
                    value={settings.timezone}
                    onChange={(e) => handleInputChange('timezone', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md font-light focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="UTC">UTC</option>
                    <option value="America/New_York">Eastern Time (ET)</option>
                    <option value="America/Chicago">Central Time (CT)</option>
                    <option value="America/Denver">Mountain Time (MT)</option>
                    <option value="America/Los_Angeles">Pacific Time (PT)</option>
                    <option value="Europe/London">London (GMT)</option>
                    <option value="Europe/Paris">Paris (CET)</option>
                    <option value="Asia/Tokyo">Tokyo (JST)</option>
                    <option value="Australia/Sydney">Sydney (AEST)</option>
                  </select>
                  <p className="text-xs text-gray-500 font-light">
                    Timezone for date and time displays
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                onClick={handleReset}
                disabled={saving}
                className="font-light"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Reset to Defaults
              </Button>
              
              <Button
                onClick={handleSave}
                disabled={saving}
                className="font-light"
              >
                {saving ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Settings
                  </>
                )}
              </Button>
            </div>
          </div>
      </div>
    </AppLayout>
  )
}

export default withShopAuth(SettingsPage)