
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { User, Product, Investment, Transaction, ChatMessage, GlobalSettings, UserRole, TransactionType, TransactionStatus, Coupon } from './types';
import { INITIAL_PRODUCTS, INITIAL_SETTINGS } from './constants';

// Supabase Credentials provided by user - Hardcoded for seamless Vercel deployment
const supabaseUrl = 'https://plcwsfobfywzlkkokeza.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsY3dzZm9iZnl3emxra29rZXphIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc4NDA5MTAsImV4cCI6MjA4MzQxNjkxMH0.5oqn3ELXnrvvAJSEZ1Ja772DBG3ZPdzJznBZ08dL5ec';

// Initialize Supabase Client
export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey);

class MProStore {
  private currentUser: User | null = null;

  // Configuration check helper
  isConfigured(): boolean {
    return !!supabaseUrl && !!supabaseAnonKey;
  }

  // Auth
  setCurrentUser(user: User | null) {
    this.currentUser = user;
  }

  getCurrentUser() {
    return this.currentUser;
  }

  async fetchCurrentUser(email: string): Promise<User | null> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', email)
        .maybeSingle();
      
      if (error || !data) return null;
      return data as User;
    } catch (e) {
      return null;
    }
  }

  async getUsers(): Promise<User[]> {
    try {
      const { data, error } = await supabase.from('profiles').select('*').order('createdAt', { ascending: false });
      return (data as User[]) || [];
    } catch (e) {
      return [];
    }
  }

  generateReferralCode() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  }

  async getReferralCount(referralCode: string): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('referredBy', referralCode);

      return count || 0;
    } catch (e) {
      return 0;
    }
  }

  async addUser(user: User) {
    await supabase.from('profiles').insert([user]);
    
    if (user.referredBy) {
      const { data: referrer } = await supabase
        .from('profiles')
        .select('*')
        .eq('referralCode', user.referredBy)
        .maybeSingle();

      if (referrer) {
        const settings = await this.getSettings();
        const bonus = settings.referralBonus;
        await this.updateUser(referrer.id, { balance: referrer.balance + bonus });
        await this.addTransaction({
          id: 'ref-' + Date.now(),
          userId: referrer.id,
          amount: bonus,
          type: TransactionType.REFERRAL_BONUS,
          status: TransactionStatus.PAID,
          description: `Network Bounty: ${user.email}`,
          createdAt: new Date().toISOString()
        });
      }
    }
  }

  async updateUser(id: string, updates: Partial<User>) {
    await supabase.from('profiles').update(updates).eq('id', id);
    if (this.currentUser?.id === id) {
      this.currentUser = { ...this.currentUser, ...updates };
    }
  }

  // Coupons
  async getCoupons(): Promise<Coupon[]> {
    try {
      const { data } = await supabase.from('coupons').select('*');
      return (data as Coupon[]) || [];
    } catch (e) {
      return [];
    }
  }

  async addCoupon(coupon: Coupon) {
    await supabase.from('coupons').insert([coupon]);
  }

  async deleteCoupon(id: string) {
    await supabase.from('coupons').delete().eq('id', id);
  }

  async redeemCoupon(userId: string, code: string): Promise<{ success: boolean, amount: number, error?: string }> {
    try {
      const { data: coupon } = await supabase
        .from('coupons')
        .select('*')
        .ilike('code', code)
        .maybeSingle();

      if (!coupon) return { success: false, amount: 0, error: 'Invalid coupon code.' };

      const { data: user } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
      if (!user) return { success: false, amount: 0, error: 'User not found.' };

      if (user.usedCoupons?.includes(coupon.id)) {
        return { success: false, amount: 0, error: 'You have already used this coupon.' };
      }

      const updatedUsedCoupons = [...(user.usedCoupons || []), coupon.id];
      await this.updateUser(userId, { 
        balance: user.balance + coupon.amount,
        usedCoupons: updatedUsedCoupons
      });

      return { success: true, amount: coupon.amount };
    } catch (e) {
      return { success: false, amount: 0, error: 'System error redeeming coupon.' };
    }
  }

  // Products
  async getProducts(): Promise<Product[]> {
    try {
      const { data } = await supabase.from('products').select('*');
      if (!data || data.length === 0) return INITIAL_PRODUCTS;
      return data as Product[];
    } catch (e) {
      return INITIAL_PRODUCTS;
    }
  }

  async updateProduct(id: string, updates: Partial<Product>) {
    await supabase.from('products').update(updates).eq('id', id);
  }

  async addProduct(p: Product) {
    await supabase.from('products').insert([p]);
  }

  // Investments
  async getInvestments(): Promise<Investment[]> {
    try {
      const { data } = await supabase.from('investments').select('*');
      return (data as Investment[]) || [];
    } catch (e) {
      return [];
    }
  }

  async getActiveInvestment(userId: string): Promise<Investment | null> {
    try {
      const { data } = await supabase
        .from('investments')
        .select('*')
        .eq('userId', userId)
        .eq('status', 'active')
        .maybeSingle();
      return (data as Investment) || null;
    } catch (e) {
      return null;
    }
  }

  async addInvestment(inv: Investment) {
    await supabase.from('investments').insert([inv]);
  }

  // Transactions
  async getTransactions(userId?: string): Promise<Transaction[]> {
    try {
      let query = supabase.from('transactions').select('*').order('createdAt', { ascending: false });
      if (userId) query = query.eq('userId', userId);
      const { data } = await query;
      return (data as Transaction[]) || [];
    } catch (e) {
      return [];
    }
  }

  async addTransaction(t: Transaction) {
    await supabase.from('transactions').insert([t]);
  }

  async updateTransactionStatus(id: string, status: TransactionStatus) {
    await supabase.from('transactions').update({ status }).eq('id', id);
  }

  // Messages
  async getMessages(userId: string): Promise<ChatMessage[]> {
    try {
      const { data } = await supabase.from('chat_messages').select('*').eq('userId', userId).order('timestamp', { ascending: true });
      return (data as ChatMessage[]) || [];
    } catch (e) {
      return [];
    }
  }

  async addMessage(msg: ChatMessage) {
    await supabase.from('chat_messages').insert([msg]);
  }

  async markMessagesAsRead(userId: string) {
    await supabase.from('chat_messages').update({ isRead: true }).eq('userId', userId);
  }

  // Settings
  async getSettings(): Promise<GlobalSettings> {
    try {
      const { data, error } = await supabase.from('settings').select('*').eq('id', 'global').maybeSingle();
      if (error || !data) return INITIAL_SETTINGS;
      return data.data as GlobalSettings;
    } catch (e) {
      return INITIAL_SETTINGS;
    }
  }

  async updateSettings(s: Partial<GlobalSettings>) {
    const current = await this.getSettings();
    const updated = { ...current, ...s };
    await supabase.from('settings').upsert({ id: 'global', data: updated });
  }
}

export const store = new MProStore();
