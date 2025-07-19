import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { X, Plus } from 'lucide-react';

interface PivotTableProps {
  data: any[];
  columns: Array<{
    key: string;
    label: string;
    type: 'text' | 'number' | 'currency' | 'date' | 'percentage';
  }>;
}

interface PivotConfig {
  rows: string[];
  columns: string[];
  values: Array<{
    field: string;
    aggregation: 'sum' | 'count' | 'avg' | 'min' | 'max';
  }>;
}

const PivotTable: React.FC<PivotTableProps> = ({ data, columns }) => {
  const [pivotConfig, setPivotConfig] = useState<PivotConfig>({
    rows: [],
    columns: [],
    values: []
  });

  const availableFields = columns.map(col => ({
    key: col.key,
    label: col.label,
    type: col.type
  }));

  const numericFields = availableFields.filter(field => 
    field.type === 'number' || field.type === 'currency' || field.type === 'percentage'
  );

  const categoricalFields = availableFields.filter(field => 
    field.type === 'text' || field.type === 'date'
  );

  const addRowField = (field: string) => {
    if (!pivotConfig.rows.includes(field)) {
      setPivotConfig(prev => ({
        ...prev,
        rows: [...prev.rows, field]
      }));
    }
  };

  const removeRowField = (field: string) => {
    setPivotConfig(prev => ({
      ...prev,
      rows: prev.rows.filter(r => r !== field)
    }));
  };

  const addColumnField = (field: string) => {
    if (!pivotConfig.columns.includes(field)) {
      setPivotConfig(prev => ({
        ...prev,
        columns: [...prev.columns, field]
      }));
    }
  };

  const removeColumnField = (field: string) => {
    setPivotConfig(prev => ({
      ...prev,
      columns: prev.columns.filter(c => c !== field)
    }));
  };

  const addValueField = (field: string, aggregation: 'sum' | 'count' | 'avg' | 'min' | 'max') => {
    const exists = pivotConfig.values.find(v => v.field === field && v.aggregation === aggregation);
    if (!exists) {
      setPivotConfig(prev => ({
        ...prev,
        values: [...prev.values, { field, aggregation }]
      }));
    }
  };

  const removeValueField = (index: number) => {
    setPivotConfig(prev => ({
      ...prev,
      values: prev.values.filter((_, i) => i !== index)
    }));
  };

  const pivotData = useMemo(() => {
    if (!data.length || !pivotConfig.values.length || !pivotConfig.rows.length) return null;

    // Group data by row and column fields
    const grouped: { [key: string]: any[] } = {};
    
    data.forEach(row => {
      const rowKey = pivotConfig.rows.map(field => row[field] || 'N/A').join('|');
      const colKey = pivotConfig.columns.length > 0 ? 
        pivotConfig.columns.map(field => row[field] || 'N/A').join('|') : 
        'Total';
      const key = `${rowKey}::${colKey}`;
      
      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(row);
    });

    // Calculate aggregations
    const result: { [key: string]: any } = {};
    
    Object.entries(grouped).forEach(([key, rows]) => {
      const [rowKey, colKey] = key.split('::');
      
      if (!result[rowKey]) {
        result[rowKey] = {};
      }
      
      pivotConfig.values.forEach(({ field, aggregation }) => {
        const valueKey = `${colKey}|${field}|${aggregation}`;
        const values = rows.map(r => parseFloat(r[field]) || 0).filter(v => !isNaN(v));
        
        let aggregatedValue = 0;
        switch (aggregation) {
          case 'sum':
            aggregatedValue = values.reduce((sum, val) => sum + val, 0);
            break;
          case 'count':
            aggregatedValue = rows.length;
            break;
          case 'avg':
            aggregatedValue = values.length ? values.reduce((sum, val) => sum + val, 0) / values.length : 0;
            break;
          case 'min':
            aggregatedValue = values.length ? Math.min(...values) : 0;
            break;
          case 'max':
            aggregatedValue = values.length ? Math.max(...values) : 0;
            break;
        }
        
        result[rowKey][valueKey] = aggregatedValue;
      });
    });

    return result;

  // Get unique column values for headers
  const uniqueColumnValues = useMemo(() => {
    if (!pivotConfig.columns.length) return ['Total'];
    
    const values = new Set<string>();
    data.forEach(row => {
      const colKey = pivotConfig.columns.map(field => row[field] || 'N/A').join('|');
      values.add(colKey);
    });
    
    return Array.from(values).sort();
  }, [data, pivotConfig.columns]);
=======
  // Get unique column values for headers
  const uniqueColumnValues = useMemo(() => {
    if (pivotConfig.columns.length === 0) return ['Total'];
    
    const values = new Set<string>();
    data.forEach(row => {
      const colKey = pivotConfig.columns.map(field => row[field] || 'N/A').join('|');
      values.add(colKey);
    });
    
    return Array.from(values).sort();
  }, [data, pivotConfig.columns]);

  const formatValue = (value: number, field: string, aggregation: string) => {
    const column = columns.find(col => col.key === field);
    if (!column) return value.toLocaleString();

    switch (column.type) {
      case 'currency':
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD'
        }).format(value);
      case 'percentage':
        return `${value.toFixed(2)}%`;
      default:
        return aggregation === 'avg' ? value.toFixed(2) : value.toLocaleString();
    }
  };
=======
  }, [data, pivotConfig]);

  // Get unique column values for headers
  const uniqueColumnValues = useMemo(() => {
    if (pivotConfig.columns.length === 0) return ['Total'];
    
    const values = new Set<string>();
    data.forEach(row => {
      const colKey = pivotConfig.columns.map(field => row[field] || 'N/A').join('|');
      values.add(colKey);
    });
    
    return Array.from(values).sort();
  }, [data, pivotConfig.columns]);

  const formatValue = (value: number, field: string, aggregation: string) => {
    const column = columns.find(col => col.key === field);
    if (!column) return value.toLocaleString();

    switch (column.type) {
      case 'currency':
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD'
        }).format(value);
      case 'percentage':
        return `${value.toFixed(2)}%`;
      default:
        return aggregation === 'avg' ? value.toFixed(2) : value.toLocaleString();
    }
  };
