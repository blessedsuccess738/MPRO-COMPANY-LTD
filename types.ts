
export enum UserRole {
  USER = 'user',
  ADMIN = 'admin'
}

export enum TransactionType {
  DEPOSIT = 'deposit',
  MANUAL_DEPOSIT = 'manual_deposit',
  WITHDRAWAL = 'withdrawal',
  EARNINGS = 'earnings'
}

export enum TransactionStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  PAID = 'paid'
}

export interface User {
  id: string;
  email: string;
  password?: string;
  role: UserRole;
  balance: number;
  isFrozen: boolean;
  createdAt: string;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  dailyRoi: number; // Percentage, e.g., 26
  duration: number; // Days
  imageUrl: string;
}

export interface Investment {
  id: string;
  userId: string;
  productId: string;
  productName: string;
  amount: number;
  dailyRoi: number;
  startDate: string;
  endDate: string;
  status: 'active' | 'completed';
}

export interface Transaction {
  id: string;
  userId: string;
  amount: number;
  type: TransactionType;
  status: TransactionStatus;
  description: string;
  createdAt: string;
  bankName?: string;
  accountNumber?: string;
  accountName?: string;
}

export interface ChatMessage {
  id: string;
  userId: string;
  senderEmail: string;
  text: string;
  timestamp: string;
  isAdmin: boolean;
  isRead: boolean;
}

export interface GlobalSettings {
  minWithdrawal: number;
  maxInvestment: number;
  defaultDuration: number;
  defaultRoi: number;
  adminEmail: string;
}
