
import { User, Product, Investment, Transaction, ChatMessage, GlobalSettings, UserRole, TransactionType, TransactionStatus } from './types';
import { INITIAL_PRODUCTS, INITIAL_SETTINGS } from './constants';

/**
 * Simple local storage based store to mimic a backend
 */
class MProStore {
  private static STORAGE_KEY = 'mpro_data';

  private data: {
    users: User[];
    products: Product[];
    investments: Investment[];
    transactions: Transaction[];
    messages: ChatMessage[];
    settings: GlobalSettings;
    currentUser: User | null;
  };

  constructor() {
    const saved = localStorage.getItem(MProStore.STORAGE_KEY);
    if (saved) {
      this.data = JSON.parse(saved);
    } else {
      this.data = {
        users: [],
        products: INITIAL_PRODUCTS,
        investments: [],
        transactions: [],
        messages: [],
        settings: INITIAL_SETTINGS,
        currentUser: null,
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

  // Products
  getProducts() { return this.data.products; }
  updateProduct(id: string, updates: Partial<Product>) {
    this.data.products = this.data.products.map(p => p.id === id ? { ...p, ...updates } : p);
    this.save();
  }
  deleteProduct(id: string) {
    this.data.products = this.data.products.filter(p => p.id !== id);
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
  completeInvestment(id: string) {
    this.data.investments = this.data.investments.map(i => i.id === id ? { ...i, status: 'completed' as const } : i);
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
