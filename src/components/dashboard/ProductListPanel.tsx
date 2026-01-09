// FILE: src/components/dashboard/ProductListPanel.tsx
/// ANCHOR: ProductListPanel
import { useEffect, useState, useCallback } from 'react';
import type { ProductDTO } from '@shared/ipc';
import { invoke } from '../../api/ipcClient';
import { safeInvoke } from '../../utils/safeInvoke';
import { useToast } from '../../utils/toast';
import { forceRecoverUI } from '../../utils/forceRecover';
import { useNavigate } from 'react-router-dom';

const ProductListPanel = () => {
  const { showError, showSuccess } = useToast();
  const [products, setProducts] = useState<ProductDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const navigate = useNavigate();

  // FIX: Memoize loadProducts to prevent infinite loops in useEffect
  const loadProducts = useCallback(async () => {
    setLoading(true);
    try {
      // FIX: Use safeInvoke to prevent UI freezing on errors
      const response = await safeInvoke('ipc.product.list', {
        page: 1,
        pageSize: 1000,
        search: search || undefined
      });
      
      if (response.success && response.data) {
        const data = 'products' in response.data ? response.data.products : response.data;
        setProducts(Array.isArray(data) ? data : []);
      } else {
        showError(response.error || 'Failed to load products');
      }
    } finally {
      setLoading(false);
    }
  }, [search, showError]);

  useEffect(() => {
    loadProducts().catch(console.error);
  }, [loadProducts]);

  const getPackingString = (product: ProductDTO): string => {
    if (product.unitOfMeasure && product.purchasePack) {
      return `${product.unitOfMeasure} of ${product.purchasePack}`;
    }
    return product.packSize || '-';
  };

  const getLatestBatch = (product: ProductDTO) => {
    if (!product.batches || product.batches.length === 0) return null;
    return product.batches[0];
  };

  const calculateTotals = () => {
    let totalQuantity = 0;
    let totalGST = 0;
    let totalMRPValue = 0;
    let totalPTRValue = 0;
    let batchCount = 0;

    products.forEach(product => {
      if (product.batches) {
        product.batches.forEach(batch => {
          totalQuantity += batch.quantity;
          totalGST += product.gstRate;
          totalMRPValue += batch.mrp * batch.quantity;
          totalPTRValue += batch.ptr * batch.quantity;
          batchCount++;
        });
      }
    });

    const grossValue = totalMRPValue;
    const netValue = totalPTRValue;
    const avgGST = products.length > 0 ? totalGST / products.length : 0;

    return {
      totalQuantity,
      totalGST: avgGST,
      totalMRPValue,
      totalPTRValue,
      grossValue,
      netValue,
      batchCount,
      totalProducts: products.length
    };
  };

  const totals = calculateTotals();

  const handleDeleteProduct = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    
    // FIX: Set loading state to prevent UI lock
    setDeletingId(id);
    
    // FIX: Close any modals/overlays immediately
    document.querySelectorAll('[role="dialog"]').forEach((el) => {
      (el as HTMLElement).style.display = 'none';
    });
    document.querySelectorAll('.backdrop, [class*="backdrop"]').forEach((el) => {
      (el as HTMLElement).remove();
    });
    
    // FIX: Restore focus immediately
    document.body.focus();
    
    try {
      // FIX: Use safeInvoke - never throws
      const result = await safeInvoke('ipc.product.delete', { id });
      
      if (!result.success) {
        showError(result.error || 'Failed to delete product');
        // FIX: Immediately recover UI on error to prevent input lock
        forceRecoverUI();
        return;
      }
      
      showSuccess('Product deleted successfully');
      await loadProducts();
    } catch (error) {
      // FIX: Catch any unexpected errors
      console.error('Delete error:', error);
      showError(error instanceof Error ? error.message : 'Failed to delete product');
      // FIX: Immediately recover UI on error
      forceRecoverUI();
    } finally {
      // FIX: Always release loading state, even on error
      setDeletingId(null);
      // FIX: Force recover UI to ensure inputs are enabled
      forceRecoverUI();
    }
  };

  return (
    <section className="panel">
      <header className="panel__header">
        <div>
          <h2>Products</h2>
          <p>View and manage product master data</p>
        </div>
        <div className="search-bar">
          <input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button
            type="button"
            onClick={() => navigate('/products/create')}
            className="btn btn-primary"
          >
            Create New Product
          </button>
          <button
            type="button"
            onClick={loadProducts}
            disabled={loading}
            className="btn btn-outline"
          >
            Refresh
          </button>
        </div>
      </header>
      <div className="panel__body">
        <table className="product-table" style={{ width: '100%', marginBottom: '1rem' }}>
          <thead>
            <tr>
              <th>Product Name</th>
              <th>Packing</th>
              <th>Batch No</th>
              <th>Quantity</th>
              <th>Scheme</th>
              <th>Expiry</th>
              <th>Tax %</th>
              <th>MRP</th>
              <th>PTR</th>
              <th>Amount</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.length === 0 ? (
              <tr>
                <td colSpan={10} className="empty">
                  {loading ? 'Loading...' : 'No products found'}
                </td>
              </tr>
            ) : (
              products.map((product) => {
                const latestBatch = getLatestBatch(product);
                const stockValue = latestBatch ? latestBatch.mrp * latestBatch.quantity : 0;
                return (
                  <tr key={product.id}>
                    <td>{product.name}</td>
                    <td>{getPackingString(product)}</td>
                    <td>{latestBatch?.batchNumber || '-'}</td>
                    <td>{latestBatch?.quantity || 0}</td>
                    <td>-</td>
                    <td>{latestBatch ? new Date(latestBatch.expiryDate).toLocaleDateString() : '-'}</td>
                    <td>{product.gstRate.toFixed(2)}%</td>
                    <td>{latestBatch?.mrp.toFixed(2) || '-'}</td>
                    <td>{latestBatch?.ptr.toFixed(2) || '-'}</td>
                    <td>{stockValue.toFixed(2)}</td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        type="button"
                        className="btn btn-danger btn-xs"
                        onClick={() => handleDeleteProduct(product.id)}
                        disabled={deletingId === product.id}
                      >
                        {deletingId === product.id ? 'Deleting...' : 'Delete'}
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>

        <div style={{
          border: '1px solid var(--color-border)',
          padding: 'var(--spacing-xl)',
          borderRadius: 'var(--radius-lg)',
          backgroundColor: 'var(--color-bg-secondary)',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 'var(--spacing-lg)',
          marginTop: 'var(--spacing-xl)'
        }}>
          <div>
            <strong style={{ 
              display: 'block', 
              fontSize: '0.875rem', 
              color: 'var(--color-text-secondary)', 
              marginBottom: 'var(--spacing-sm)',
              fontWeight: 600
            }}>Total Quantity:</strong>
            <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>{totals.totalQuantity}</div>
          </div>
          <div>
            <strong style={{ 
              display: 'block', 
              fontSize: '0.875rem', 
              color: 'var(--color-text-secondary)', 
              marginBottom: 'var(--spacing-sm)',
              fontWeight: 600
            }}>Total GST:</strong>
            <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>{totals.totalGST.toFixed(2)}%</div>
          </div>
          <div>
            <strong style={{ 
              display: 'block', 
              fontSize: '0.875rem', 
              color: 'var(--color-text-secondary)', 
              marginBottom: 'var(--spacing-sm)',
              fontWeight: 600
            }}>Total MRP Value:</strong>
            <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>₹{totals.totalMRPValue.toFixed(2)}</div>
          </div>
          <div>
            <strong style={{ 
              display: 'block', 
              fontSize: '0.875rem', 
              color: 'var(--color-text-secondary)', 
              marginBottom: 'var(--spacing-sm)',
              fontWeight: 600
            }}>Total PTR Value:</strong>
            <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>₹{totals.totalPTRValue.toFixed(2)}</div>
          </div>
          <div>
            <strong style={{ 
              display: 'block', 
              fontSize: '0.875rem', 
              color: 'var(--color-text-secondary)', 
              marginBottom: 'var(--spacing-sm)',
              fontWeight: 600
            }}>Gross Value:</strong>
            <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>₹{totals.grossValue.toFixed(2)}</div>
          </div>
          <div>
            <strong style={{ 
              display: 'block', 
              fontSize: '0.875rem', 
              color: 'var(--color-text-secondary)', 
              marginBottom: 'var(--spacing-sm)',
              fontWeight: 600
            }}>Net Value:</strong>
            <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>₹{totals.netValue.toFixed(2)}</div>
          </div>
          <div>
            <strong style={{ 
              display: 'block', 
              fontSize: '0.875rem', 
              color: 'var(--color-text-secondary)', 
              marginBottom: 'var(--spacing-sm)',
              fontWeight: 600
            }}>Batch Count:</strong>
            <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>{totals.batchCount}</div>
          </div>
          <div>
            <strong style={{ 
              display: 'block', 
              fontSize: '0.875rem', 
              color: 'var(--color-text-secondary)', 
              marginBottom: 'var(--spacing-sm)',
              fontWeight: 600
            }}>Total Products:</strong>
            <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>{totals.totalProducts}</div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ProductListPanel;

