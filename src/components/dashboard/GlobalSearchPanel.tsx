// FILE: src/components/dashboard/GlobalSearchPanel.tsx
/// ANCHOR: GlobalSearchPanel
import { useState, useEffect } from 'react';
import { invoke } from '../../api/ipcClient';

interface SearchResult {
  products: Array<{
    id: number;
    name: string;
    sku: string;
    manufacturer?: string;
    drugCategory?: string;
    drugGroup?: string;
    barcode?: string;
    stripCode?: string;
    itemCode?: string;
  }>;
  customers: Array<{
    id: number;
    name: string;
    gstin?: string;
    phone?: string;
  }>;
  suppliers: Array<{
    id: number;
    name: string;
    gstin?: string;
    phone?: string;
  }>;
  batches: Array<{
    id: number;
    batchNumber: string;
    productName: string;
    expiryDate: string;
  }>;
  invoices: Array<{
    id: number;
    invoiceNumber: string;
    type: 'sales' | 'purchase';
    date: string;
  }>;
  mrs: Array<{
    id: number;
    name: string;
    code?: string;
  }>;
  doctors: Array<{
    id: number;
    name: string;
    code?: string;
  }>;
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

const GlobalSearchPanel = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [entityTypes, setEntityTypes] = useState<string[]>([]);

  const performSearch = async () => {
    if (!query.trim()) {
      setResults(null);
      return;
    }
    setLoading(true);
    try {
      const result = await invoke('ipc.search.global', {
        query: query.trim(),
        page,
        pageSize: 20,
        filters: entityTypes.length > 0 ? { entityTypes } : undefined
      });
      setResults(result);
    } catch (error) {
      console.error('Search error:', error);
      alert('Search failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (query.trim()) {
        performSearch();
      }
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [query, page, entityTypes]);

  const entityTypeOptions = [
    { value: 'product', label: 'Products' },
    { value: 'customer', label: 'Customers' },
    { value: 'supplier', label: 'Suppliers' },
    { value: 'batch', label: 'Batches' },
    { value: 'invoice', label: 'Invoices' },
    { value: 'mr', label: 'MRs' },
    { value: 'doctor', label: 'Doctors' }
  ];

  return (
    <section className="panel">
      <header className="panel__header">
        <div>
          <h2>Global Search</h2>
          <p>Search across all entities with fuzzy matching</p>
        </div>
      </header>
      <div className="panel__body">
        <div style={{ marginBottom: '1rem' }}>
          <input
            type="text"
            placeholder="Search products, customers, suppliers, batches, invoices, MRs, doctors..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
            }}
            style={{ width: '100%', padding: '0.75rem', fontSize: '1.1em' }}
            autoFocus
          />
          <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {entityTypeOptions.map(opt => (
              <label key={opt.value} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <input
                  type="checkbox"
                  checked={entityTypes.includes(opt.value)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setEntityTypes([...entityTypes, opt.value]);
                    } else {
                      setEntityTypes(entityTypes.filter(t => t !== opt.value));
                    }
                  }}
                />
                {opt.label}
              </label>
            ))}
          </div>
        </div>

        {loading && <div style={{ textAlign: 'center', padding: '2rem' }}>Searching...</div>}

        {results && !loading && (
          <div>
            <div style={{ marginBottom: '1rem', color: '#666' }}>
              Found {results.total} results (Page {results.page} of {results.totalPages})
            </div>

            {results.products.length > 0 && (
              <div style={{ marginBottom: '2rem' }}>
                <h3>Products ({results.products.length})</h3>
                <table style={{ width: '100%', marginTop: '0.5rem' }}>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>SKU</th>
                      <th>Manufacturer</th>
                      <th>Category</th>
                      <th>Group</th>
                      <th>Barcode</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.products.map(p => (
                      <tr key={p.id}>
                        <td>{p.name}</td>
                        <td>{p.sku}</td>
                        <td>{p.manufacturer || '-'}</td>
                        <td>{p.drugCategory || '-'}</td>
                        <td>{p.drugGroup || '-'}</td>
                        <td>{p.barcode || p.stripCode || p.itemCode || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {results.customers.length > 0 && (
              <div style={{ marginBottom: '2rem' }}>
                <h3>Customers ({results.customers.length})</h3>
                <table style={{ width: '100%', marginTop: '0.5rem' }}>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>GSTIN</th>
                      <th>Phone</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.customers.map(c => (
                      <tr key={c.id}>
                        <td>{c.name}</td>
                        <td>{c.gstin || '-'}</td>
                        <td>{c.phone || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {results.suppliers.length > 0 && (
              <div style={{ marginBottom: '2rem' }}>
                <h3>Suppliers ({results.suppliers.length})</h3>
                <table style={{ width: '100%', marginTop: '0.5rem' }}>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>GSTIN</th>
                      <th>Phone</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.suppliers.map(s => (
                      <tr key={s.id}>
                        <td>{s.name}</td>
                        <td>{s.gstin || '-'}</td>
                        <td>{s.phone || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {results.batches.length > 0 && (
              <div style={{ marginBottom: '2rem' }}>
                <h3>Batches ({results.batches.length})</h3>
                <table style={{ width: '100%', marginTop: '0.5rem' }}>
                  <thead>
                    <tr>
                      <th>Batch Number</th>
                      <th>Product</th>
                      <th>Expiry Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.batches.map(b => (
                      <tr key={b.id}>
                        <td>{b.batchNumber}</td>
                        <td>{b.productName}</td>
                        <td>{new Date(b.expiryDate).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {results.invoices.length > 0 && (
              <div style={{ marginBottom: '2rem' }}>
                <h3>Invoices ({results.invoices.length})</h3>
                <table style={{ width: '100%', marginTop: '0.5rem' }}>
                  <thead>
                    <tr>
                      <th>Invoice Number</th>
                      <th>Type</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.invoices.map(inv => (
                      <tr key={inv.id}>
                        <td>{inv.invoiceNumber}</td>
                        <td>{inv.type}</td>
                        <td>{new Date(inv.date).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {results.mrs.length > 0 && (
              <div style={{ marginBottom: '2rem' }}>
                <h3>MRs/Salesmen ({results.mrs.length})</h3>
                <table style={{ width: '100%', marginTop: '0.5rem' }}>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Code</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.mrs.map(mr => (
                      <tr key={mr.id}>
                        <td>{mr.name}</td>
                        <td>{mr.code || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {results.doctors.length > 0 && (
              <div style={{ marginBottom: '2rem' }}>
                <h3>Doctors ({results.doctors.length})</h3>
                <table style={{ width: '100%', marginTop: '0.5rem' }}>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Code</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.doctors.map(doc => (
                      <tr key={doc.id}>
                        <td>{doc.name}</td>
                        <td>{doc.code || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {results.totalPages > 1 && (
              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', marginTop: '1rem' }}>
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Previous
                </button>
                <span>Page {page} of {results.totalPages}</span>
                <button
                  onClick={() => setPage(p => Math.min(results.totalPages, p + 1))}
                  disabled={page === results.totalPages}
                >
                  Next
                </button>
              </div>
            )}
          </div>
        )}

        {!results && !loading && query && (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
            No results found. Try a different search term.
          </div>
        )}
      </div>
    </section>
  );
};

export default GlobalSearchPanel;

