
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { User, Product, Investment, Transaction, ChatMessage, GlobalSettings, UserRole, TransactionType, TransactionStatus, Coupon } from './types';
import { INITIAL_PRODUCTS, INITIAL_SETTINGS } from './constants';

const supabaseUrl = 'https://plcwsfobfywzlkkokeza.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsY3dzZm9iZnl3emxra29rZXphIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc4NDA5MTAsImV4cCI6MjA4MzQxNjkxMH0.5oqn3ELXnrvvAJSEZ1Ja772DBG3ZPdzJznBZ08dL5ec';

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey);

class MProStore {
  private currentUser: User | null = null;

  setCurrentUser(user: User | null) { this.currentUser = user; }
  getCurrentUser() { return this.currentUser; }

  // Helper to map DB profile to User object
  private mapProfile(data: any): User {
    return {
      id: data.id,
      email: data.email,
      role: data.role as UserRole,
      balance: data.balance,
      isFrozen: data.is_frozen,
      isRestricted: data.is_restricted,
      warningMessage: data.warning_message,
      usedCoupons: data.used_coupons,
      referralCode: data.referral_code,
      referredBy: data.referred_by,
      createdAt: data.created_at
    };
  }

  async fetchCurrentUser(email: string): Promise<User | null> {
    try {
      const { data, error } = await supabase.from('profiles').select('*').eq('email', email).maybeSingle();
      if (error || !data) return null;
      return this.mapProfile(data);
    } catch (e) { return null; }
  }

  async getUsers(): Promise<User[]> {
    try {
      const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
      return (data || []).map(this.mapProfile);
    } catch (e) { return []; }
  }

  generateReferralCode() { return Math.random().toString(36).substring(2, 8).toUpperCase(); }

  async getReferralCount(referralCode: string): Promise<number> {
    try {
      const { count } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('referred_by', referralCode);
      return count || 0;
    } catch (e) { return 0; }
  }

  async addUser(user: User) {
    const dbUser = {
      id: user.id,
      email: user.email,
      role: user.role,
      balance: user.balance,
      is_frozen: user.isFrozen,
      referral_code: user.referralCode,
      referred_by: user.referredBy,
      created_at: user.createdAt
    };
    await supabase.from('profiles').insert([dbUser]);
  }

  async updateUser(id: string, updates: any) {
    const dbUpdates: any = {};
    if ('balance' in updates) dbUpdates.balance = updates.balance;
    if ('isFrozen' in updates) dbUpdates.is_frozen = updates.isFrozen;
    if ('usedCoupons' in updates) dbUpdates.used_coupons = updates.usedCoupons;
    if ('warningMessage' in updates) dbUpdates.warning_message = updates.warningMessage;

    await supabase.from('profiles').update(dbUpdates).eq('id', id);
  }

  async getCoupons(): Promise<Coupon[]> {
    const { data } = await supabase.from('coupons').select('*');
    return (data || []).map(c => ({ id: c.id, code: c.code, amount: c.amount, createdAt: c.created_at }));
  }

  async addCoupon(coupon: Coupon) {
    await supabase.from('coupons').insert([{ id: coupon.id, code: coupon.code, amount: coupon.amount, created_at: coupon.createdAt }]);
  }

  async getProducts(): Promise<Product[]> {
    try {
      const { data } = await supabase.from('products').select('*');
      if (!data || data.length === 0) return INITIAL_PRODUCTS;
      return data.map(p => ({ id: p.id, name: p.name, price: p.price, dailyRoi: p.daily_roi, duration: p.duration, imageUrl: p.image_url }));
    } catch (e) { return INITIAL_PRODUCTS; }
  }

  // Fix: Added missing addProduct method for AdminPanel.tsx
  async addProduct(p: Product) {
    await supabase.from('products').insert([{
      id: p.id,
      name: p.name,
      price: p.price,
      daily_roi: p.dailyRoi,
      duration: p.duration,
      image_url: p.imageUrl
    }]);
  }

