
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { User, Product, Investment, Transaction, ChatMessage, GlobalSettings, UserRole, TransactionType, TransactionStatus, Coupon } from './types';
import { INITIAL_PRODUCTS, INITIAL_SETTINGS } from './constants';

const supabaseUrl = 'https://plcwsfobfywzlkkokeza.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsY3dzZm9iZnl3emxra29rZXphIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc4NDA5MTAsImV4cCI6MjA4MzQxNjkxMH0.5oqn3ELXnrvvAJSEZ1Ja772DBG3ZPdzJznBZ08dL5ec';

// Safety check for initialization
export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey);

class MProStore {
  private currentUser: User | null = null;

  setCurrentUser(user: User | null) { this.currentUser = user; }
  getCurrentUser() { return this.currentUser; }

  // Helper to map DB profile to User object
  private mapProfile(data: any): User {
    if (!data) return {} as User;
    return {
      id: data.id,
      email: data.email,
      role: (data.role as UserRole) || UserRole.USER,
      balance: Number(data.balance) || 0,
      isFrozen: data.is_frozen || false,
      isRestricted: data.is_restricted || false,
      warningMessage: data.warning_message || '',
      usedCoupons: data.used_coupons || [],
      referralCode: data.referral_code || '',
      referredBy: data.referred_by || '',
      createdAt: data.created_at || new Date().toISOString()
    };
  }

  async fetchCurrentUser(email: string): Promise<User | null> {
    try {
      const { data, error } = await supabase.from('profiles').select('*').eq('email', email).maybeSingle();
      if (error || !data) return null;
      return this.mapProfile(data);
    } catch (e) { 
      console.error("fetchCurrentUser error:", e);
      return null; 
    }
  }