=======

  // Get unique column values for headers
  const uniqueColumnValues = useMemo(() => {
    if (!pivotConfig.columns.length) return ['Total'];
    
    const values = new Set<string>();
    data.forEach(row => {
      const colKey = pivotConfig.columns.map(field => row[field] || 'N/A').join('|');
      values.add(colKey);
    });
    
    return Array.from(values).sort();
  }, [data, pivotConfig.columns]);
=======
  // Get unique column values for headers
  const uniqueColumnValues = useMemo(() => {
    if (pivotConfig.columns.length === 0) return ['Total'];
    
    const values = new Set<string>();
    data.forEach(row => {
      const colKey = pivotConfig.columns.map(field => row[field] || 'N/A').join('|');
      values.add(colKey);
    });
    
    return Array.from(values).sort();
  }, [data, pivotConfig.columns]);

  const formatValue = (value: number, field: string, aggregation: string) => {
    const column = columns.find(col => col.key === field);
    if (!column) return value.toLocaleString();

    switch (column.type) {
      case 'currency':
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD'
        }).format(value);
      case 'percentage':
        return `${value.toFixed(2)}%`;
      default:
        return aggregation === 'avg' ? value.toFixed(2) : value.toLocaleString();
    }
  };

  return (
    <div className="space-y-6">
      {/* Configuration Panel */}
      <Card>
        <CardHeader>
          <CardTitle>Pivot Table Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Row Fields */}
          <div>
            <label className="text-sm font-medium mb-2 block">Row Fields</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {pivotConfig.rows.map(field => (
                <Badge key={field} variant="secondary" className="flex items-center gap-1">
                  {availableFields.find(f => f.key === field)?.label || field}
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-4 w-4 p-0"
                    onClick={() => removeRowField(field)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              ))}
            </div>
            <Select onValueChange={addRowField}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Add row field" />
              </SelectTrigger>
              <SelectContent>
                {categoricalFields
                  .filter(field => !pivotConfig.rows.includes(field.key))
                  .map(field => (
                    <SelectItem key={field.key} value={field.key}>
                      {field.label}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          {/* Column Fields */}
          <div>
            <label className="text-sm font-medium mb-2 block">Column Fields <span className="text-xs text-muted-foreground">(optional)</span></label>
            <div className="flex flex-wrap gap-2 mb-2">
              {pivotConfig.columns.map(field => (
                <Badge key={field} variant="secondary" className="flex items-center gap-1">
                  {availableFields.find(f => f.key === field)?.label || field}
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-4 w-4 p-0"
                    onClick={() => removeColumnField(field)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              ))}
            </div>
            <Select onValueChange={addColumnField}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Add column field" />
              </SelectTrigger>
              <SelectContent>
                {categoricalFields
                  .filter(field => !pivotConfig.columns.includes(field.key))
                  .map(field => (
                    <SelectItem key={field.key} value={field.key}>
                      {field.label}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          {/* Value Fields */}
          <div>
            <label className="text-sm font-medium mb-2 block">Value Fields</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {pivotConfig.values.map((value, index) => (
                <Badge key={index} variant="secondary" className="flex items-center gap-1">
                  {value.aggregation}({availableFields.find(f => f.key === value.field)?.label || value.field})
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-4 w-4 p-0"
                    onClick={() => removeValueField(index)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Select onValueChange={(field) => addValueField(field, 'sum')}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Add value field" />
                </SelectTrigger>
                <SelectContent>
                  {numericFields.map(field => (
                    <SelectItem key={field.key} value={field.key}>
                      {field.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 mt-2">
              {['sum', 'count', 'avg', 'min', 'max'].map(agg => (
                <Button
                  key={agg}
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    if (numericFields.length > 0) {
                      addValueField(numericFields[0].key, agg as any);
                    }
                  }}
                >
                  {agg.toUpperCase()}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pivot Table */}
      {pivotData && (
        <Card>
          <CardHeader>
            <CardTitle>Pivot Table Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    {pivotConfig.rows.map(field => (
                      <TableHead key={field}>
                        {availableFields.find(f => f.key === field)?.label || field}
                      </TableHead>
                    ))}
                    {uniqueColumnValues.map(colValue => 
                      pivotConfig.values.map(({ field, aggregation }) => (
                        <TableHead key={`${colValue}|${field}|${aggregation}`}>
                          {colValue === 'Total' ? '' : `${colValue} - `}
                          {aggregation}({availableFields.find(f => f.key === field)?.label || field})
                        </TableHead>
                      ))
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Object.entries(pivotData).map(([rowKey, rowData]) => (
                    <TableRow key={rowKey}>
                      {pivotConfig.rows.map((field, index) => (
                        <TableCell key={field}>
                          {rowKey.split('|')[index] || 'N/A'}
                        </TableCell>
                      ))}
                      {uniqueColumnValues.map(colValue => 
                        pivotConfig.values.map(({ field, aggregation }) => {
                          const valueKey = `${colValue}|${field}|${aggregation}`;
                          const value = rowData[valueKey] || 0;
                          return (
                            <TableCell key={valueKey}>
                              {formatValue(value, field, aggregation)}
                            </TableCell>
                          );
                        })
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {!pivotData && (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-muted-foreground">
              Configure row fields and value fields to generate pivot table
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Column fields are optional - without them, you'll get a simple grouped summary
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PivotTable;