  async getTransactions(userId?: string): Promise<Transaction[]> {
    try {
      let q = supabase.from('transactions').select('*').order('created_at', { ascending: false });
      if (userId) q = q.eq('user_id', userId);
      const { data } = await q;
      return (data || []).map(t => ({
        id: t.id, userId: t.user_id, amount: t.amount, type: t.type, status: t.status,
        description: t.description, createdAt: t.created_at, bankName: t.bank_name,
        accountNumber: t.account_number, account_name: t.account_name, proofImageUrl: t.proof_image_url
      }));
    } catch (e) { return []; }
  }

  async addTransaction(t: Transaction) {
    await supabase.from('transactions').insert([{
      id: t.id, user_id: t.userId, amount: t.amount, type: t.type, status: t.status,
      description: t.description, created_at: t.createdAt, bank_name: t.bankName,
      account_number: t.accountNumber, account_name: t.accountName, proof_image_url: t.proofImageUrl
    }]);
  }

  // Fix: Added missing updateTransactionStatus method for AdminPanel.tsx
  async updateTransactionStatus(id: string, status: TransactionStatus) {
    await supabase.from('transactions').update({ status }).eq('id', id);
  }

  async getSettings(): Promise<GlobalSettings> {
    try {
      const { data } = await supabase.from('settings').select('*').eq('id', 'global').maybeSingle();
      return data ? data.data : INITIAL_SETTINGS;
    } catch (e) { return INITIAL_SETTINGS; }
  }

  async updateSettings(s: GlobalSettings) {
    await supabase.from('settings').upsert({ id: 'global', data: s });
  }

  async getActiveInvestment(userId: string): Promise<Investment | null> {
    try {
      const { data } = await supabase.from('investments').select('*').eq('user_id', userId).eq('status', 'active').maybeSingle();
      if (!data) return null;
      return {
        id: data.id, userId: data.user_id, productId: data.product_id, productName: data.product_name,
        amount: data.amount, dailyRoi: data.daily_roi, startDate: data.start_date, endDate: data.end_date, status: data.status
      };
    } catch (e) { return null; }
  }

  async addInvestment(inv: Investment) {
    await supabase.from('investments').insert([{
      id: inv.id, user_id: inv.userId, product_id: inv.productId, product_name: inv.productName,
      amount: inv.amount, daily_roi: inv.dailyRoi, start_date: inv.startDate, end_date: inv.endDate, status: inv.status
    }]);
  }

  async getMessages(userId: string): Promise<ChatMessage[]> {
    const { data } = await supabase.from('chat_messages').select('*').eq('user_id', userId).order('timestamp', { ascending: true });
    return (data || []).map(m => ({
      id: m.id, userId: m.user_id, senderEmail: m.sender_email, text: m.text,
      timestamp: m.timestamp, isAdmin: m.is_admin, isRead: m.is_read
    }));
  }

  async addMessage(msg: ChatMessage) {
    await supabase.from('chat_messages').insert([{
      id: msg.id, user_id: msg.userId, sender_email: msg.senderEmail, text: msg.text,
      timestamp: msg.timestamp, is_admin: msg.isAdmin, is_read: msg.isRead
    }]);
  }

  // Fix: Added missing markMessagesAsRead method for Chat.tsx
  async markMessagesAsRead(userId: string) {
    await supabase.from('chat_messages').update({ is_read: true }).eq('user_id', userId).eq('is_admin', true);
  }

  async redeemCoupon(userId: string, code: string): Promise<{ success: boolean, amount: number, error?: string }> {
    const { data: coupon } = await supabase.from('coupons').select('*').ilike('code', code).maybeSingle();
    if (!coupon) return { success: false, amount: 0, error: 'Invalid code.' };
    const { data: profile } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
    if (profile.used_coupons?.includes(coupon.id)) return { success: false, amount: 0, error: 'Already used.' };
    
    const updatedUsed = [...(profile.used_coupons || []), coupon.id];
    await this.updateUser(userId, { balance: profile.balance + coupon.amount, usedCoupons: updatedUsed });
    return { success: true, amount: coupon.amount };
  }
}

export const store = new MProStore();
