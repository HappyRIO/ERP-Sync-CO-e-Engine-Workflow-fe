// Invoices Service (for client billing)
import type { Invoice } from '@/mocks/mock-entities';
import { mockInvoices } from '@/mocks/mock-entities';
import { delay, shouldSimulateError, ApiError, ApiErrorType } from './api-error';
import { USE_MOCK_API } from '@/lib/config';
import type { User } from '@/types/auth';

const SERVICE_NAME = 'invoices';

class InvoicesService {
  async getInvoices(user?: User | null, filter?: { status?: string }): Promise<Invoice[]> {
    // Backend doesn't have invoice routes yet (invoices are ERP-owned)
    // For now, use mocks regardless of USE_MOCK_API setting
    return this.getInvoicesMock(user, filter);
  }

  private async getInvoicesMock(user?: User | null, filter?: { status?: string }): Promise<Invoice[]> {
    await delay(500);

    if (shouldSimulateError(SERVICE_NAME)) {
      const config = JSON.parse(localStorage.getItem(`error_sim_${SERVICE_NAME}`) || '{}');
      throw new ApiError(
        config.errorType || ApiErrorType.NETWORK_ERROR,
        'Failed to fetch invoices. Please try again.',
        config.errorType === ApiErrorType.NETWORK_ERROR ? 0 : 500
      );
    }

    let invoices = [...mockInvoices];

    // Filter by user role
    if (user) {
      if (user.role === 'admin') {
        // Admin sees all invoices
      } else if (user.role === 'client') {
        // Client sees only their invoices
        invoices = invoices.filter(i => i.clientId === user.tenantId);
      } else if (user.role === 'reseller') {
        // Reseller sees invoices for their clients
        // Get clients for this reseller
        const { mockClients } = await import('@/mocks/mock-entities');
        const resellerClients = mockClients.filter(c => c.resellerId === user.tenantId);
        const clientIds = resellerClients.map(c => c.tenantId);
        invoices = invoices.filter(i => clientIds.includes(i.clientId));
      }
    }

    // Apply filters
    if (filter?.status) {
      invoices = invoices.filter(i => i.status === filter.status);
    }

    return invoices;
  }

  async getInvoice(id: string): Promise<Invoice | null> {
    // Backend doesn't have invoice routes yet (invoices are ERP-owned)
    return this.getInvoiceMock(id);
  }

  private async getInvoiceMock(id: string): Promise<Invoice | null> {
    await delay(300);

    if (shouldSimulateError(SERVICE_NAME)) {
      const config = JSON.parse(localStorage.getItem(`error_sim_${SERVICE_NAME}`) || '{}');
      if (config.errorType === ApiErrorType.NOT_FOUND) {
        throw new ApiError(
          ApiErrorType.NOT_FOUND,
          `Invoice with ID "${id}" was not found.`,
          404,
          { invoiceId: id }
        );
      }
      throw new ApiError(
        config.errorType || ApiErrorType.NETWORK_ERROR,
        'Failed to fetch invoice. Please try again.',
        config.errorType === ApiErrorType.NETWORK_ERROR ? 0 : 500
      );
    }

    return mockInvoices.find(i => i.id === id) || null;
  }

  /**
   * Update invoice status (admin only)
   * Valid transitions:
   * - draft → sent
   * - sent → paid
   * - sent → overdue (automatic when due date passes)
   * - Any → cancelled (admin can cancel any invoice)
   */
  async updateInvoiceStatus(
    invoiceId: string,
    status: Invoice['status']
  ): Promise<Invoice> {
    if (USE_MOCK_API) {
      return this.updateInvoiceStatusMock(invoiceId, status);
    }
    throw new Error('Real API not implemented yet');
  }

  private async updateInvoiceStatusMock(
    invoiceId: string,
    status: Invoice['status']
  ): Promise<Invoice> {
    await delay(600);

    if (shouldSimulateError(SERVICE_NAME)) {
      const config = JSON.parse(localStorage.getItem(`error_sim_${SERVICE_NAME}`) || '{}');
      throw new ApiError(
        config.errorType || ApiErrorType.SERVER_ERROR,
        'Failed to update invoice status. Please try again.',
        config.errorType === ApiErrorType.NETWORK_ERROR ? 0 : 500
      );
    }

    const invoice = mockInvoices.find(i => i.id === invoiceId);
    if (!invoice) {
      throw new ApiError(
        ApiErrorType.NOT_FOUND,
        `Invoice with ID "${invoiceId}" was not found.`,
        404,
        { invoiceId }
      );
    }

    // Validate status transition
    const validTransitions: Record<string, string[]> = {
      'draft': ['sent', 'cancelled'],
      'sent': ['paid', 'overdue', 'cancelled'],
      'paid': ['cancelled'], // Can cancel even if paid (for refunds, etc.)
      'overdue': ['paid', 'cancelled'],
      'cancelled': [], // Cancelled is terminal
    };

    const currentStatus = invoice.status;
    const allowedNextStatuses = validTransitions[currentStatus] || [];
    
    // Allow cancelling from any status
    if (status === 'cancelled') {
      invoice.status = 'cancelled';
      return invoice;
    }

    if (status !== currentStatus && allowedNextStatuses.length > 0 && !allowedNextStatuses.includes(status)) {
      throw new ApiError(
        ApiErrorType.VALIDATION_ERROR,
        `Invalid status transition from "${currentStatus}" to "${status}". Allowed next statuses: ${allowedNextStatuses.join(', ')}, or cancelled`,
        400,
        { invoiceId, currentStatus, requestedStatus: status }
      );
    }

    invoice.status = status;
    return invoice;
  }

  /**
   * Send invoice (draft → sent)
   */
  async sendInvoice(invoiceId: string): Promise<Invoice> {
    return this.updateInvoiceStatus(invoiceId, 'sent');
  }

  /**
   * Mark invoice as paid (sent/overdue → paid)
   */
  async markAsPaid(invoiceId: string): Promise<Invoice> {
    return this.updateInvoiceStatus(invoiceId, 'paid');
  }

  /**
   * Cancel invoice (any status → cancelled)
   */
  async cancelInvoice(invoiceId: string): Promise<Invoice> {
    return this.updateInvoiceStatus(invoiceId, 'cancelled');
  }
}

export const invoicesService = new InvoicesService();

