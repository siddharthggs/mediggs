// FILE: src/components/dashboard/BillingEntryPanel.tsx
/// ANCHOR: BillingEntryPanel
import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type {
  CreateBillRequest,
  BillDTO,
  BillLineInput,
  CustomerDTO,
  SupplierDTO,
  ProductDTO,
  BillTemplateDTO
} from '@shared/ipc';
import { invoke } from '../../api/ipcClient';
import { safeInvoke } from '../../utils/safeInvoke';
import { useToast } from '../../utils/toast';
import { forceRecoverUI } from '../../utils/forceRecover';
import { numberToWords } from '../../utils/numberToWords';
import { useCompanyInfo } from '../../hooks/useCompanyInfo';
// TemplateSelector removed - using DB templates now
import './BillingEntryPanel.css';

interface MR {
  id: number;
  name: string;
  code?: string;
}

interface Doctor {
  id: number;
  name: string;
  code?: string;
}

interface BillingFormState {
  billType: 'SALES' | 'PURCHASE';
  billingType: 'CASH' | 'CREDIT' | 'CHALLAN';
  billDate: string;
  invoiceNumber?: string;
  dueDate?: string;
  customerId?: number;
  supplierId?: number;
  customerName?: string;
  customerAddress?: string;
  customerGstin?: string;
  customerPhone?: string;
  customerDlNo?: string;
  customerDlNo2?: string;
  customerPanNo?: string;
  customerStateCode?: string;
  customerState?: string;
  mrId?: number;
  doctorId?: number;
  challanNumber?: string;
  orderNumber?: string;
  remarks?: string;
  isOriginal?: boolean;
}

interface BillingLineState {
  productId: number;
  batchId?: number;
  quantity: number;
  freeQuantity: number;
  soldInStrips: boolean;
  stripQuantity?: number;
  rate: number;
  discountPercent: number;
  taxPercent: number;
  hsn?: string;
  mfg?: string;
  pack?: string;
  location?: string;
}


const createEmptyLine = (): BillingLineState => ({
  productId: 0,
  batchId: undefined,
  quantity: 1,
  freeQuantity: 0,
  soldInStrips: false,
  stripQuantity: undefined,
  rate: 0,
  discountPercent: 0,
  taxPercent: 0,
  hsn: '',
  mfg: '',
  pack: '',
  location: ''
});

