// FILE: src/components/dashboard/ProductCreationPanel.tsx
/// ANCHOR: ProductCreationPanel
import { FormEvent, useEffect, useState } from 'react';
import type { CreateProductRequest } from '@shared/ipc';
import { invoke } from '../../api/ipcClient';

interface Category {
  id: number;
  name: string;
}

interface Subcategory {
  id: number;
  name: string;
  categoryId: number;
}

interface Company {
  id: number;
  name: string;
}

interface Schedule {
  id: number;
  name: string;
}

interface StorageType {
  id: number;
  name: string;
}

interface Godown {
  id: number;
  name: string;
}

const ProductCreationPanel = () => {
  const [form, setForm] = useState<CreateProductRequest>({
    sku: '',
    name: '',
    hsnCode: '',
    manufacturer: '',
    drugCategory: '',
    drugGroup: '',
    drugContent: '',
    unitOfMeasure: '',
    purchasePack: '',
    stripQuantity: undefined,
    barcode: '',
    stripCode: '',
    itemCode: '',
    categoryId: undefined,
    subcategoryId: undefined,
    companyId: undefined,
    scheduleId: undefined,
    storageTypeId: undefined,
    packSize: '',
    gstRate: 0,
    minStock: 0,
    maxStock: undefined,
    isBatchManaged: true,
    initialBatch: undefined
  });

  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [storageTypes, setStorageTypes] = useState<StorageType[]>([]);
  const [godowns, setGodowns] = useState<Godown[]>([]);
  const [loading, setLoading] = useState(false);
  const [showBatchFields, setShowBatchFields] = useState(true);

  useEffect(() => {
    const loadMasters = async () => {
      try {
        const [cats, comps, scheds, sts, gds] = await Promise.all([
          invoke('ipc.category.list', undefined),
          invoke('ipc.company.list', undefined),
          invoke('ipc.schedule.list', undefined),
          invoke('ipc.storageType.list', undefined),
          invoke('ipc.godown.list', undefined)
        ]);
        setCategories(cats);
        setCompanies(comps);
        setSchedules(scheds);
        setStorageTypes(sts);
        setGodowns(gds);
      } catch (error) {
        console.error('Error loading masters:', error);
      }
    };
    loadMasters();
  }, []);

  useEffect(() => {
    if (form.categoryId) {
      invoke('ipc.subcategory.list', { categoryId: form.categoryId })
        .then(setSubcategories)
        .catch(console.error);
    } else {
      setSubcategories([]);
    }
  }, [form.categoryId]);

  const updateForm = (field: keyof CreateProductRequest, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const updateBatchField = (field: string, value: any) => {
    setForm(prev => ({
      ...prev,
      initialBatch: {
        ...(prev.initialBatch || {
          batchNumber: '',
          expiryDate: new Date().toISOString().substring(0, 10),
          quantity: 0,
          mrp: 0,
          ptr: 0,
          pts: 0,
          freeQuantity: 0,
          discount: 0
        }),
        [field]: value
      }
    }));
  };

  const calculateBatchValues = () => {
    if (!form.initialBatch) return;
    const batch = form.initialBatch;
    const ptr = batch.ptr || 0;
    const discount = batch.discount || 0;
    const discountAmount = ptr * (discount / 100);
    const pts = ptr - discountAmount;
    const mrp = batch.mrp || 0;
    
    updateBatchField('pts', pts);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.sku || !form.name || !form.hsnCode) {
      alert('SKU, Name, and HSN Code are required');
      return;
    }

    // Validate initial batch if batch managed
    if (form.isBatchManaged && form.initialBatch) {
      if (!form.initialBatch.batchNumber || form.initialBatch.batchNumber.trim() === '') {
        alert('Batch Number is required for batch-managed products');
        return;
      }
      if (!form.initialBatch.expiryDate) {
        alert('Expiry Date is required for initial batch');
        return;
      }
      if ((form.initialBatch.quantity || 0) <= 0) {
        alert('Quantity must be greater than 0 for initial batch');
        return;
      }
      
      // Recalculate PTS if not already calculated
      if (form.initialBatch.ptr && (!form.initialBatch.pts || form.initialBatch.pts === 0)) {
        const ptr = form.initialBatch.ptr || 0;
        const discount = form.initialBatch.discount || 0;
        const discountAmount = ptr * (discount / 100);
        const pts = Math.max(0, ptr - discountAmount);
        form.initialBatch.pts = pts;
      }
    }

    setLoading(true);
    try {
      // Clean up the payload: convert empty strings to undefined/null
      const payload: CreateProductRequest = {
        sku: form.sku.trim(),
        name: form.name.trim(),
        hsnCode: form.hsnCode.trim(),
        manufacturer: form.manufacturer?.trim() || undefined,
        drugCategory: form.drugCategory?.trim() || undefined,
        drugGroup: form.drugGroup?.trim() || undefined,
        drugContent: form.drugContent?.trim() || undefined,
        unitOfMeasure: form.unitOfMeasure?.trim() || undefined,
        purchasePack: form.purchasePack?.trim() || undefined,
        stripQuantity: form.stripQuantity || undefined,
        barcode: form.barcode?.trim() || undefined,
        stripCode: form.stripCode?.trim() || undefined,
        itemCode: form.itemCode?.trim() || undefined,
        categoryId: form.categoryId || undefined,
        subcategoryId: form.subcategoryId || undefined,
        companyId: form.companyId || undefined,
        scheduleId: form.scheduleId || undefined,
        storageTypeId: form.storageTypeId || undefined,
        packSize: form.packSize?.trim() || undefined,
        gstRate: form.gstRate || 0,
        minStock: form.minStock || 0,
        maxStock: form.maxStock || undefined,
        isBatchManaged: form.isBatchManaged ?? true,
        initialBatch: form.initialBatch && form.initialBatch.batchNumber?.trim() 
          ? {
              batchNumber: form.initialBatch.batchNumber.trim(),
              expiryDate: form.initialBatch.expiryDate,
              quantity: form.initialBatch.quantity || 0,
              mrp: form.initialBatch.mrp || 0,
              ptr: form.initialBatch.ptr || 0,
              pts: form.initialBatch.pts || form.initialBatch.ptr || 0,
              freeQuantity: form.initialBatch.freeQuantity || undefined,
              discount: form.initialBatch.discount || undefined,
              godownId: form.initialBatch.godownId || undefined
            }
          : undefined
      };

      await invoke('ipc.product.create', payload);
      alert('Product created successfully!');
      // Reset form
      setForm({
        sku: '',
        name: '',
        hsnCode: '',
        manufacturer: '',
        drugCategory: '',
        drugGroup: '',
        drugContent: '',
        unitOfMeasure: '',
        purchasePack: '',
        stripQuantity: undefined,
        barcode: '',
        stripCode: '',
        itemCode: '',
        categoryId: undefined,
        subcategoryId: undefined,
        companyId: undefined,
        scheduleId: undefined,
        storageTypeId: undefined,
        packSize: '',
        gstRate: 0,
        minStock: 0,
        maxStock: undefined,
        isBatchManaged: true,
        initialBatch: undefined
      });
    } catch (error) {
      console.error('Error creating product:', error);
      alert(error instanceof Error ? error.message : 'Failed to create product');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="panel">
      <header className="panel__header">
        <div>
          <h2>Create Product</h2>
          <p>Add new product with all details and initial batch</p>
        </div>
      </header>
      <div className="panel__body">
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
            <div>
              <label>SKU *</label>
              <input
                value={form.sku}
                onChange={(e) => updateForm('sku', e.target.value)}
                required
                placeholder="Product SKU"
              />
            </div>
            <div>
              <label>Product Name *</label>
              <input
                value={form.name}
                onChange={(e) => updateForm('name', e.target.value)}
                required
                placeholder="Product Name"
              />
            </div>
            <div>
              <label>HSN Code *</label>
              <input
                value={form.hsnCode}
                onChange={(e) => updateForm('hsnCode', e.target.value)}
                required
                placeholder="HSN Code"
              />
            </div>
            <div>
              <label>Manufacturer</label>
              <input
                value={form.manufacturer || ''}
                onChange={(e) => updateForm('manufacturer', e.target.value)}
                placeholder="Manufacturer Name"
              />
            </div>
            <div>
              <label>Drug Category</label>
              <input
                value={form.drugCategory || ''}
                onChange={(e) => updateForm('drugCategory', e.target.value)}
                placeholder="Drug Category"
              />
            </div>
            <div>
              <label>Drug Group</label>
              <input
                value={form.drugGroup || ''}
                onChange={(e) => updateForm('drugGroup', e.target.value)}
                placeholder="Drug Group"
              />
            </div>
            <div>
              <label>Drug Content</label>
              <input
                value={form.drugContent || ''}
                onChange={(e) => updateForm('drugContent', e.target.value)}
                placeholder="Drug Content (optional)"
              />
            </div>
            <div>
              <label>Unit of Measure</label>
              <select
                value={form.unitOfMeasure || ''}
                onChange={(e) => updateForm('unitOfMeasure', e.target.value)}
              >
                <option value="">Select Unit</option>
                <option value="pcs">Pieces</option>
                <option value="box">Box</option>
                <option value="strip">Strip</option>
                <option value="tablet">Tablet</option>
                <option value="bottle">Bottle</option>
                <option value="ml">ML</option>
                <option value="gm">GM</option>
                <option value="kg">KG</option>
              </select>
            </div>
            <div>
              <label>Purchase Pack</label>
              <input
                value={form.purchasePack || ''}
                onChange={(e) => updateForm('purchasePack', e.target.value)}
                placeholder="Purchase Pack Unit"
              />
            </div>
            <div>
              <label>Strip Quantity (Tablets per strip)</label>
              <input
                type="number"
                value={form.stripQuantity || ''}
                onChange={(e) => updateForm('stripQuantity', e.target.value ? Number(e.target.value) : undefined)}
                placeholder="Tablets per strip"
                min={0}
              />
            </div>
            <div>
              <label>Barcode</label>
              <input
                value={form.barcode || ''}
                onChange={(e) => updateForm('barcode', e.target.value)}
                placeholder="Barcode"
              />
            </div>
            <div>
              <label>Strip Code</label>
              <input
                value={form.stripCode || ''}
                onChange={(e) => updateForm('stripCode', e.target.value)}
                placeholder="Strip Code"
              />
            </div>
            <div>
              <label>Item Code</label>
              <input
                value={form.itemCode || ''}
                onChange={(e) => updateForm('itemCode', e.target.value)}
                placeholder="Item Code"
              />
            </div>
            <div>
              <label>Category</label>
              <select
                value={form.categoryId || ''}
                onChange={(e) => updateForm('categoryId', e.target.value ? Number(e.target.value) : undefined)}
              >
                <option value="">Select Category</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label>Subcategory</label>
              <select
                value={form.subcategoryId || ''}
                onChange={(e) => updateForm('subcategoryId', e.target.value ? Number(e.target.value) : undefined)}
                disabled={!form.categoryId}
              >
                <option value="">Select Subcategory</option>
                {subcategories.map(sub => (
                  <option key={sub.id} value={sub.id}>{sub.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label>Company</label>
              <select
                value={form.companyId || ''}
                onChange={(e) => updateForm('companyId', e.target.value ? Number(e.target.value) : undefined)}
              >
                <option value="">Select Company</option>
                {companies.map(comp => (
                  <option key={comp.id} value={comp.id}>{comp.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label>Schedule</label>
              <select
                value={form.scheduleId || ''}
                onChange={(e) => updateForm('scheduleId', e.target.value ? Number(e.target.value) : undefined)}
              >
                <option value="">Select Schedule</option>
                {schedules.map(sched => (
                  <option key={sched.id} value={sched.id}>{sched.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label>Storage Type</label>
              <select
                value={form.storageTypeId || ''}
                onChange={(e) => updateForm('storageTypeId', e.target.value ? Number(e.target.value) : undefined)}
              >
                <option value="">Select Storage Type</option>
                {storageTypes.map(st => (
                  <option key={st.id} value={st.id}>{st.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label>Pack Size</label>
              <input
                value={form.packSize || ''}
                onChange={(e) => updateForm('packSize', e.target.value)}
                placeholder="Pack Size"
              />
            </div>
            <div>
              <label>GST Rate (%) *</label>
              <input
                type="number"
                value={form.gstRate}
                onChange={(e) => updateForm('gstRate', Number(e.target.value))}
                required
                min={0}
                step={0.1}
                placeholder="GST Rate"
              />
            </div>
            <div>
              <label>Min Stock</label>
              <input
                type="number"
                value={form.minStock || 0}
                onChange={(e) => updateForm('minStock', Number(e.target.value))}
                min={0}
                placeholder="Minimum Stock"
              />
            </div>
            <div>
              <label>Max Stock</label>
              <input
                type="number"
                value={form.maxStock || ''}
                onChange={(e) => updateForm('maxStock', e.target.value ? Number(e.target.value) : undefined)}
                min={0}
                placeholder="Maximum Stock"
              />
            </div>
            <div>
              <label>
                <input
                  type="checkbox"
                  checked={form.isBatchManaged}
                  onChange={(e) => updateForm('isBatchManaged', e.target.checked)}
                />
                Batch Managed
              </label>
            </div>
          </div>

          {form.isBatchManaged && (
            <div style={{ border: '1px solid #ddd', padding: '1rem', borderRadius: '4px', marginTop: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3>Initial Batch Details</h3>
                <button type="button" onClick={() => setShowBatchFields(!showBatchFields)}>
                  {showBatchFields ? 'Hide' : 'Show'}
                </button>
              </div>
              {showBatchFields && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                  <div>
                    <label>Batch Number</label>
                    <input
                      value={form.initialBatch?.batchNumber || ''}
                      onChange={(e) => updateBatchField('batchNumber', e.target.value)}
                      placeholder="Batch Number"
                    />
                  </div>
                  <div>
                    <label>Expiry Date</label>
                    <input
                      type="date"
                      value={form.initialBatch?.expiryDate || new Date().toISOString().substring(0, 10)}
                      onChange={(e) => updateBatchField('expiryDate', e.target.value)}
                    />
                  </div>
                  <div>
                    <label>Godown</label>
                    <select
                      value={form.initialBatch?.godownId || ''}
                      onChange={(e) => updateBatchField('godownId', e.target.value ? Number(e.target.value) : undefined)}
                    >
                      <option value="">Select Godown</option>
                      {godowns.map(gd => (
                        <option key={gd.id} value={gd.id}>{gd.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label>Quantity</label>
                    <input
                      type="number"
                      value={form.initialBatch?.quantity || 0}
                      onChange={(e) => updateBatchField('quantity', Number(e.target.value))}
                      min={0}
                      placeholder="Quantity"
                    />
                  </div>
                  <div>
                    <label>Free Quantity</label>
                    <input
                      type="number"
                      value={form.initialBatch?.freeQuantity || 0}
                      onChange={(e) => updateBatchField('freeQuantity', Number(e.target.value))}
                      min={0}
                      placeholder="Free Quantity"
                    />
                  </div>
                  <div>
                    <label>MRP</label>
                    <input
                      type="number"
                      value={form.initialBatch?.mrp || 0}
                      onChange={(e) => {
                        updateBatchField('mrp', Number(e.target.value));
                        setTimeout(calculateBatchValues, 0);
                      }}
                      min={0}
                      step={0.01}
                      placeholder="MRP"
                    />
                  </div>
                  <div>
                    <label>PTR (Purchase Rate)</label>
                    <input
                      type="number"
                      value={form.initialBatch?.ptr || 0}
                      onChange={(e) => {
                        updateBatchField('ptr', Number(e.target.value));
                        setTimeout(calculateBatchValues, 0);
                      }}
                      min={0}
                      step={0.01}
                      placeholder="PTR"
                    />
                  </div>
                  <div>
                    <label>Discount (%)</label>
                    <input
                      type="number"
                      value={form.initialBatch?.discount || 0}
                      onChange={(e) => {
                        updateBatchField('discount', Number(e.target.value));
                        setTimeout(calculateBatchValues, 0);
                      }}
                      min={0}
                      max={100}
                      step={0.01}
                      placeholder="Discount %"
                    />
                  </div>
                  <div>
                    <label>PTS (After Discount)</label>
                    <input
                      type="number"
                      value={form.initialBatch?.pts || 0}
                      readOnly
                      placeholder="Auto-calculated"
                      style={{ backgroundColor: '#f5f5f5' }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
            <button type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create Product'}
            </button>
            <button type="button" onClick={() => window.location.reload()}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </section>
  );
};

export default ProductCreationPanel;

