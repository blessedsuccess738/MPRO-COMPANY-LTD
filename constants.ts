
import { Product, GlobalSettings } from './types';

export const APP_NAME = 'MPRO INVEST';
export const ADMIN_EMAIL = 'blessedsuccess538@gmail.com';
export const CURRENCY = '₦';

export const NIGERIAN_BANKS = [
  "Access Bank", "Citibank", "Diamond Bank", "Ecobank Nigeria", "Fidelity Bank Nigeria",
  "First Bank of Nigeria", "First City Monument Bank", "Guaranty Trust Bank",
  "Heritage Bank", "Keystone Bank", "Kuda Bank", "Moniepoint MFB", "OPay", "Palmpay",
  "Polaris Bank", "Providus Bank", "Stanbic IBTC Bank", "Standard Chartered Bank",
  "Sterling Bank", "Suntrust Bank", "Union Bank of Nigeria", "United Bank for Africa",
  "Unity Bank", "Wema Bank", "Zenith Bank"
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
  isWithdrawalMaintenance: false
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