  async getUsers(): Promise<User[]> {
    try {
      const { data, error } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []).map(this.mapProfile);
    } catch (e) { 
      return []; 
    }
  }

  generateReferralCode() { 
    return Math.random().toString(36).substring(2, 8).toUpperCase(); 
  }

  async getReferralCount(referralCode: string): Promise<number> {
    try {
      const { count, error } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('referred_by', referralCode);
      if (error) throw error;
      return count || 0;
    } catch (e) { 
      return 0; 
    }
  }

  async addUser(user: User) {
    try {
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
    } catch (e) {
      console.error("addUser error:", e);
    }
  }

  async updateUser(id: string, updates: any) {
    try {
      const dbUpdates: any = {};
      if ('balance' in updates) dbUpdates.balance = updates.balance;
      if ('isFrozen' in updates) dbUpdates.is_frozen = updates.isFrozen;
      if ('usedCoupons' in updates) dbUpdates.used_coupons = updates.usedCoupons;
      if ('warningMessage' in updates) dbUpdates.warning_message = updates.warningMessage;
      if ('isRestricted' in updates) dbUpdates.is_restricted = updates.isRestricted;

      await supabase.from('profiles').update(dbUpdates).eq('id', id);
      if (this.currentUser?.id === id) {
        this.currentUser = { ...this.currentUser, ...updates };
      }
    } catch (e) {
      console.error("updateUser error:", e);
    }
  }

  async getCoupons(): Promise<Coupon[]> {
    try {
      const { data } = await supabase.from('coupons').select('*');
      return (data || []).map(c => ({ id: c.id, code: c.code, amount: c.amount, createdAt: c.created_at }));
    } catch (e) {
      return [];
    }
  }

  async addCoupon(coupon: Coupon) {
    try {
      await supabase.from('coupons').insert([{ id: coupon.id, code: coupon.code, amount: coupon.amount, created_at: coupon.createdAt }]);
    } catch (e) {}
  }

  async getProducts(): Promise<Product[]> {
    try {
      const { data, error } = await supabase.from('products').select('*');
      if (error || !data || data.length === 0) return INITIAL_PRODUCTS;
      return data.map(p => ({ 
        id: p.id, 
        name: p.name, 
        price: Number(p.price), 
        dailyRoi: Number(p.daily_roi), 
        duration: Number(p.duration), 
        imageUrl: p.image_url 
      }));
    } catch (e) { 
      return INITIAL_PRODUCTS; 
    }
  }

  async addProduct(p: Product) {
    try {
      await supabase.from('products').insert([{
        id: p.id,
        name: p.name,
        price: p.price,
        daily_roi: p.dailyRoi,
        duration: p.duration,
        image_url: p.imageUrl
      }]);
    } catch (e) {}
  }

  async getTransactions(userId?: string): Promise<Transaction[]> {
    try {
      let q = supabase.from('transactions').select('*').order('created_at', { ascending: false });
      if (userId) q = q.eq('user_id', userId);
      const { data, error } = await q;
      if (error) throw error;
      return (data || []).map(t => ({
        id: t.id, userId: t.user_id, amount: Number(t.amount), type: t.type, status: t.status,
        description: t.description, createdAt: t.created_at, bankName: t.bank_name,
        accountNumber: t.account_number, accountName: t.account_name, proofImageUrl: t.proof_image_url
      }));
    } catch (e) { 
      return []; 
    }
  }

  async addTransaction(t: Transaction) {
    try {
      await supabase.from('transactions').insert([{
        id: t.id, user_id: t.userId, amount: t.amount, type: t.type, status: t.status,
        description: t.description, created_at: t.createdAt, bank_name: t.bankName,
        account_number: t.accountNumber, account_name: t.accountName, proof_image_url: t.proofImageUrl
      }]);
    } catch (e) {}
  }

  async updateTransactionStatus(id: string, status: TransactionStatus) {
    try {
      await supabase.from('transactions').update({ status }).eq('id', id);
    } catch (e) {}
  }

  async getSettings(): Promise<GlobalSettings> {
    try {
      const { data, error } = await supabase.from('settings').select('*').eq('id', 'global').maybeSingle();
      if (error || !data) return INITIAL_SETTINGS;
      return (data.data as GlobalSettings) || INITIAL_SETTINGS;
    } catch (e) { 
      return INITIAL_SETTINGS; 
    }
  }

  async updateSettings(s: GlobalSettings) {
    try {
      await supabase.from('settings').upsert({ id: 'global', data: s });
    } catch (e) {}
  }

  async getActiveInvestment(userId: string): Promise<Investment | null> {
    try {
      const { data, error } = await supabase.from('investments').select('*').eq('user_id', userId).eq('status', 'active').maybeSingle();
      if (error || !data) return null;
      return {
        id: data.id, userId: data.user_id, productId: data.product_id, productName: data.product_name,
        amount: Number(data.amount), dailyRoi: Number(data.daily_roi), startDate: data.start_date, endDate: data.end_date, status: data.status
      };
    } catch (e) { return null; }
  }

  async addInvestment(inv: Investment) {
    try {
      await supabase.from('investments').insert([{
        id: inv.id, user_id: inv.userId, product_id: inv.productId, product_name: inv.productName,
        amount: inv.amount, daily_roi: inv.dailyRoi, start_date: inv.startDate, end_date: inv.endDate, status: inv.status
      }]);
    } catch (e) {}
  }

  async getMessages(userId: string): Promise<ChatMessage[]> {
    try {
      const { data } = await supabase.from('chat_messages').select('*').eq('user_id', userId).order('timestamp', { ascending: true });
      return (data || []).map(m => ({
        id: m.id, userId: m.user_id, senderEmail: m.sender_email, text: m.text,
        timestamp: m.timestamp, isAdmin: m.is_admin, isRead: m.is_read
      }));
    } catch (e) { return []; }
  }

  async addMessage(msg: ChatMessage) {
    try {
      await supabase.from('chat_messages').insert([{
        id: msg.id, user_id: msg.userId, sender_email: msg.senderEmail, text: msg.text,
        timestamp: msg.timestamp, is_admin: msg.isAdmin, is_read: msg.isRead
      }]);
    } catch (e) {}
  }

  async markMessagesAsRead(userId: string) {
    try {
      await supabase.from('chat_messages').update({ is_read: true }).eq('user_id', userId).eq('is_admin', true);
    } catch (e) {}
  }

  async redeemCoupon(userId: string, code: string): Promise<{ success: boolean, amount: number, error?: string }> {
    try {
      const { data: coupon } = await supabase.from('coupons').select('*').ilike('code', code).maybeSingle();
      if (!coupon) return { success: false, amount: 0, error: 'Invalid code.' };
      const { data: profile } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
      if (!profile) return { success: false, amount: 0, error: 'Profile not found.' };
      if (profile.used_coupons?.includes(coupon.id)) return { success: false, amount: 0, error: 'Already used.' };
      
      const updatedUsed = [...(profile.used_coupons || []), coupon.id];
      await this.updateUser(userId, { balance: Number(profile.balance) + Number(coupon.amount), usedCoupons: updatedUsed });
      return { success: true, amount: Number(coupon.amount) };
    } catch (e) {
      return { success: false, amount: 0, error: 'Network error.' };
    }
  }
}

export const store = new MProStore();
