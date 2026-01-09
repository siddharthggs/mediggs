// FILE: src/components/dashboard/StockSnapshotEnhanced.tsx
/// ANCHOR: StockSnapshotEnhanced
import { useEffect, useState, useMemo } from 'react';
import type { StockSnapshotEntry, ProductDTO, GodownDTO } from '@shared/ipc';
import { invoke } from '../../api/ipcClient';

interface Category {
  id: number;
  name: string;
}

interface Filters {
  search: string;
  categoryId?: number;
  manufacturer?: string;
  godownId?: number;
  minStock?: number;
  maxStock?: number;
}

const StockSnapshotEnhanced = ({ globalSearch }: { globalSearch?: string }) => {
  const [snapshot, setSnapshot] = useState<StockSnapshotEntry[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [godowns, setGodowns] = useState<GodownDTO[]>([]);
  const [manufacturers, setManufacturers] = useState<string[]>([]);
  const [filters, setFilters] = useState<Filters>({
    search: '',
    categoryId: undefined,
    manufacturer: undefined,
    godownId: undefined,
    minStock: undefined,
    maxStock: undefined
  });
  const [loading, setLoading] = useState(false);
  const [sortColumn, setSortColumn] = useState<keyof StockSnapshotEntry>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  useEffect(() => {
    if (globalSearch !== undefined) {
      setFilters(prev => ({ ...prev, search: globalSearch }));
    }
  }, [globalSearch]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [snapshotData, categoryList, godownList, productList] = await Promise.all([
        invoke('ipc.stock.snapshot', filters),
        invoke('ipc.category.list', undefined),
        invoke('ipc.godown.list', undefined),
        invoke('ipc.product.list', { page: 1, pageSize: 10000 }).then(r => 'products' in r ? r.products : [])
      ]);

      setSnapshot(snapshotData);
      setCategories(categoryList);
      setGodowns(godownList);
      
      // Extract unique manufacturers
      const uniqueManufacturers = Array.from(new Set(
        (productList as ProductDTO[])
          .map(p => p.manufacturer)
          .filter((m): m is string => !!m)
      )).sort();
      setManufacturers(uniqueManufacturers);
    } catch (error) {
      console.error('Error loading stock snapshot:', error);
      alert('Failed to load stock snapshot');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [filters.search, filters.categoryId, filters.manufacturer, filters.godownId, filters.minStock, filters.maxStock]);

  const sortedSnapshot = useMemo(() => {
    const sorted = [...snapshot];
    sorted.sort((a, b) => {
      const aVal = a[sortColumn];
      const bVal = b[sortColumn];
      if (aVal === undefined || aVal === null) return 1;
      if (bVal === undefined || bVal === null) return -1;
      
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
      }
      const aStr = String(aVal).toLowerCase();
      const bStr = String(bVal).toLowerCase();
      if (sortDirection === 'asc') {
        return aStr.localeCompare(bStr);
      }
      return bStr.localeCompare(aStr);
    });
    return sorted;
  }, [snapshot, sortColumn, sortDirection]);

  const handleSort = (column: keyof StockSnapshotEntry) => {
    if (sortColumn === column) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const exportToCSV = () => {
    const headers = ['Product', 'SKU', 'Available Qty', 'Godown', 'Unit', 'Stock Value', 'Category', 'Manufacturer'];
    const rows = snapshot.flatMap(entry => {
      if (entry.godownBreakup.length === 0) {
        return [[
          entry.name,
          entry.sku,
          entry.totalQuantity,
          'Unassigned',
          entry.unitOfMeasure || '-',
          entry.stockValue?.toFixed(2) || '0.00',
          entry.category || '-',
          entry.manufacturer || '-'
        ]];
      }
      return entry.godownBreakup.map(godown => [
        entry.name,
        entry.sku,
        godown.quantity,
        godown.godownName,
        entry.unitOfMeasure || '-',
        entry.stockValue ? (entry.stockValue * (godown.quantity / entry.totalQuantity)).toFixed(2) : '0.00',
        entry.category || '-',
        entry.manufacturer || '-'
      ]);
    });

    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `stock-snapshot-${new Date().toISOString().substring(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <section className="panel" style={{ gridColumn: '1 / -1' }}>
      <header className="panel__header">
        <div>
          <h2>Stock Snapshot</h2>
          <p>Complete inventory view with filters and export options</p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
          <button onClick={exportToCSV} disabled={loading} className="btn btn-outline btn-sm">
            📥 Export CSV
          </button>
          <button onClick={handlePrint} disabled={loading} className="btn btn-outline btn-sm">
            🖨️ Print
          </button>
          <button onClick={loadData} disabled={loading} className="btn btn-outline btn-sm">
            🔄 Refresh
          </button>
        </div>
      </header>
      <div className="panel__body">
        {/* Filters */}
        <div className="filter-group">
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '0.8125rem',
                fontWeight: 600,
                marginBottom: 'var(--spacing-xs)',
                color: 'var(--color-text-secondary)'
              }}
            >
              Search
            </label>
            <input
              type="text"
              placeholder="Product name/SKU"
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
            />
          </div>
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '0.8125rem',
                fontWeight: 600,
                marginBottom: 'var(--spacing-xs)',
                color: 'var(--color-text-secondary)'
              }}
            >
              Category
            </label>
            <select
              value={filters.categoryId || ''}
              onChange={(e) => setFilters(prev => ({ ...prev, categoryId: e.target.value ? Number(e.target.value) : undefined }))}
            >
              <option value="">All Categories</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '0.8125rem',
                fontWeight: 600,
                marginBottom: 'var(--spacing-xs)',
                color: 'var(--color-text-secondary)'
              }}
            >
              Manufacturer
            </label>
            <select
              value={filters.manufacturer || ''}
              onChange={(e) => setFilters(prev => ({ ...prev, manufacturer: e.target.value || undefined }))}
            >
              <option value="">All Manufacturers</option>
              {manufacturers.map(mfg => (
                <option key={mfg} value={mfg}>{mfg}</option>
              ))}
            </select>
          </div>
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '0.8125rem',
                fontWeight: 600,
                marginBottom: 'var(--spacing-xs)',
                color: 'var(--color-text-secondary)'
              }}
            >
              Godown
            </label>
            <select
              value={filters.godownId || ''}
              onChange={(e) => setFilters(prev => ({ ...prev, godownId: e.target.value ? Number(e.target.value) : undefined }))}
            >
              <option value="">All Godowns</option>
              {godowns.map(gd => (
                <option key={gd.id} value={gd.id}>{gd.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '0.8125rem',
                fontWeight: 600,
                marginBottom: 'var(--spacing-xs)',
                color: 'var(--color-text-secondary)'
              }}
            >
              Min Qty
            </label>
            <input
              type="number"
              placeholder="Min stock"
              value={filters.minStock || ''}
              onChange={(e) => setFilters(prev => ({ ...prev, minStock: e.target.value ? Number(e.target.value) : undefined }))}
            />
          </div>
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '0.8125rem',
                fontWeight: 600,
                marginBottom: 'var(--spacing-xs)',
                color: 'var(--color-text-secondary)'
              }}
            >
              Max Qty
            </label>
            <input
              type="number"
              placeholder="Max stock"
              value={filters.maxStock || ''}
              onChange={(e) => setFilters(prev => ({ ...prev, maxStock: e.target.value ? Number(e.target.value) : undefined }))}
            />
          </div>
        </div>

        {/* Table */}
        <div className="table-wrapper" style={{ overflowX: 'auto' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '2rem' }}>Loading stock snapshot...</div>
          ) : sortedSnapshot.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
              No stock data found matching your filters
            </div>
          ) : (
            <table className="table" style={{ width: '100%', fontSize: '0.875rem' }}>
              <thead>
                <tr>
                  <th onClick={() => handleSort('name')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                    Product {sortColumn === 'name' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th onClick={() => handleSort('sku')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                    SKU {sortColumn === 'sku' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th onClick={() => handleSort('totalQuantity')} style={{ cursor: 'pointer', userSelect: 'none', textAlign: 'right' }}>
                    Available Qty {sortColumn === 'totalQuantity' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th>Godown</th>
                  <th>Unit</th>
                  <th onClick={() => handleSort('stockValue')} style={{ cursor: 'pointer', userSelect: 'none', textAlign: 'right' }}>
                    Stock Value {sortColumn === 'stockValue' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th onClick={() => handleSort('category')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                    Category {sortColumn === 'category' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th onClick={() => handleSort('manufacturer')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                    Manufacturer {sortColumn === 'manufacturer' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedSnapshot.map((entry) => {
                  if (entry.godownBreakup.length === 0) {
                    return (
                      <tr key={entry.productId}>
                        <td><strong>{entry.name}</strong></td>
                        <td>{entry.sku}</td>
                        <td style={{ textAlign: 'right', fontWeight: 600 }}>{entry.totalQuantity}</td>
                        <td>Unassigned</td>
                        <td>{entry.unitOfMeasure || '-'}</td>
                        <td style={{ textAlign: 'right' }}>₹{entry.stockValue?.toFixed(2) || '0.00'}</td>
                        <td>{entry.category || '-'}</td>
                        <td>{entry.manufacturer || '-'}</td>
                      </tr>
                    );
                  }
                  return entry.godownBreakup.map((godown, idx) => (
                    <tr key={`${entry.productId}-${godown.godownId ?? 'none'}-${idx}`}>
                      {idx === 0 && (
                        <>
                          <td rowSpan={entry.godownBreakup.length}><strong>{entry.name}</strong></td>
                          <td rowSpan={entry.godownBreakup.length}>{entry.sku}</td>
                          <td rowSpan={entry.godownBreakup.length} style={{ textAlign: 'right', fontWeight: 600 }}>{entry.totalQuantity}</td>
                        </>
                      )}
                      <td>{godown.godownName}</td>
                      <td>{entry.unitOfMeasure || '-'}</td>
                      {idx === 0 && (
                        <td rowSpan={entry.godownBreakup.length} style={{ textAlign: 'right' }}>
                          ₹{entry.stockValue?.toFixed(2) || '0.00'}
                        </td>
                      )}
                      {idx === 0 && (
                        <>
                          <td rowSpan={entry.godownBreakup.length}>{entry.category || '-'}</td>
                          <td rowSpan={entry.godownBreakup.length}>{entry.manufacturer || '-'}</td>
                        </>
                      )}
                    </tr>
                  ));
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </section>
  );
};

export default StockSnapshotEnhanced;

