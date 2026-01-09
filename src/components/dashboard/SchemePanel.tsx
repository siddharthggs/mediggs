// FILE: src/components/dashboard/SchemePanel.tsx
/// ANCHOR: SchemePanel
import { FormEvent, useEffect, useState } from 'react';
import type {
  CreateSchemeRequest,
  ProductDTO,
  SchemeDTO
} from '@shared/ipc';
import { invoke } from '../../api/ipcClient';

const SchemePanel = () => {
  const [products, setProducts] = useState<ProductDTO[]>([]);
  const [schemes, setSchemes] = useState<SchemeDTO[]>([]);
  const [form, setForm] = useState({
    name: '',
    description: '',
    validFrom: new Date().toISOString().substring(0, 10),
    validTo: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .substring(0, 10),
    productId: 0,
    purchaseQuantity: 1,
    bonusQuantity: 0,
    bonusProductId: 0
  });
  const [loading, setLoading] = useState(false);

  const loadData = async () => {
    const [productList, schemeList] = await Promise.all([
      invoke('ipc.product.list', { page: 1, pageSize: 1000 }).then(r => 'products' in r ? r.products : r),
      invoke('ipc.scheme.list', undefined)
    ]);
    setProducts(productList);
    setSchemes(schemeList);
  };

  useEffect(() => {
    loadData().catch(console.error);
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.name || !form.productId || form.purchaseQuantity <= 0) {
      return;
    }

    setLoading(true);
    try {
      const payload: CreateSchemeRequest = {
        name: form.name,
        description: form.description || undefined,
        validFrom: form.validFrom,
        validTo: form.validTo,
        items: [
          {
            productId: form.productId,
            purchaseQuantity: Number(form.purchaseQuantity),
            bonusQuantity: Number(form.bonusQuantity),
            bonusProductId: form.bonusProductId > 0 ? form.bonusProductId : undefined
          }
        ]
      };
      await invoke('ipc.scheme.create', payload);
      setForm({
        name: '',
        description: '',
        validFrom: new Date().toISOString().substring(0, 10),
        validTo: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
          .toISOString()
          .substring(0, 10),
        productId: 0,
        purchaseQuantity: 1,
        bonusQuantity: 0,
        bonusProductId: 0
      });
      await loadData();
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="panel">
      <header className="panel__header">
        <div>
          <h2>Schemes & Bonus</h2>
          <p>Promotional offers (Buy X Get Y)</p>
        </div>
      </header>
      <div className="panel__body">
        <form className="purchase-form" onSubmit={handleSubmit}>
          <div className="purchase-form__meta">
            <input
              placeholder="Scheme name"
              value={form.name}
              onChange={(event) =>
                setForm({ ...form, name: event.target.value })
              }
              required
            />
            <input
              placeholder="Description (optional)"
              value={form.description}
              onChange={(event) =>
                setForm({ ...form, description: event.target.value })
              }
            />
            <input
              type="date"
              value={form.validFrom}
              onChange={(event) =>
                setForm({ ...form, validFrom: event.target.value })
              }
              required
            />
            <input
              type="date"
              value={form.validTo}
              onChange={(event) =>
                setForm({ ...form, validTo: event.target.value })
              }
              required
            />
          </div>
          <div className="purchase-form__items">
            <div className="purchase-form__items-head">
              <span>Product</span>
              <span>Buy Qty</span>
              <span>Get Free</span>
              <span>Bonus Product</span>
            </div>
            <div className="purchase-form__items-row">
              <select
                value={form.productId}
                onChange={(event) =>
                  setForm({ ...form, productId: Number(event.target.value) })
                }
                required
              >
                <option value={0}>Select product</option>
                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name}
                  </option>
                ))}
              </select>
              <input
                type="number"
                min={1}
                value={form.purchaseQuantity}
                onChange={(event) =>
                  setForm({
                    ...form,
                    purchaseQuantity: Number(event.target.value)
                  })
                }
                required
              />
              <input
                type="number"
                min={0}
                value={form.bonusQuantity}
                onChange={(event) =>
                  setForm({
                    ...form,
                    bonusQuantity: Number(event.target.value)
                  })
                }
              />
              <select
                value={form.bonusProductId}
                onChange={(event) =>
                  setForm({
                    ...form,
                    bonusProductId: Number(event.target.value)
                  })
                }
              >
                <option value={0}>Same product</option>
                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <button
            className="purchase-form__submit"
            type="submit"
            disabled={loading}
          >
            {loading ? 'Creating…' : 'Create Scheme'}
          </button>
        </form>
        <div className="purchase-history">
          <h3>Active Schemes</h3>
          <ul>
            {schemes.length === 0 ? (
              <li className="empty">No schemes yet</li>
            ) : (
              schemes
                .filter((s) => s.isActive)
                .map((scheme) => (
                  <li key={scheme.id}>
                    <strong>{scheme.name}</strong>
                    <span>
                      {scheme.items[0]?.purchaseQuantity} +{' '}
                      {scheme.items[0]?.bonusQuantity} free
                    </span>
                    <span>
                      {new Date(scheme.validFrom).toLocaleDateString()} -{' '}
                      {new Date(scheme.validTo).toLocaleDateString()}
                    </span>
                  </li>
                ))
            )}
          </ul>
        </div>
      </div>
    </section>
  );
};

export default SchemePanel;

