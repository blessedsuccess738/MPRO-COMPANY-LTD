
import { User, Product, Investment, Transaction, ChatMessage, GlobalSettings, UserRole, TransactionType, TransactionStatus, Coupon } from './types';
import { INITIAL_PRODUCTS, INITIAL_SETTINGS } from './constants';

class MProStore {
  private static STORAGE_KEY = 'mpro_data_v2';

  private data: {
    users: User[];
    products: Product[];
    investments: Investment[];
    transactions: Transaction[];
    messages: ChatMessage[];
    settings: GlobalSettings;
    currentUser: User | null;
    coupons: Coupon[];
  };

  constructor() {
    const saved = localStorage.getItem(MProStore.STORAGE_KEY);
    if (saved) {
      this.data = JSON.parse(saved);
      // Migrate missing properties if any
      this.data.settings = { ...INITIAL_SETTINGS, ...this.data.settings };
      if (!this.data.coupons) this.data.coupons = [];
    } else {
      this.data = {
        users: [],
        products: INITIAL_PRODUCTS,
        investments: [],
        transactions: [],
        messages: [],
        settings: INITIAL_SETTINGS,
        currentUser: null,
        coupons: []
      };
      this.save();
    }
  }

  private save() {
    localStorage.setItem(MProStore.STORAGE_KEY, JSON.stringify(this.data));
  }

  // Auth
  setCurrentUser(user: User | null) {
    this.data.currentUser = user;
    this.save();
  }

  getCurrentUser() {
    return this.data.currentUser;
  }

  getUsers() { return this.data.users; }
  
  addUser(user: User) {
    this.data.users.push(user);
    this.save();
  }

  updateUser(id: string, updates: Partial<User>) {
    this.data.users = this.data.users.map(u => u.id === id ? { ...u, ...updates } : u);
    if (this.data.currentUser?.id === id) {
      this.data.currentUser = { ...this.data.currentUser, ...updates };
    }
    this.save();
  }

  // Coupons
  getCoupons() { return this.data.coupons; }
  addCoupon(coupon: Coupon) {
    this.data.coupons.push(coupon);
    this.save();
  }
  deleteCoupon(id: string) {
    this.data.coupons = this.data.coupons.filter(c => c.id !== id);
    this.save();
  }

  redeemCoupon(userId: string, code: string): { success: boolean, amount: number, error?: string } {
    const coupon = this.data.coupons.find(c => c.code.toUpperCase() === code.toUpperCase());
    if (!coupon) return { success: false, amount: 0, error: 'Invalid coupon code.' };

    const user = this.data.users.find(u => u.id === userId);
    if (!user) return { success: false, amount: 0, error: 'User not found.' };

    if (user.usedCoupons?.includes(coupon.id)) {
      return { success: false, amount: 0, error: 'You have already used this coupon.' };
    }

    const updatedUsedCoupons = [...(user.usedCoupons || []), coupon.id];
    this.updateUser(userId, { 
      balance: user.balance + coupon.amount,
      usedCoupons: updatedUsedCoupons
    });

    return { success: true, amount: coupon.amount };
  }

  // Products
  getProducts() { return this.data.products; }
  updateProduct(id: string, updates: Partial<Product>) {
    this.data.products = this.data.products.map(p => p.id === id ? { ...p, ...updates } : p);
    this.save();
  }
  addProduct(p: Product) {
    this.data.products.push(p);
    this.save();
  }

  // Investments
  getInvestments() { return this.data.investments; }
  getActiveInvestment(userId: string) {
    return this.data.investments.find(i => i.userId === userId && i.status === 'active');
  }
  addInvestment(inv: Investment) {
    this.data.investments.push(inv);
    this.save();
  }

  // Transactions
  getTransactions() { return this.data.transactions; }
  addTransaction(t: Transaction) {
    this.data.transactions.unshift(t);
    this.save();
  }
  updateTransactionStatus(id: string, status: TransactionStatus) {
    this.data.transactions = this.data.transactions.map(t => t.id === id ? { ...t, status } : t);
    this.save();
  }

  // Messages
  getMessages() { return this.data.messages; }
  addMessage(msg: ChatMessage) {
    this.data.messages.push(msg);
    this.save();
  }
  markMessagesAsRead(userId: string) {
    this.data.messages = this.data.messages.map(m => m.userId === userId ? { ...m, isRead: true } : m);
    this.save();
  }

  // Settings
  getSettings() { return this.data.settings; }
  updateSettings(s: Partial<GlobalSettings>) {
    this.data.settings = { ...this.data.settings, ...s };
    this.save();
  }
}

export const store = new MProStore();
