// FILE: src/components/dashboard/PaymentManagementPanel.tsx
/// ANCHOR: PaymentManagementPanel
import { FormEvent, useEffect, useState } from 'react';
import type { PaymentDTO, CreatePaymentRequest } from '@shared/ipc';
import { invoke } from '../../api/ipcClient';

const PaymentManagementPanel = () => {
  const [payments, setPayments] = useState<PaymentDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<CreatePaymentRequest>({
    salesInvoiceId: undefined,
    purchaseInvoiceId: undefined,
    amount: 0,
    paymentDate: new Date().toISOString().substring(0, 10),
    paymentMethod: 'CASH',
    referenceNumber: '',
    chequeNumber: '',
    bank: '',
    chequeIssueDate: undefined,
    notes: ''
  });
  const [showForm, setShowForm] = useState(false);
  const [selectedInvoiceType, setSelectedInvoiceType] = useState<'sales' | 'purchase'>('sales');
  const [invoiceId, setInvoiceId] = useState<number>(0);

  const loadPayments = async () => {
    setLoading(true);
    try {
      const result = await invoke('ipc.payment.list', {
        ...(selectedInvoiceType === 'sales' && invoiceId > 0 ? { salesInvoiceId: invoiceId } : {}),
        ...(selectedInvoiceType === 'purchase' && invoiceId > 0 ? { purchaseInvoiceId: invoiceId } : {})
      });
      setPayments(result);
    } catch (error) {
      console.error('Error loading payments:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPayments();
  }, [invoiceId, selectedInvoiceType]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.amount || form.amount <= 0) {
      alert('Payment amount must be greater than 0');
      return;
    }
    setLoading(true);
    try {
      await invoke('ipc.payment.create', {
        ...form,
        ...(selectedInvoiceType === 'sales' ? { salesInvoiceId: invoiceId } : { purchaseInvoiceId: invoiceId })
      });
      alert('Payment recorded successfully!');
      setForm({
        salesInvoiceId: undefined,
        purchaseInvoiceId: undefined,
        amount: 0,
        paymentDate: new Date().toISOString().substring(0, 10),
        paymentMethod: 'CASH',
        referenceNumber: '',
        chequeNumber: '',
        bank: '',
        chequeIssueDate: undefined,
        notes: ''
      });
      setShowForm(false);
      await loadPayments();
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to create payment');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkCleared = async (id: number) => {
    if (!confirm('Mark this cheque as cleared?')) return;
    try {
      await invoke('ipc.payment.markChequeCleared', { id });
      await loadPayments();
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to mark cheque as cleared');
    }
  };

  const handleMarkBounced = async (id: number) => {
    if (!confirm('Mark this cheque as bounced? This will reverse the payment impact.')) return;
    try {
      await invoke('ipc.payment.markChequeBounced', { id });
      await loadPayments();
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to mark cheque as bounced');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this payment? This will reverse the payment impact on the invoice.')) return;
    try {
      await invoke('ipc.payment.delete', { id });
      await loadPayments();
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to delete payment');
    }
  };

  return (
    <section className="panel">
      <header className="panel__header">
        <div>
          <h2>Payment Management</h2>
          <p>Record and manage payments for invoices</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <select
            value={selectedInvoiceType}
            onChange={(e) => {
              setSelectedInvoiceType(e.target.value as 'sales' | 'purchase');
              setInvoiceId(0);
            }}
          >
            <option value="sales">Sales Invoice</option>
            <option value="purchase">Purchase Invoice</option>
          </select>
          <input
            type="number"
            placeholder="Invoice ID"
            value={invoiceId || ''}
            onChange={(e) => setInvoiceId(Number(e.target.value))}
            style={{ width: '120px' }}
          />
          <button
            type="button"
            onClick={() => setShowForm(!showForm)}
            className="btn btn-secondary btn-sm"
          >
            {showForm ? 'Cancel' : 'Add Payment'}
          </button>
          <button
            type="button"
            onClick={loadPayments}
            disabled={loading}
            className="btn btn-outline btn-sm"
          >
            Refresh
          </button>
        </div>
      </header>
      <div className="panel__body">
        {showForm && (
          <form
            onSubmit={handleSubmit}
            style={{
              border: '1px solid #ddd',
              padding: '1rem',
              borderRadius: '4px',
              marginBottom: '1rem'
            }}
          >
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
              <div>
                <label>Invoice ID *</label>
                <input
                  type="number"
                  value={invoiceId || ''}
                  onChange={(e) => setInvoiceId(Number(e.target.value))}
                  required
                  min={1}
                />
              </div>
              <div>
                <label>Amount *</label>
                <input
                  type="number"
                  value={form.amount || ''}
                  onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })}
                  required
                  min={0.01}
                  step={0.01}
                />
              </div>
              <div>
                <label>Payment Date *</label>
                <input
                  type="date"
                  value={form.paymentDate}
                  onChange={(e) => setForm({ ...form, paymentDate: e.target.value })}
                  required
                />
              </div>
              <div>
                <label>Payment Method *</label>
                <select
                  value={form.paymentMethod}
                  onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}
                  required
                >
                  <option value="CASH">Cash</option>
                  <option value="CHEQUE">Cheque</option>
                  <option value="NEFT">NEFT</option>
                  <option value="UPI">UPI</option>
                  <option value="RTGS">RTGS</option>
                  <option value="BANK_TRANSFER">Bank Transfer</option>
                  <option value="CARD">Card</option>
                </select>
              </div>
              {form.paymentMethod === 'CHEQUE' && (
                <>
                  <div>
                    <label>Cheque Number</label>
                    <input
                      value={form.chequeNumber || ''}
                      onChange={(e) => setForm({ ...form, chequeNumber: e.target.value })}
                    />
                  </div>
                  <div>
                    <label>Bank</label>
                    <input
                      value={form.bank || ''}
                      onChange={(e) => setForm({ ...form, bank: e.target.value })}
                    />
                  </div>
                  <div>
                    <label>Cheque Issue Date</label>
                    <input
                      type="date"
                      value={form.chequeIssueDate || ''}
                      onChange={(e) => setForm({ ...form, chequeIssueDate: e.target.value || undefined })}
                    />
                  </div>
                </>
              )}
              <div>
                <label>Reference Number</label>
                <input
                  value={form.referenceNumber || ''}
                  onChange={(e) => setForm({ ...form, referenceNumber: e.target.value })}
                  placeholder="Transaction/Reference number"
                />
              </div>
              <div>
                <label>Notes</label>
                <textarea
                  value={form.notes || ''}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  rows={2}
                />
              </div>
            </div>
            <div
              style={{
                marginTop: '1rem',
                display: 'flex',
                gap: '0.5rem'
              }}
            >
              <button
                type="submit"
                disabled={loading || !invoiceId}
                className="btn btn-primary btn-sm"
              >
                {loading ? 'Saving...' : 'Record Payment'}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="btn btn-outline btn-sm"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        <table className="table table--compact">
          <thead>
            <tr>
              <th>Date</th>
              <th>Amount</th>
              <th>Method</th>
              <th>Cheque Details</th>
              <th>Status</th>
              <th>Reference</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {payments.length === 0 ? (
              <tr>
                <td colSpan={7} className="empty">
                  {loading ? 'Loading...' : 'No payments found'}
                </td>
              </tr>
            ) : (
              payments.map((payment) => (
                <tr key={payment.id}>
                  <td>{new Date(payment.paymentDate).toLocaleDateString()}</td>
                  <td>₹{payment.amount.toFixed(2)}</td>
                  <td>{payment.paymentMethod}</td>
                  <td>
                    {payment.paymentMethod === 'CHEQUE' && (
                      <div style={{ fontSize: '0.9em' }}>
                        {payment.chequeNumber && <div>Cheque: {payment.chequeNumber}</div>}
                        {payment.bank && <div>Bank: {payment.bank}</div>}
                        {payment.isCleared === true && <div style={{ color: 'green' }}>✓ Cleared</div>}
                        {payment.isCleared === false && <div style={{ color: 'red' }}>✗ Bounced</div>}
                        {payment.isCleared === null && <div style={{ color: 'orange' }}>Pending</div>}
                      </div>
                    )}
                  </td>
                  <td>
                    {payment.paymentMethod === 'CHEQUE' ? (
                      payment.isCleared === true ? 'Cleared' :
                      payment.isCleared === false ? 'Bounced' : 'Pending'
                    ) : '-'}
                  </td>
                  <td>{payment.referenceNumber || '-'}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.25rem' }}>
                      {payment.paymentMethod === 'CHEQUE' && payment.isCleared === null && (
                        <>
                          <button
                            onClick={() => handleMarkCleared(payment.id)}
                            style={{ fontSize: '0.85em', padding: '0.25rem 0.5rem' }}
                          >
                            Mark Cleared
                          </button>
                          <button
                            onClick={() => handleMarkBounced(payment.id)}
                            style={{ fontSize: '0.85em', padding: '0.25rem 0.5rem', backgroundColor: '#dc2626', color: 'white' }}
                          >
                            Mark Bounced
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => handleDelete(payment.id)}
                        style={{ fontSize: '0.85em', padding: '0.25rem 0.5rem', backgroundColor: '#dc2626', color: 'white' }}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
};

export default PaymentManagementPanel;

