// FILE: src/components/dashboard/CreditNotePanel.tsx
/// ANCHOR: CreditNotePanel
import { FormEvent, useEffect, useState } from 'react';
import type {
  CreateCreditNoteRequest,
  CreditNoteDTO,
  SalesInvoiceDTO
} from '@shared/ipc';
import { invoke } from '../../api/ipcClient';

const CreditNotePanel = () => {
  const [salesInvoices, setSalesInvoices] = useState<SalesInvoiceDTO[]>([]);
  const [creditNotes, setCreditNotes] = useState<CreditNoteDTO[]>([]);
  const [form, setForm] = useState({
    creditNoteNumber: '',
    salesInvoiceId: 0,
    creditDate: new Date().toISOString().substring(0, 10),
    notes: ''
  });
  const [loading, setLoading] = useState(false);

  const loadData = async () => {
    const [invoices, notes] = await Promise.all([
      invoke('ipc.sales.list', undefined),
      invoke('ipc.creditnote.list', undefined)
    ]);
    setSalesInvoices(invoices);
    setCreditNotes(notes);
  };

  useEffect(() => {
    loadData().catch(console.error);
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.salesInvoiceId || !form.creditNoteNumber) {
      return;
    }

    const selectedInvoice = salesInvoices.find(
      (inv) => inv.id === form.salesInvoiceId
    );
    if (!selectedInvoice || selectedInvoice.items.length === 0) {
      return;
    }

    setLoading(true);
    try {
      const payload: CreateCreditNoteRequest = {
        creditNoteNumber: form.creditNoteNumber,
        salesInvoiceId: form.salesInvoiceId,
        creditDate: form.creditDate,
        notes: form.notes || undefined,
        items: selectedInvoice.items.map((item) => ({
          salesItemId: item.id,
          quantity: item.quantity,
          reason: 'Return'
        }))
      };
      await invoke('ipc.creditnote.create', payload);
      setForm({
        creditNoteNumber: '',
        salesInvoiceId: 0,
        creditDate: new Date().toISOString().substring(0, 10),
        notes: ''
      });
      await loadData();
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to create credit note');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="panel">
      <header className="panel__header">
        <div>
          <h2>Credit Notes</h2>
          <p>Process returns & stock adjustments</p>
        </div>
      </header>
      <div className="panel__body">
        <form className="purchase-form" onSubmit={handleSubmit}>
          <div className="purchase-form__meta">
            <input
              placeholder="Credit Note #"
              value={form.creditNoteNumber}
              onChange={(event) =>
                setForm({ ...form, creditNoteNumber: event.target.value })
              }
              required
            />
            <select
              value={form.salesInvoiceId}
              onChange={(event) =>
                setForm({ ...form, salesInvoiceId: Number(event.target.value) })
              }
              required
            >
              <option value={0}>Select Sales Invoice</option>
              {salesInvoices.map((invoice) => (
                <option key={invoice.id} value={invoice.id}>
                  {invoice.invoiceNumber} - {invoice.customerName}
                </option>
              ))}
            </select>
            <input
              type="date"
              value={form.creditDate}
              onChange={(event) =>
                setForm({ ...form, creditDate: event.target.value })
              }
              required
            />
          </div>
          <button
            className="purchase-form__submit"
            type="submit"
            disabled={loading}
          >
            {loading ? 'Processing…' : 'Create Credit Note'}
          </button>
        </form>
        <div className="purchase-history">
          <h3>Recent Credit Notes</h3>
          <ul>
            {creditNotes.length === 0 ? (
              <li className="empty">No credit notes yet</li>
            ) : (
              creditNotes.map((note) => (
                <li key={note.id}>
                  <strong>{note.creditNoteNumber}</strong>
                  <span>{note.salesInvoiceNumber}</span>
                  <span>{new Date(note.creditDate).toLocaleDateString()}</span>
                </li>
              ))
            )}
          </ul>
        </div>
      </div>
    </section>
  );
};

export default CreditNotePanel;