const BillingEntryPanel = () => {
  const navigate = useNavigate();
  const { companyInfo } = useCompanyInfo();
  const { showError, showSuccess, showWarning, showInfo } = useToast();
  const [products, setProducts] = useState<ProductDTO[]>([]);
  const [customers, setCustomers] = useState<CustomerDTO[]>([]);
  const [suppliers, setSuppliers] = useState<SupplierDTO[]>([]);
  const [mrs, setMRs] = useState<MR[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [recentBills, setRecentBills] = useState<BillDTO[]>([]);
  const [templates, setTemplates] = useState<BillTemplateDTO[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | undefined>(undefined);

  const [form, setForm] = useState<BillingFormState>({
    billType: 'SALES',
    billingType: 'CASH',
    billDate: new Date().toISOString().substring(0, 10),
    invoiceNumber: '',
    dueDate: '',
    isOriginal: true
  });

  const [lines, setLines] = useState<BillingLineState[]>([createEmptyLine()]);
  const [productSearch, setProductSearch] = useState<string[]>(['']);
  const [loading, setLoading] = useState(false);

  const loadMasters = async () => {
    try {
      // FIX: Use safeInvoke to prevent UI freezing on errors
      const [productResponse, customerList, supplierList, mrList, doctorList, billsResult, templateList] = await Promise.all([
        safeInvoke('ipc.product.list', { page: 1, pageSize: 1000 }),
        safeInvoke('ipc.customer.list', undefined),
        safeInvoke('ipc.supplier.list', undefined),
        safeInvoke('ipc.mr.list', undefined),
        safeInvoke('ipc.doctor.list', undefined),
        safeInvoke('ipc.bill.list', { page: 1, pageSize: 20 }),
        safeInvoke('ipc.billTemplate.list', undefined)
      ]);

      // FIX: Handle responses safely - check for errors
      if (productResponse.success && productResponse.data) {
        const productList = 'products' in productResponse.data ? productResponse.data.products : productResponse.data;
        setProducts(Array.isArray(productList) ? productList : []);
      }
      if (customerList.success && customerList.data) {
        setCustomers(customerList.data);
      }
      if (supplierList.success && supplierList.data) {
        setSuppliers(supplierList.data);
      }
      if (mrList.success && mrList.data) {
        setMRs(mrList.data);
      }
      if (doctorList.success && doctorList.data) {
        setDoctors(doctorList.data);
      }
      if (billsResult.success && billsResult.data && 'bills' in billsResult.data) {
        setRecentBills(billsResult.data.bills);
      }
      
      const templateArray = templateList.success && templateList.data && Array.isArray(templateList.data) 
        ? templateList.data 
        : [];
      setTemplates(templateArray);
      
      // Find default template, or fallback to "Original Template", or first template
      let defaultTemplate = templateArray.find((t: BillTemplateDTO) => t.isDefault);
      if (!defaultTemplate) {
        defaultTemplate = templateArray.find((t: BillTemplateDTO) => t.name === 'Original Template');
      }
      if (!defaultTemplate && templateArray.length > 0) {
        defaultTemplate = templateArray[0];
      }
      
      // Check localStorage for previously selected template
      const savedTemplateId = localStorage.getItem('billing:selectedTemplateId');
      if (savedTemplateId) {
        const savedId = Number(savedTemplateId);
        const savedTemplate = templateArray.find((t: BillTemplateDTO) => t.id === savedId);
        if (savedTemplate) {
          setSelectedTemplateId(savedId);
        } else if (defaultTemplate) {
          setSelectedTemplateId(defaultTemplate.id);
        }
      } else if (defaultTemplate) {
        setSelectedTemplateId(defaultTemplate.id);
      }
    } catch (error) {
      console.error('Error loading masters:', error);
      showError('Failed to load billing data. Please try again.');
    }
  };

  useEffect(() => {
    loadMasters().catch(console.error);
  }, []);

  const updateLine = (index: number, patch: Partial<BillingLineState>) => {
    setLines(prev => prev.map((line, i) => (i === index ? { ...line, ...patch } : line)));
  };

  const handleProductSearch = async (index: number, query: string) => {
    setProductSearch(prev => {
      const next = [...prev];
      next[index] = query;
      return next;
    });

    if (query.length < 2) return;

    try {
      const result = await invoke('ipc.search.barcode', { code: query });
        if (result.found && result.product) {
          const searchProduct = result.product;
          // Find full product details from products array
          const fullProduct = products.find(p => p.id === searchProduct.id) || searchProduct;
          updateLine(index, {
            productId: searchProduct.id,
            taxPercent: searchProduct.gstRate,
            stripQuantity: searchProduct.stripQuantity ?? undefined,
            hsn: 'hsnCode' in fullProduct ? (fullProduct.hsnCode || '') : '',
            mfg: searchProduct.manufacturer || '',
            pack: 'packSize' in fullProduct ? (fullProduct.packSize || '') : ''
          });

        if (result.batch) {
          updateLine(index, {
            batchId: result.batch.id,
            rate: result.batch.ptr || result.batch.mrp
          });
        } else if (searchProduct.batches && searchProduct.batches.length === 1) {
          const batch = searchProduct.batches[0];
          updateLine(index, {
            batchId: batch.id,
            rate: batch.ptr || batch.mrp
          });
        }
        return;
      }
    } catch {
      // ignore and fallback to local search
    }

    const product = products.find(p =>
      p.name.toLowerCase().includes(query.toLowerCase()) ||
      p.sku.toLowerCase().includes(query.toLowerCase()) ||
      p.manufacturer?.toLowerCase().includes(query.toLowerCase())
    );

    if (product) {
      updateLine(index, {
        productId: product.id,
        taxPercent: product.gstRate,
        stripQuantity: product.stripQuantity ?? undefined,
        hsn: product.hsnCode || '',
        mfg: product.manufacturer || '',
        pack: product.packSize || ''
      });
      if (product.batches && product.batches.length === 1) {
        const batch = product.batches[0];
        updateLine(index, {
          batchId: batch.id,
          rate: batch.ptr || batch.mrp
        });
      }
    }
  };

  const handleProductSelect = async (index: number, productId: number) => {
    if (productId <= 0) {
      updateLine(index, { productId: 0, batchId: undefined });
      return;
    }
    
    try {
      // FIX: Use safeInvoke - never throws
      const result = await safeInvoke('ipc.product.get', { id: productId });
      
      if (!result.success || !result.data) {
        showError(result.error || 'Failed to load product details');
        updateLine(index, { productId: 0, batchId: undefined });
        return;
      }
      
      const product = result.data;
      
      updateLine(index, {
        productId: product.id,
        taxPercent: product.gstRate,
        stripQuantity: product.stripQuantity ?? undefined,
        hsn: product.hsnCode || '',
        mfg: product.manufacturer || '',
        pack: product.packSize || ''
      });
      
      // Auto-select first FEFO batch (earliest expiry, non-expired)
      if (product.batches && product.batches.length > 0) {
        const fefoBatch = product.batches[0]; // Already sorted by expiry (FEFO)
        updateLine(index, {
          batchId: fefoBatch.id,
          rate: fefoBatch.ptr || fefoBatch.mrp
        });
      } else if (product.isBatchManaged) {
        // No batches available - warn user (non-blocking)
        showWarning(`No available batches for ${product.name}. Please check stock.`);
        updateLine(index, { batchId: undefined });
      }
    } catch (error) {
      // FIX: Catch any unexpected errors
      console.error('Error loading product details:', error);
      showError(error instanceof Error ? error.message : 'Failed to load product details');
      updateLine(index, { productId: 0, batchId: undefined });
    }
  };

  const addLine = () => {
    setLines(prev => [...prev, createEmptyLine()]);
    setProductSearch(prev => [...prev, '']);
  };

  const removeLine = (index: number) => {
    if (lines.length <= 1) return;
    setLines(prev => prev.filter((_, i) => i !== index));
    setProductSearch(prev => prev.filter((_, i) => i !== index));
  };

  const totals = useMemo(() => {
    let grossAmount = 0;
    let totalDiscount = 0;
    let taxableAmount = 0;
    let totalTax = 0;
    let sgst = 0;
    let cgst = 0;

    lines.forEach(line => {
      if (!line.productId || !line.quantity || !line.rate) return;
      const base = line.rate * line.quantity;
      const discount = base * (line.discountPercent / 100);
      const taxable = base - discount;
      const tax = taxable * (line.taxPercent / 100);
      
      grossAmount += base;
      totalDiscount += discount;
      taxableAmount += taxable;
      totalTax += tax;
      
      // Split GST into SGST and CGST (assuming intra-state)
      const halfTax = tax / 2;
      sgst += halfTax;
      cgst += halfTax;
    });

    const totalBeforeRound = taxableAmount + totalTax;
    const roundOff = Math.round(totalBeforeRound) - totalBeforeRound;
    const grandTotal = totalBeforeRound + roundOff;

    return { 
      grossAmount, 
      totalDiscount, 
      taxableAmount, 
      totalTax, 
      sgst, 
      cgst, 
      roundOff, 
      grandTotal 
    };
  }, [lines]);

  const totalQuantity = useMemo(() => {
    return lines.reduce((sum, line) => sum + (line.quantity || 0), 0);
  }, [lines]);

  const totalItems = useMemo(() => {
    return lines.filter(l => l.productId > 0 && l.quantity > 0 && l.rate > 0).length;
  }, [lines]);

  const canSubmit = useMemo(() => {
    if (form.billType === 'SALES' && !form.customerId) return false;
    if (form.billType === 'PURCHASE' && !form.supplierId) return false;
    return lines.some(l => l.productId > 0 && l.quantity > 0 && l.rate > 0);
  }, [form, lines]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>, finalize: boolean) => {
    event.preventDefault();
    
    // FIX: Local validation - show error but don't freeze UI
    if (!canSubmit) {
      showError('Please fill in all required fields and add at least one product line');
      return;
    }

    setLoading(true);
    try {
      const billLines: BillLineInput[] = lines
        // Only send filled rows
        .filter(l => l.productId > 0 && l.quantity > 0 && l.rate > 0)
        .map((line, index) => ({
          lineNumber: index + 1,
          productId: line.productId,
          batchId: line.batchId && line.batchId > 0 ? line.batchId : undefined, // Only send valid batch IDs
          quantity: line.quantity,
          freeQuantity: line.freeQuantity || 0,
          soldInStrips: line.soldInStrips,
          stripQuantity: line.stripQuantity,
          rate: line.rate,
          discountPercent: line.discountPercent || 0,
          taxPercent: line.taxPercent
        }));

      const payload: CreateBillRequest = {
        billType: form.billType,
        billDate: form.billDate,
        dueDate: form.dueDate || undefined,
        billingType: form.billType === 'SALES' ? form.billingType : undefined,
        customerId: form.billType === 'SALES' ? form.customerId : undefined,
        supplierId: form.billType === 'PURCHASE' ? form.supplierId : undefined,
        customerName: form.billType === 'SALES' ? form.customerName : undefined,
        customerAddress: form.billType === 'SALES' ? form.customerAddress : undefined,
        customerGstin: form.billType === 'SALES' ? form.customerGstin : undefined,
        customerPhone: form.billType === 'SALES' ? form.customerPhone : undefined,
        mrId: form.mrId,
        doctorId: form.doctorId,
        challanNumber: form.challanNumber || undefined,
        orderNumber: form.orderNumber || undefined,
        remarks: form.remarks || undefined,
        templateId: selectedTemplateId,
        lines: billLines
      };

      // FIX: Use safeInvoke - never throws
      const billResult = await safeInvoke('ipc.bill.create', payload);
      if (!billResult.success) {
        showError(billResult.error || 'Failed to save bill');
        // FIX: Keep form editable - don't reset on error
        return;
      }
      
      const bill = billResult.data!;
      
      if (finalize) {
        const finalizeResult = await safeInvoke('ipc.bill.finalize', { id: bill.id });
        if (!finalizeResult.success) {
          showError(finalizeResult.error || 'Bill created but finalization failed');
          // Bill is saved as draft - user can finalize later
          await loadMasters();
          return;
        }
      }

      // Only reset form on success
      showSuccess(finalize ? 'Bill created and finalized successfully!' : 'Draft bill saved successfully!');
      setForm({
        billType: form.billType,
        billingType: form.billingType,
        billDate: new Date().toISOString().substring(0, 10),
        invoiceNumber: '',
        dueDate: ''
      });
      setLines([createEmptyLine()]);
      setProductSearch(['']);

      await loadMasters();
      if (finalize && bill.id) {
        localStorage.setItem('lastBillId', String(bill.id));
      }
    } catch (error) {
      // FIX: Catch any unexpected errors
      console.error('Unexpected error in handleSubmit:', error);
      showError(error instanceof Error ? error.message : 'Failed to save bill');
      // FIX: Immediately recover UI to prevent input lock
      forceRecoverUI();
      // FIX: Keep form editable - don't reset on error
    } finally {
      // FIX: Always release loading state
      setLoading(false);
      // FIX: Ensure UI is recovered even if error occurred
      forceRecoverUI();
    }
  };

  const handlePrint = async () => {
    try {
      setLoading(true);
      // Get the last saved bill ID or create a draft first
      let billId: number | null = null;
      const lastBillId = localStorage.getItem('lastBillId');
      
      if (lastBillId) {
        billId = Number(lastBillId);
      } else {
        // Create a temporary draft bill for printing
        if (!canSubmit) {
          alert('Please fill in at least one product line before printing');
          setLoading(false);
          return;
        }
        
        const billLines: BillLineInput[] = lines
          .filter(l => l.productId > 0 && l.quantity > 0 && l.rate > 0)
          .map((line, index) => ({
            lineNumber: index + 1,
            productId: line.productId,
            batchId: line.batchId,
            quantity: line.quantity,
            freeQuantity: line.freeQuantity || 0,
            soldInStrips: line.soldInStrips,
            stripQuantity: line.stripQuantity,
            rate: line.rate,
            discountPercent: line.discountPercent || 0,
            taxPercent: line.taxPercent
          }));

        const payload: CreateBillRequest = {
          billType: form.billType,
          billDate: form.billDate,
          dueDate: form.dueDate || undefined,
          billingType: form.billType === 'SALES' ? form.billingType : undefined,
          customerId: form.billType === 'SALES' ? form.customerId : undefined,
          supplierId: form.billType === 'PURCHASE' ? form.supplierId : undefined,
          customerName: form.billType === 'SALES' ? form.customerName : undefined,
          customerAddress: form.billType === 'SALES' ? form.customerAddress : undefined,
          customerGstin: form.billType === 'SALES' ? form.customerGstin : undefined,
          customerPhone: form.billType === 'SALES' ? form.customerPhone : undefined,
          mrId: form.mrId,
          doctorId: form.doctorId,
          challanNumber: form.challanNumber || undefined,
          orderNumber: form.orderNumber || undefined,
          remarks: form.remarks || undefined,
          templateId: selectedTemplateId,
          lines: billLines
        };

        // FIX: Use safeInvoke - never throws
        const billResult = await safeInvoke('ipc.bill.create', payload);
        if (!billResult.success) {
          showError(billResult.error || 'Failed to create draft bill for printing');
          return;
        }
        billId = billResult.data!.id;
        localStorage.setItem('lastBillId', String(billId));
      }

      // FIX: Validate template exists before printing
      const templateIdToUse = selectedTemplateId || undefined;
      if (templateIdToUse && !templates.find(t => t.id === templateIdToUse)) {
        showWarning('Selected template not found, using default');
      }

      // FIX: Use safeInvoke for print - fail gracefully
      const printResult = await safeInvoke('ipc.bill.print', { 
        id: billId,
        templateId: templateIdToUse 
      });
      
      if (!printResult.success) {
        // FIX: Fallback to preview if print fails
        showError(printResult.error || 'Failed to print. Opening preview instead...');
        // Try preview as fallback
        const previewResult = await safeInvoke('ipc.bill.preview', {
          id: billId,
          templateId: templateIdToUse
        });
        if (previewResult.success && previewResult.data) {
          const previewWindow = window.open('', '_blank');
          if (previewWindow) {
            previewWindow.document.write(previewResult.data.html);
            previewWindow.document.close();
            previewWindow.focus();
            showInfo('Preview opened. You can print from the preview window.');
          }
        }
      } else {
        showSuccess('Bill printed successfully!');
      }
    } catch (error) {
      // FIX: Catch any unexpected errors
      console.error('Print error:', error);
      showError(error instanceof Error ? error.message : 'Failed to print. Please try again.');
      forceRecoverUI();
    } finally {
      // FIX: Always release loading state
      setLoading(false);
      forceRecoverUI();
    }
  };

  const handlePreview = async () => {
    // FIX: Never block UI - always release loading state
    setLoading(true);
    try {
      // First, save as draft if not already saved
      let billId: number | null = null;
      const lastBillId = localStorage.getItem('lastBillId');
      
      if (lastBillId) {
        billId = Number(lastBillId);
      } else {
        // Create a temporary draft bill for preview
        if (!canSubmit) {
          showError('Please fill in at least one product line before previewing');
          setLoading(false);
          return;
        }
        
        const billLines: BillLineInput[] = lines
          .filter(l => l.productId > 0 && l.quantity > 0 && l.rate > 0)
          .map((line, index) => ({
            lineNumber: index + 1,
            productId: line.productId,
            batchId: line.batchId,
            quantity: line.quantity,
            freeQuantity: line.freeQuantity || 0,
            soldInStrips: line.soldInStrips,
            stripQuantity: line.stripQuantity,
            rate: line.rate,
            discountPercent: line.discountPercent || 0,
            taxPercent: line.taxPercent
          }));

        const payload: CreateBillRequest = {
          billType: form.billType,
          billDate: form.billDate,
          dueDate: form.dueDate || undefined,
          billingType: form.billType === 'SALES' ? form.billingType : undefined,
          customerId: form.billType === 'SALES' ? form.customerId : undefined,
          supplierId: form.billType === 'PURCHASE' ? form.supplierId : undefined,
          customerName: form.billType === 'SALES' ? form.customerName : undefined,
          customerAddress: form.billType === 'SALES' ? form.customerAddress : undefined,
          customerGstin: form.billType === 'SALES' ? form.customerGstin : undefined,
          customerPhone: form.billType === 'SALES' ? form.customerPhone : undefined,
          mrId: form.mrId,
          doctorId: form.doctorId,
          challanNumber: form.challanNumber || undefined,
          orderNumber: form.orderNumber || undefined,
          remarks: form.remarks || undefined,
          templateId: selectedTemplateId,
          lines: billLines
        };

        // FIX: Use safeInvoke - never throws
        const billResult = await safeInvoke('ipc.bill.create', payload);
        if (!billResult.success) {
          showError(billResult.error || 'Failed to create draft bill for preview');
          return;
        }
        billId = billResult.data!.id;
        localStorage.setItem('lastBillId', String(billId));
      }

      // Use database template system with selected template
      const templateIdToUse = selectedTemplateId || undefined;
      const result = await safeInvoke('ipc.bill.preview', { 
        id: billId,
        templateId: templateIdToUse 
      });
      
      if (!result.success) {
        showError(result.error || 'Failed to preview. Please try again.');
        return;
      }
      
      const previewWindow = window.open('', '_blank');
      if (previewWindow && result.data) {
        previewWindow.document.write(result.data.html);
        previewWindow.document.close();
        previewWindow.focus();
      } else {
        showWarning('Please allow popups to view the preview');
      }
    } catch (error) {
      // FIX: Catch any unexpected errors
      console.error('Preview error:', error);
      showError(error instanceof Error ? error.message : 'Failed to preview. Please try again.');
      forceRecoverUI();
    } finally {
      // FIX: Always release loading state
      setLoading(false);
      forceRecoverUI();
    }
  };

  const selectedCustomer = customers.find(c => c.id === form.customerId);
  const selectedSupplier = suppliers.find(s => s.id === form.supplierId);
  const selectedMR = mrs.find(m => m.id === form.mrId);
  const selectedDoctor = doctors.find(d => d.id === form.doctorId);

  const [deletingBillId, setDeletingBillId] = useState<number | null>(null);

  const handleDeleteBill = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this bill?')) return;
    
    // FIX: Set loading state to prevent UI lock
    setDeletingBillId(id);
    
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
      const result = await safeInvoke('ipc.bill.delete', { id });
      
      if (!result.success) {
        showError(result.error || 'Failed to delete bill');
        return;
      }
      
      showSuccess('Bill deleted successfully');
      await loadMasters();
    } catch (error) {
      // FIX: Catch any unexpected errors
      console.error('Delete error:', error);
      showError(error instanceof Error ? error.message : 'Failed to delete bill');
      forceRecoverUI();
    } finally {
      // FIX: Always release loading state, even on error
      setDeletingBillId(null);
      // FIX: Ensure UI is fully recovered
      forceRecoverUI();
    }
  };

  return (
    <div className="page-container">
      <div className="page-header" style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2>Billing (Ultra-Fast)</h2>
          <p>Create sales and purchase bills with invoice-style layout</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <label style={{ fontSize: '0.875rem', fontWeight: 600 }}>Template:</label>
          <select
            value={selectedTemplateId || ''}
            onChange={(e) => {
              const newTemplateId = e.target.value ? Number(e.target.value) : undefined;
              setSelectedTemplateId(newTemplateId);
              // Store in localStorage for persistence
              if (newTemplateId) {
                localStorage.setItem('billing:selectedTemplateId', String(newTemplateId));
              } else {
                localStorage.removeItem('billing:selectedTemplateId');
              }
            }}
            style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid #d1d5db' }}
          >
            <option value="">Default</option>
            {templates.map(template => (
              <option key={template.id} value={template.id}>
                {template.name} {template.isDefault && '(Default)'} - {template.templateType}
              </option>
            ))}
          </select>
        </div>
      </div>

      <form className="medical-bill" onSubmit={(e) => handleSubmit(e, true)}>
        {/* Header Section - 3 Columns in One Line */}
        <div className="medical-bill__header">
          {/* Column 1: Company Info */}
          <div className="medical-bill__store-info">
            <div className="medical-bill__store-name">{companyInfo?.companyName || 'Your Company Name'}</div>
            <div className="medical-bill__store-address">{companyInfo?.address || 'Company Address'}</div>
            <div className="medical-bill__store-contact">
              {companyInfo?.phone && `Phone: ${companyInfo.phone}`}
              {companyInfo?.email && ` | Email: ${companyInfo.email}`}
            </div>
            <div className="medical-bill__store-contact">
              {companyInfo?.gstNumber && `GSTIN: ${companyInfo.gstNumber}`}
              {companyInfo?.fssaiNumber && ` | FSSAI: ${companyInfo.fssaiNumber}`}
              {companyInfo?.dlNumber1 && ` | DL No: ${companyInfo.dlNumber1}`}
              {companyInfo?.dlNumber2 && ` / ${companyInfo.dlNumber2}`}
            </div>
          </div>

          {/* Column 2: Customer Info */}
          <div className="medical-bill__party-block">
            <div className="medical-bill__party-label">
              {form.billType === 'SALES' ? 'Bill To / Customer' : 'From / Supplier'}
            </div>
            <div className="medical-bill__party-details">
              {form.billType === 'SALES' ? (
                <>
                  <select
                    value={form.customerId || 0}
                    onChange={(e) => {
                      const customerId = Number(e.target.value) || undefined;
                      const customer = customers.find(c => c.id === customerId);
                      setForm(prev => ({
                        ...prev,
                        customerId,
                        customerName: customer?.name || '',
                        customerAddress: customer?.addressLine1 || '',
                        customerGstin: customer?.gstin || '',
                        customerPhone: customer?.phone || '',
                        customerDlNo: customer?.drugLicenseNumber || '',
                        customerDlNo2: customer?.drugLicenseNumber2 || '',
                        customerPanNo: customer?.panNumber || '',
                        customerStateCode: customer?.stateCode || '',
                        customerState: customer?.state || ''
                      }));
                    }}
                    style={{ marginBottom: '0.5rem' }}
                  >
                    <option value={0}>Select Customer</option>
                    {customers.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                  <input
                    type="text"
                    placeholder="Customer (Company Name)"
                    value={form.customerName || ''}
                    onChange={(e) => setForm(prev => ({ ...prev, customerName: e.target.value }))}
                    style={{ marginBottom: '0.25rem', fontSize: '0.875rem' }}
                  />
                  <input
                    type="text"
                    placeholder="Address"
                    value={form.customerAddress || ''}
                    onChange={(e) => setForm(prev => ({ ...prev, customerAddress: e.target.value }))}
                    style={{ marginBottom: '0.25rem', fontSize: '0.875rem' }}
                  />
                  <input
                    type="text"
                    placeholder="GST No"
                    value={form.customerGstin || ''}
                    onChange={(e) => setForm(prev => ({ ...prev, customerGstin: e.target.value }))}
                    style={{ marginBottom: '0.25rem', fontSize: '0.875rem' }}
                  />
                  <input
                    type="text"
                    placeholder="Phone"
                    value={form.customerPhone || ''}
                    onChange={(e) => setForm(prev => ({ ...prev, customerPhone: e.target.value }))}
                    style={{ marginBottom: '0.25rem', fontSize: '0.875rem' }}
                  />
                  <input
                    type="text"
                    placeholder="DL No"
                    value={form.customerDlNo || ''}
                    onChange={(e) => setForm(prev => ({ ...prev, customerDlNo: e.target.value }))}
                    style={{ marginBottom: '0.25rem', fontSize: '0.875rem' }}
                  />
                  <input
                    type="text"
                    placeholder="DL No 2"
                    value={form.customerDlNo2 || ''}
                    onChange={(e) => setForm(prev => ({ ...prev, customerDlNo2: e.target.value }))}
                    style={{ marginBottom: '0.25rem', fontSize: '0.875rem' }}
                  />
                  <input
                    type="text"
                    placeholder="PAN No"
                    value={form.customerPanNo || ''}
                    onChange={(e) => setForm(prev => ({ ...prev, customerPanNo: e.target.value }))}
                    style={{ marginBottom: '0.25rem', fontSize: '0.875rem' }}
                  />
                  <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.25rem' }}>
                    <input
                      type="text"
                      placeholder="State Code"
                      value={form.customerStateCode || ''}
                      onChange={(e) => setForm(prev => ({ ...prev, customerStateCode: e.target.value }))}
                      style={{ fontSize: '0.875rem', flex: 1 }}
                    />
                    <input
                      type="text"
                      placeholder="State Name"
                      value={form.customerState || ''}
                      onChange={(e) => setForm(prev => ({ ...prev, customerState: e.target.value }))}
                      style={{ fontSize: '0.875rem', flex: 2 }}
                    />
                  </div>
                </>
              ) : (
                <select
                  value={form.supplierId || 0}
                  onChange={(e) => setForm(prev => ({
                    ...prev,
                    supplierId: Number(e.target.value) || undefined
                  }))}
                >
                  <option value={0}>Select Supplier</option>
                  {suppliers.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {/* Column 3: Invoice Info */}
          <div className="medical-bill__invoice-meta">
            <div className="medical-bill__invoice-title">
              {form.billType === 'SALES' ? 'TAX INVOICE' : 'PURCHASE INVOICE'}
            </div>
            <div className="medical-bill__meta-row">
              <span className="medical-bill__meta-label">Invoice No:</span>
              <div className="medical-bill__meta-value">
                <input
                  type="text"
                  value={form.invoiceNumber || ''}
                  onChange={(e) => setForm(prev => ({ ...prev, invoiceNumber: e.target.value }))}
                  placeholder="Auto"
                />
              </div>
            </div>
            <div className="medical-bill__meta-row">
              <span className="medical-bill__meta-label">Inv Date:</span>
              <div className="medical-bill__meta-value">
                <input
                  type="date"
                  value={form.billDate}
                  onChange={(e) => setForm(prev => ({ ...prev, billDate: e.target.value }))}
                />
              </div>
            </div>
            <div className="medical-bill__meta-row">
              <span className="medical-bill__meta-label">Due Date:</span>
              <div className="medical-bill__meta-value">
                <input
                  type="date"
                  value={form.dueDate || ''}
                  onChange={(e) => setForm(prev => ({ ...prev, dueDate: e.target.value }))}
                />
              </div>
            </div>
            <div className="medical-bill__meta-row">
              <span className="medical-bill__meta-label">Order No:</span>
              <div className="medical-bill__meta-value">
                <input
                  type="text"
                  value={form.orderNumber || ''}
                  onChange={(e) => setForm(prev => ({ ...prev, orderNumber: e.target.value }))}
                />
              </div>
            </div>
            <div className="medical-bill__meta-row">
              <span className="medical-bill__meta-label">Challan No:</span>
              <div className="medical-bill__meta-value">
                <input
                  type="text"
                  value={form.challanNumber || ''}
                  onChange={(e) => setForm(prev => ({ ...prev, challanNumber: e.target.value }))}
                />
              </div>
            </div>
            <div className="medical-bill__meta-row">
              <span className="medical-bill__meta-label">Type:</span>
              <div className="medical-bill__meta-value">
                <select
                  value={form.isOriginal ? 'ORIGINAL' : 'COPY'}
                  onChange={(e) => setForm(prev => ({ ...prev, isOriginal: e.target.value === 'ORIGINAL' }))}
                  style={{ padding: '0.25rem', fontSize: '0.875rem' }}
                >
                  <option value="ORIGINAL">ORIGINAL</option>
                  <option value="COPY">COPY</option>
                </select>
              </div>
            </div>
          </div>
        </div>
            
        {/* Product Table */}
        <table className="medical-bill__products-table">
          <thead>
            <tr>
              <th className="col-sr">SR</th>
              <th className="col-hsn">HSN</th>
              <th className="col-loc">LOC</th>
              <th className="col-mfg">MFG</th>
              <th className="col-pack">PACK</th>
              <th className="col-product">PRODUCT / DESCRIPTION</th>
              <th className="col-batch">BATCH</th>
              <th className="col-exp">EXP</th>
              <th className="col-qty">QTY</th>
              <th className="col-free">FREE</th>
              <th className="col-disc">DISC%</th>
              <th className="col-gst">GST%</th>
              <th className="col-rate">RATE</th>
              <th className="col-amount">AMOUNT</th>
              <th className="col-actions"></th>
            </tr>
          </thead>
          <tbody>
            {lines.map((line, index) => {
              const product = products.find(p => p.id === line.productId);
              const batches = product?.batches ?? [];
              const selectedBatch = batches.find(b => b.id === line.batchId);
              const base = line.rate * line.quantity;
              const discount = base * (line.discountPercent / 100);
              const taxable = base - discount;
              const tax = taxable * (line.taxPercent / 100);
              const lineTotal = taxable + tax;

              return (
                <tr key={index}>
                  <td className="col-sr">{index + 1}</td>
                  <td className="col-hsn">
                    <input
                      type="text"
                      value={line.hsn || ''}
                      onChange={(e) => updateLine(index, { hsn: e.target.value })}
                      placeholder="HSN"
                    />
                  </td>
                  <td className="col-loc">
                    <input
                      type="text"
                      value={line.location || ''}
                      onChange={(e) => updateLine(index, { location: e.target.value })}
                      placeholder="LOC"
                    />
                  </td>
                  <td className="col-mfg">
                    <input
                      type="text"
                      value={line.mfg || ''}
                      onChange={(e) => updateLine(index, { mfg: e.target.value })}
                      placeholder="MFG"
                    />
                  </td>
                  <td className="col-pack">
                    <input
                      type="text"
                      value={line.pack || ''}
                      onChange={(e) => updateLine(index, { pack: e.target.value })}
                      placeholder="PACK"
                    />
                  </td>
                  <td className="col-product">
                    <input
                      type="text"
                      className="medical-bill__product-search"
                      placeholder="Search by name/code/barcode"
                      value={productSearch[index]}
                      onChange={(e) => handleProductSearch(index, e.target.value)}
                    />
                    <select
                      value={line.productId}
                      onChange={(e) => handleProductSelect(index, Number(e.target.value))}
                    >
                      <option value={0}>Select Product</option>
                      {products.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({'packSize' in p && p.packSize ? p.packSize : p.sku})
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="col-batch">
                    <select
                      value={line.batchId || 0}
                      onChange={(e) => {
                        const batchId = Number(e.target.value) || undefined;
                        const batch = batches.find(b => b.id === batchId);
                        updateLine(index, {
                          batchId,
                          rate: batch ? batch.ptr || batch.mrp : line.rate
                        });
                      }}
                    >
                      <option value={0}>Auto</option>
                      {batches.map(b => (
                        <option key={b.id} value={b.id}>
                          {b.batchNumber}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="col-exp">
                    <input
                      type="text"
                      value={selectedBatch ? selectedBatch.expiryDate.substring(0, 7) : ''}
                      readOnly
                      style={{ textAlign: 'center' }}
                    />
                  </td>
                  <td className="col-qty">
                    <input
                      type="number"
                      min={1}
                      value={line.quantity}
                      onChange={(e) => updateLine(index, { quantity: Number(e.target.value) || 0 })}
                    />
                  </td>
                  <td className="col-free">
                    <input
                      type="number"
                      min={0}
                      value={line.freeQuantity}
                      onChange={(e) => updateLine(index, { freeQuantity: Number(e.target.value) || 0 })}
                    />
                  </td>
                  <td className="col-disc">
                    <input
                      type="number"
                      min={0}
                      max={100}
                      step={0.1}
                      value={line.discountPercent}
                      onChange={(e) => updateLine(index, { discountPercent: Number(e.target.value) || 0 })}
                    />
                  </td>
                  <td className="col-gst">
                    <input
                      type="number"
                      min={0}
                      max={28}
                      step={0.1}
                      value={line.taxPercent}
                      onChange={(e) => updateLine(index, { taxPercent: Number(e.target.value) || 0 })}
                    />
                  </td>
                  <td className="col-rate">
                    <input
                      type="number"
                      min={0}
                      step={0.01}
                      value={line.rate}
                      onChange={(e) => updateLine(index, { rate: Number(e.target.value) || 0 })}
                    />
                  </td>
                  <td className="col-amount">₹{lineTotal.toFixed(2)}</td>
                  <td className="col-actions">
                    <button
                      type="button"
                      onClick={() => removeLine(index)}
                      disabled={lines.length <= 1}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px' }}
                    >
                      ✕
                    </button>
                  </td>
                </tr>
              );
            })}
            <tr>
              <td colSpan={15} style={{ padding: '4px', textAlign: 'center' }}>
                <button type="button" onClick={addLine} style={{ background: 'none', border: '1px dashed #999', padding: '4px 12px', cursor: 'pointer' }}>
                  + Add Line
                </button>
              </td>
            </tr>
          </tbody>
        </table>

        {/* Footer: Summary and Payment */}
        <div className="medical-bill__footer">
          <div className="medical-bill__summary">
            <div className="medical-bill__summary-row">
              <span className="medical-bill__summary-label">Gross Amount:</span>
              <span className="medical-bill__summary-value">₹{totals.grossAmount.toFixed(2)}</span>
            </div>
            <div className="medical-bill__summary-row">
              <span className="medical-bill__summary-label">Discount:</span>
              <span className="medical-bill__summary-value">₹{totals.totalDiscount.toFixed(2)}</span>
            </div>
            <div className="medical-bill__summary-row">
              <span className="medical-bill__summary-label">Taxable Amount:</span>
              <span className="medical-bill__summary-value">₹{totals.taxableAmount.toFixed(2)}</span>
            </div>
            <div className="medical-bill__summary-row">
              <span className="medical-bill__summary-label">SGST:</span>
              <span className="medical-bill__summary-value">₹{totals.sgst.toFixed(2)}</span>
            </div>
            <div className="medical-bill__summary-row">
              <span className="medical-bill__summary-label">CGST:</span>
              <span className="medical-bill__summary-value">₹{totals.cgst.toFixed(2)}</span>
            </div>
            <div className="medical-bill__summary-row">
              <span className="medical-bill__summary-label">Total GST:</span>
              <span className="medical-bill__summary-value">₹{totals.totalTax.toFixed(2)}</span>
            </div>
            <div className="medical-bill__summary-row medical-bill__summary-row--total">
              <span className="medical-bill__summary-label">Round Off:</span>
              <span className="medical-bill__summary-value">₹{totals.roundOff.toFixed(2)}</span>
            </div>
            <div className="medical-bill__summary-row medical-bill__summary-row--grand">
              <span className="medical-bill__summary-label">TOTAL AMOUNT:</span>
              <span className="medical-bill__summary-value">₹{totals.grandTotal.toFixed(2)}</span>
            </div>
            <div className="medical-bill__amount-words">
              Amount in Words: {numberToWords(totals.grandTotal)}
            </div>
          </div>

          <div className="medical-bill__payment">
            <div className="medical-bill__payment-row">
              <span className="medical-bill__payment-label">Total Qty:</span>
              <span className="medical-bill__payment-value">{totalQuantity}</span>
            </div>
            <div className="medical-bill__payment-row">
              <span className="medical-bill__payment-label">Total Items:</span>
              <span className="medical-bill__payment-value">{totalItems}</span>
            </div>
            <div className="medical-bill__payment-row medical-bill__summary-row--grand">
              <span className="medical-bill__payment-label">Net Payable:</span>
              <span className="medical-bill__payment-value">₹{totals.grandTotal.toFixed(2)}</span>
            </div>
            <div className="medical-bill__signature-area">
              <div className="medical-bill__signature-box">
                <div className="medical-bill__signature-label">Customer Signature</div>
              </div>
              <div className="medical-bill__signature-box">
                <div className="medical-bill__signature-label">Authorized Signatory</div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="medical-bill__actions" style={{ display: 'flex', gap: 'var(--spacing-md)', alignItems: 'center', flexWrap: 'wrap' }}>
          <button type="button" onClick={handlePreview} className="btn btn-outline">Preview</button>
          <button type="button" onClick={handlePrint} className="btn btn-outline">Print</button>
          <button
            type="button"
            onClick={(e) => handleSubmit(e as any, false)}
            disabled={loading || !canSubmit}
            className="btn btn-outline"
          >
            {loading ? 'Saving...' : 'Save Draft'}
          </button>
          <button type="submit" disabled={loading || !canSubmit} className="btn btn-primary">
            {loading ? 'Finalizing...' : 'Finalize & Save'}
          </button>
        </div>
      </form>

      {/* Recent Bills */}
      {recentBills.length > 0 && (
        <div className="card" style={{ marginTop: 'var(--spacing-2xl)' }}>
          <div className="card-header">
            <h4 className="card-title">Recent Bills</h4>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            <table className="table table--compact">
              <thead>
                <tr>
                  <th>No</th>
                  <th>Date</th>
                  <th>Type</th>
                  <th>Party</th>
                  <th>Status</th>
                  <th>Total</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {recentBills.map(bill => (
                  <tr 
                    key={bill.id} 
                    style={{ cursor: 'pointer' }} 
                    onClick={() => navigate(`/billing/view/${bill.id}`)}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--color-bg-secondary)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    <td>{bill.billNumber}</td>
                    <td>{bill.billDate.substring(0, 10)}</td>
                    <td>
                      <span className={`badge ${bill.billType === 'SALES' ? 'badge-success' : 'badge-primary'}`}>
                        {bill.billType}
                      </span>
                    </td>
                    <td>{bill.customerName || bill.supplierName}</td>
                    <td>
                      <span className={`badge ${bill.status === 'FINALIZED' ? 'badge-success' : 'badge-warning'}`}>
                        {bill.status}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 600 }}>₹{bill.totalAmount.toFixed(2)}</td>
                    <td
                      style={{ textAlign: 'right' }}
                      onClick={e => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        className="btn btn-danger btn-xs"
                        onClick={() => handleDeleteBill(bill.id)}
                        disabled={deletingBillId === bill.id}
                      >
                        {deletingBillId === bill.id ? 'Deleting...' : 'Delete'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default BillingEntryPanel;
