export type ReturnRequestType = 'return' | 'replace';
export type ReturnRequestStatus = 'pending' | 'approved' | 'rejected' | 'completed';

export interface ReturnRequestOrderItem {
  name: string;
  details: string;
}

export interface ReturnRequest {
  id: string;
  createdAt: string;
  status: ReturnRequestStatus;
  requestType: ReturnRequestType;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  customerAddress: string;
  productName: string;
  productDetails: string;
  reason: string;
  additionalMessage: string;
  orderMatched: boolean;
  notifications: {
    email: { sent: boolean; error?: string };
    whatsapp: { sent: boolean; error?: string };
    sms: { sent: boolean; error?: string };
  };
}
