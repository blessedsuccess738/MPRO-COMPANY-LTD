
import { Product, GlobalSettings } from './types';

export const APP_NAME = 'MPRO INVEST';
export const ADMIN_EMAIL = 'blessedsuccess538@gmail.com';
export const CURRENCY = '₦';

// Paystack Public Key
export const PAYSTACK_PUBLIC_KEY = 'pk_live_f504acddecaa332ffb8a8835085b67adbbf007cd';

export interface Bank {
  name: string;
  code: string;
}

export const NIGERIAN_BANKS: Bank[] = [
  { name: "9 PAYMENT SERVICE BANK", code: "120001" },
  { name: "ACCESS BANK", code: "000014" },
  { name: "ECOBANK BANK", code: "000010" },
  { name: "FIDELITY BANK", code: "000007" },
  { name: "FIRST BANK OF NIGERIA", code: "000016" },
  { name: "GTBANK PLC", code: "000013" },
  { name: "KUDA MICROFINANCE BANK", code: "090267" },
  { name: "MONIEPOINT MICROFINANCE BANK", code: "090405" },
  { name: "OPAY", code: "100004" },
  { name: "PALMPAY", code: "100033" },
  { name: "STANBIC IBTC BANK", code: "000012" },
  { name: "STERLING BANK", code: "000001" },
  { name: "UNITED BANK FOR AFRICA", code: "000004" },
  { name: "WEMA BANK", code: "000017" },
  { name: "ZENITH BANK", code: "000015" }
];

export const INITIAL_SETTINGS: GlobalSettings = {
  minWithdrawal: 5000,
  maxInvestment: 500000,
  defaultDuration: 30,
  defaultRoi: 26,
  adminEmail: ADMIN_EMAIL,
  telegramAdminLink: 'https://t.me/mpro_admin',
  telegramChannelLink: 'https://t.me/mpro_official',
  userPanelBackgroundUrl: '',
  isUserPanelVideo: false,
  welcomeBackgroundUrl: '',
  isWelcomeVideo: false,
  authBackgroundUrl: '',
  isAuthVideo: false,
  isWithdrawalMaintenance: false,
  isGlobalMaintenance: false
};

export const INITIAL_PRODUCTS: Product[] = [
  { id: '1', name: 'Motorcycle Unit', price: 3500, dailyRoi: 26, duration: 30, imageUrl: 'https://images.unsplash.com/photo-1558981403-c5f91cbba527?auto=format&fit=crop&q=80&w=600' },
  { id: '2', name: 'Compact Car', price: 5000, dailyRoi: 26, duration: 30, imageUrl: 'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?auto=format&fit=crop&q=80&w=600' },
  { id: '3', name: 'Sedan Vehicle', price: 10000, dailyRoi: 26, duration: 30, imageUrl: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&q=80&w=600' },
  { id: '4', name: 'Delivery Van', price: 25000, dailyRoi: 26, duration: 30, imageUrl: 'https://images.unsplash.com/photo-1519003722824-194d4455a60c?auto=format&fit=crop&q=80&w=600' },
  { id: '5', name: 'Luxury SUV', price: 50000, dailyRoi: 26, duration: 30, imageUrl: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&q=80&w=600' },
  { id: '6', name: 'Studio Apartment', price: 75000, dailyRoi: 26, duration: 30, imageUrl: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&q=80&w=600' },
  { id: '7', name: 'One-Bedroom Flat', price: 100000, dailyRoi: 26, duration: 30, imageUrl: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&q=80&w=600' },
  { id: '8', name: 'Family Bungalow', price: 150000, dailyRoi: 26, duration: 30, imageUrl: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&q=80&w=600' },
  { id: '9', name: 'Duplex Residence', price: 250000, dailyRoi: 26, duration: 30, imageUrl: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&q=80&w=600' },
  { id: '10', name: 'Mini Estate', price: 350000, dailyRoi: 26, duration: 30, imageUrl: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&q=80&w=600' },
  { id: '11', name: 'Residential Plot', price: 500000, dailyRoi: 26, duration: 30, imageUrl: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&q=80&w=600' },
];
