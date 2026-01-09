// FILE: docs/PHARMA_RULES.md
/// ANCHOR: PharmaDomainRules
# Wholesale Pharma Domain Rules (Mediclone)

This document captures the core business rules that shape schema design and workflows in Mediclone. It is not a legal reference, but an implementation guide for developers.

## 1. Products & Batches
- **Batch-managed inventory**  
  - Every sale and purchase must be tied to a batch when `Product.isBatchManaged = true`.  
  - FEFO (First Expiry, First Out) is used when allocating batches for sales.
- **Expiry handling**  
  - Expired batches must never be auto-allocated for sales; FEFO filter always excludes `expiryDate <= today`.
  - Stock adjustments can still be passed manually for write-off / destruction.

## 2. GST, MRP & Trade Schemes
- GST is stored per-product and per-line, but actual calculation is done per-line (purchase & sales items).
- Line totals always respect this order:  
  1. Base = qty × rate  
  2. Discount = base × discount%  
  3. Taxable = base − discount  
  4. Tax = taxable × tax%  
  5. Line Total = taxable + tax
- Free quantities (schemes) always affect stock, but **never add line value**; discount may be expressed via free units or percent.

## 3. Stock & Godowns
- Stock movement is append-only in `StockLedger`:
  - **PURCHASE**: increases stock (positive `quantityChange`).
  - **SALE**: decreases stock (negative `quantityChange`).
  - **ADJUSTMENT / TRANSFER / RETURN**: used for corrections and inter-godown moves.
- Godown is optional on batch and movements; `null` indicates unassigned/primary storage.

## 4. Credit Control
- Customer credit limits are advisory fields (`Customer.creditLimit`) and can be enforced in UI later.
- Opening balances for customers/suppliers are stored, but closing balances should be computed from transactions, not edited in-place.

## 5. Returns & Notes (Future)
- Sales returns should:
  - Restore stock back to the correct batch.
  - Create a negative movement in receivables / credit note reference.
- Purchase returns should:
  - Move stock out and record linkage to purchase invoice.

## 6. E-Invoice Queue (Offline)
- E-invoice queue is **local-only**:
  - JSON payloads are stored in `EInvoiceQueue.payloadJson`.
  - Status transitions: `PENDING → SENT` or `PENDING → FAILED`.
  - Sync is always initiated by user action, never automatic.

## 7. Audit Logging
- Any create/update that materially affects stock, financials, or masters must be logged in `AuditLog`:
  - `entity`, `entityId`, `action`, `userId?`, `details` (JSON string).
  - Audit logs are append-only and never mutated.


