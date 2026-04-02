import { useState, useEffect, useMemo, useCallback, FormEvent } from 'react';
import { 
  Search, 
  ShoppingCart, 
  User, 
  Plus, 
  Minus, 
  Clock, 
  Star,
  ArrowLeft,
  CheckCircle2,
  LogOut,
  Bell,
  ChevronRight,
  Wallet,
  Package,
  X,
  CreditCard,
  Smartphone,
  Sun,
  Moon
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// --- Types ---
interface FoodItem {
  id: number;
  name: string;
  category: string;
  price: number;
  description: string;
  emoji: string;
  isVeg: boolean;
  rating: number;
  preparationTime: number;
  image: string;
}

interface CartItem extends FoodItem {
  qty: number;
}

type PaymentMethodType = 'WALLET' | 'UPI' | 'CARD' | 'NETBANKING';

interface UserData {
  name: string;
  email: string;
  walletBalance: number;
  brewPoints: number;
  department: string;
  floor: string;
  employeeId: string;
}

type OrderStatus = 'PREPARING' | 'IN_KITCHEN' | 'OUT_FOR_DELIVERY' | 'DELIVERED';

interface Order {
  id: string;
  status: OrderStatus;
  date: string;
  total: number;
  items: string;
  itemDetails: { name: string; qty: number; price: number; emoji: string }[];
}

// --- Constants ---
const MENU_DATA: FoodItem[] = [
  {id:1,name:'Masala Dosa',category:'South Indian',price:55,description:'Crispy rice crepe with spiced potato filling & chutneys',emoji:'🫓',isVeg:true,rating:4.5,preparationTime:10,image:'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=800&q=90&fit=crop&crop=center'},
  {id:2,name:'Poha',category:'Breakfast',price:35,description:'Flattened rice tossed with veggies, mustard & curry leaves',emoji:'🍚',isVeg:true,rating:4.2,preparationTime:8,image:'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=800&q=90&fit=crop&crop=center'},
  {id:3,name:'Idli Sambar',category:'South Indian',price:45,description:'Soft steamed rice cakes with lentil soup & coconut chutney',emoji:'⚪',isVeg:true,rating:4.7,preparationTime:5,image:'https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=800&q=90&fit=crop&crop=center'},
  {id:4,name:'Veg Biryani',category:'Rice',price:95,description:'Fragrant basmati with seasonal vegetables & whole spices',emoji:'🍛',isVeg:true,rating:4.4,preparationTime:20,image:'https://images.unsplash.com/photo-1543353071-873f17a7a088?w=1200&q=90&fit=crop'},
  {id:5,name:'Chicken Biryani',category:'Rice',price:130,description:'Aromatic basmati layered with tender marinated chicken',emoji:'🍗',isVeg:false,rating:4.8,preparationTime:25,image:'https://images.unsplash.com/photo-1631515243349-e0cb75fb8d3a?w=1200&q=90&fit=crop'},
  {id:6,name:'Dal Tadka',category:'Dal',price:65,description:'Yellow lentils tempered with ghee, garlic & cumin',emoji:'🍲',isVeg:true,rating:4.3,preparationTime:12,image:'https://images.unsplash.com/photo-1547592180-85f173990554?w=800&q=90&fit=crop&crop=center'},
  {id:7,name:'Paneer Butter Masala',category:'Curry',price:110,description:'Soft cottage cheese in rich tomato-butter-cream gravy',emoji:'🧀',isVeg:true,rating:4.6,preparationTime:15,image:'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=800&q=90&fit=crop&crop=center'},
  {id:8,name:'Filter Coffee',category:'Beverages',price:25,description:'Freshly brewed South Indian decoction with frothy milk',emoji:'☕',isVeg:true,rating:4.9,preparationTime:3,image:'https://images.unsplash.com/photo-1511920170033-f8396924c348?w=800&q=90&fit=crop&crop=center'},
  {id:9,name:'Masala Chai',category:'Beverages',price:20,description:'Ginger & cardamom spiced tea with full-cream milk',emoji:'🍵',isVeg:true,rating:4.8,preparationTime:3,image:'https://images.unsplash.com/photo-1597318181409-cf64d0b5d8a2?w=800&q=90&fit=crop&crop=center'},
  {id:10,name:'Veg Sandwich',category:'Snacks',price:50,description:'Toasted bread with cucumber, tomato, cheese & mint chutney',emoji:'🥪',isVeg:true,rating:4.3,preparationTime:7,image:'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=800&q=90&fit=crop&crop=center'},
];

const CATEGORIES = ['All', 'Breakfast', 'South Indian', 'Rice', 'Curry', 'Dal', 'Snacks', 'Beverages'];

// --- Components ---

const Toast = ({ msg, type }: { msg: string; type: 'success' | 'error' | 'info' }) => {
  const bg = type === 'success' ? 'bg-green-500' : type === 'error' ? 'bg-red-500' : 'bg-blue-500';
  return (
    <motion.div 
      initial={{ y: 50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 50, opacity: 0 }}
      className={`fixed bottom-8 right-8 z-[9999] px-6 py-3 rounded-2xl text-white font-bold flex items-center gap-3 shadow-2xl ${bg}`}
    >
      {type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : type === 'error' ? <X className="w-5 h-5" /> : <Bell className="w-5 h-5" />}
      {msg}
    </motion.div>
  );
};

export default function App() {
  const [page, setPage] = useState<'menu' | 'orders' | 'profile'>('menu');
  const [user, setUser] = useState<UserData | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [walletBal, setWalletBal] = useState(500);
  const [search, setSearch] = useState('');
  const [selectedCat, setSelectedCat] = useState('All');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [isWalletOpen, setIsWalletOpen] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState<{ amount: number; id: string } | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [wishlist, setWishlist] = useState<number[]>([]);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethodType>('WALLET');
  const [promoCode, setPromoCode] = useState('');
  const [isPromoApplied, setIsPromoApplied] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [currentPaymentOrder, setCurrentPaymentOrder] = useState<{ id: string; amount: number } | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('qwikbrew-theme');
    return (saved as 'light' | 'dark') || 'dark';
  });
  const [orders, setOrders] = useState<Order[]>([
    { 
      id: 'QB-2024-001', 
      status: 'DELIVERED', 
      date: '20 Mar, 09:30 AM', 
      total: 190, 
      items: 'Masala Dosa x2, Coffee x2',
      itemDetails: [
        { name: 'Masala Dosa', qty: 2, price: 55, emoji: '🫓' },
        { name: 'Filter Coffee', qty: 2, price: 25, emoji: '☕' }
      ]
    },
    { 
      id: 'QB-2024-002', 
      status: 'PREPARING', 
      date: 'Today, 12:15 PM', 
      total: 95, 
      items: 'Veg Biryani x1',
      itemDetails: [
        { name: 'Veg Biryani', qty: 1, price: 95, emoji: '🍛' }
      ]
    }
  ]);

  // Auth check
  useEffect(() => {
    const savedUser = localStorage.getItem('qb_user');
    if (savedUser) setUser(JSON.parse(savedUser));

    const savedWishlist = localStorage.getItem('qb_wishlist');
    if (savedWishlist) setWishlist(JSON.parse(savedWishlist));
  }, []);

  // Save wishlist to localStorage
  useEffect(() => {
    localStorage.setItem('qb_wishlist', JSON.stringify(wishlist));
  }, [wishlist]);

  // Load notification preference
  useEffect(() => {
    const saved = localStorage.getItem('qb_notifications');
    if (saved === 'true' && Notification.permission === 'granted') {
      setNotificationsEnabled(true);
    }
  }, []);

  const sendNotification = useCallback((title: string, body: string) => {
    if (notificationsEnabled && Notification.permission === 'granted') {
      new Notification(title, {
        body,
        icon: 'https://picsum.photos/seed/coffee/100/100'
      });
    }
  }, [notificationsEnabled]);

  const requestNotificationPermission = async () => {
    if (!('Notification' in window)) {
      showToast('Notifications not supported in this browser', 'error');
      return;
    }

    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      setNotificationsEnabled(true);
      localStorage.setItem('qb_notifications', 'true');
      showToast('Notifications enabled!', 'success');
      sendNotification('QwikBrew', 'You will now receive updates about your orders.');
    } else {
      setNotificationsEnabled(false);
      localStorage.setItem('qb_notifications', 'false');
      showToast('Notification permission denied', 'error');
    }
  };

  const toggleNotifications = () => {
    if (notificationsEnabled) {
      setNotificationsEnabled(false);
      localStorage.setItem('qb_notifications', 'false');
      showToast('Notifications disabled', 'info');
    } else {
      requestNotificationPermission();
    }
  };

  // Simulate real-time status updates
  useEffect(() => {
    const interval = setInterval(() => {
      setOrders(prev => prev.map(order => {
        if (order.status === 'DELIVERED') return order;
        
        const statuses: OrderStatus[] = ['PREPARING', 'IN_KITCHEN', 'OUT_FOR_DELIVERY', 'DELIVERED'];
        const currentIndex = statuses.indexOf(order.status);
        
        // 10% chance to progress status
        if (Math.random() > 0.9 && currentIndex < statuses.length - 1) {
          const nextStatus = statuses[currentIndex + 1];
          
          // Send notification for status update
          if (nextStatus === 'OUT_FOR_DELIVERY') {
            sendNotification('Order Update 🛵', `Your order ${order.id} is out for delivery!`);
          } else if (nextStatus === 'DELIVERED') {
            sendNotification('Order Delivered ✅', `Your order ${order.id} has been delivered. Enjoy!`);
          }
          
          return { ...order, status: nextStatus };
        }
        return order;
      }));

      // Random promotion/loyalty notification (1% chance every 5s)
      if (Math.random() > 0.99) {
        const promos = [
          { t: 'Flash Sale! ⚡', b: 'Get 20% off on all cold brews for the next 1 hour.' },
          { t: 'Loyalty Reward 🎁', b: 'You just earned 50 bonus BrewPoints! Keep brewing.' },
          { t: 'New Arrival ☕', b: 'Try our new Ethiopian Yirgacheffe, now available at the counter.' }
        ];
        const promo = promos[Math.floor(Math.random() * promos.length)];
        sendNotification(promo.t, promo.b);
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [sendNotification]);

  const showToast = useCallback((msg: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const handleLogin = (e: FormEvent) => {
    e.preventDefault();
    const demoUser: UserData = {
      name: 'Sandeep Kumar',
      email: 'sandeep@company.com',
      walletBalance: 500,
      brewPoints: 247,
      department: 'Engineering',
      floor: '4th',
      employeeId: 'EMP-001'
    };
    setUser(demoUser);
    localStorage.setItem('qb_user', JSON.stringify(demoUser));
    showToast('Welcome back, Sandeep!', 'success');
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('qb_user');
    showToast('Signed out successfully', 'info');
  };

  const filteredMenu = useMemo(() => {
    return MENU_DATA.filter(item => {
      const matchesCat = selectedCat === 'All' || item.category === selectedCat;
      const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase());
      return matchesCat && matchesSearch;
    });
  }, [selectedCat, search]);

  const addToCart = (item: FoodItem) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) return prev.map(i => i.id === item.id ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { ...item, qty: 1 }];
    });
    setIsCartOpen(true);
    showToast(`${item.name} added to cart`);
  };

  useEffect(() => {
    localStorage.setItem('qwikbrew-theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
    showToast(`Switched to ${theme === 'light' ? 'dark' : 'light'} mode`, 'info');
  };

  const toggleWishlist = (id: number) => {
    setWishlist(prev => {
      const isPresent = prev.includes(id);
      const itemName = MENU_DATA.find(i => i.id === id)?.name;
      if (isPresent) {
        showToast(`${itemName} removed from wishlist`, 'info');
        return prev.filter(i => i !== id);
      } else {
        showToast(`${itemName} added to wishlist`, 'success');
        return [...prev, id];
      }
    });
  };

  const removeFromCart = (id: number) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === id);
      if (existing && existing.qty > 1) return prev.map(i => i.id === id ? { ...i, qty: i.qty - 1 } : i);
      return prev.filter(i => i.id !== id);
    });
  };

  const cartTotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const gst = cartTotal * 0.05;
  const discount = isPromoApplied ? (cartTotal + gst) * 0.1 : 0;
  const grandTotal = cartTotal + gst - discount;

  const handleApplyPromo = () => {
    if (promoCode.toUpperCase() === 'QWIKBREW10') {
      setIsPromoApplied(true);
      showToast('Promo code applied! 10% discount added.', 'success');
    } else {
      setIsPromoApplied(false);
      showToast('Invalid promo code', 'error');
    }
  };

  const placeOrder = () => {
    if (selectedPaymentMethod === 'WALLET' && walletBal < grandTotal) {
      showToast('Insufficient wallet balance', 'error');
      return;
    }

    if (selectedPaymentMethod === 'WALLET') {
      setWalletBal(prev => prev - grandTotal);
    } else if (selectedPaymentMethod === 'UPI') {
      const orderId = Math.random().toString(36).substring(2, 11).toUpperCase();
      setCurrentPaymentOrder({ id: orderId, amount: grandTotal });
      setIsPaymentModalOpen(true);
      return; // Wait for QR payment confirmation
    } else {
      // Simulate external payment gateway for CARD/NETBANKING
      showToast(`Redirecting to ${selectedPaymentMethod} gateway...`, 'info');
    }

    const newOrder = { 
      amount: grandTotal, 
      id: Math.random().toString(36).substring(2, 11).toUpperCase() 
    };
    
    finalizeOrder(newOrder);
  };

  const finalizeOrder = (orderData: { id: string; amount: number }) => {
    const delay = selectedPaymentMethod === 'WALLET' ? 0 : 1500;
    
    setTimeout(() => {
      setOrderSuccess(orderData);
      setOrders(prev => [
        { 
          id: orderData.id, 
          status: 'PREPARING', 
          date: 'Just Now', 
          total: orderData.amount, 
          items: cart.map(i => `${i.name} x${i.qty}`).join(', '),
          itemDetails: cart.map(i => ({ name: i.name, qty: i.qty, price: i.price, emoji: i.emoji }))
        },
        ...prev
      ]);
      setCart([]);
      setIsPromoApplied(false);
      setPromoCode('');
      setIsPaymentModalOpen(false);
      showToast('Order placed successfully!', 'success');
    }, delay);
  };

  const cancelOrder = (orderId: string) => {
    const orderToCancel = orders.find(o => o.id === orderId);
    if (!orderToCancel) return;

    setWalletBal(prev => prev + orderToCancel.total);
    setOrders(prev => prev.filter(o => o.id !== orderId));
    setSelectedOrder(null);
    setIsCancelModalOpen(false);
    showToast(`Order ${orderId} cancelled and ₹${orderToCancel.total.toFixed(2)} refunded`, 'success');
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-full max-w-md bg-[var(--s1)] border border-[var(--b2)] rounded-[32px] p-10 shadow-2xl"
        >
          <div className="flex items-center gap-4 mb-8">
            <div className="sb-logo text-white">☕</div>
            <div>
              <h1 className="text-2xl font-serif italic text-[var(--tx)]">Qwik<span className="text-[var(--brand)] not-italic">Brew</span></h1>
              <p className="text-xs text-[var(--tx4)] font-bold uppercase tracking-widest">Corporate Café Portal</p>
            </div>
          </div>
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-[10px] font-bold text-[var(--tx4)] uppercase tracking-widest mb-2">Work Email</label>
              <input 
                type="email" 
                defaultValue="sandeep@company.com"
                className="w-full bg-[var(--s2)] border border-[var(--b1)] rounded-xl px-4 py-3 text-sm text-white focus:border-[var(--brand)] transition-all outline-none"
                placeholder="you@company.com"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-[var(--tx4)] uppercase tracking-widest mb-2">Password</label>
              <input 
                type="password" 
                defaultValue="password"
                className="w-full bg-[var(--s2)] border border-[var(--b1)] rounded-xl px-4 py-3 text-sm text-white focus:border-[var(--brand)] transition-all outline-none"
                placeholder="••••••••"
              />
            </div>
            <button type="submit" className="place-btn py-4 text-base">Sign In →</button>
          </form>
        </motion.div>
        <AnimatePresence>{toast && <Toast {...toast} />}</AnimatePresence>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--bg)] text-[var(--tx)]">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sb-brand">
          <div className="sb-logo text-white">☕</div>
          <div>
            <div className="fd text-lg text-[var(--tx)]">Qwik<span className="text-[var(--brand)] not-italic">Brew</span></div>
            <div className="text-[9px] text-[var(--tx4)] font-bold uppercase tracking-widest">Corporate Café</div>
          </div>
        </div>

        <div className="sb-wallet" onClick={() => setIsWalletOpen(true)}>
          <div className="text-[9px] text-[rgba(232,160,0,.5)] font-bold uppercase tracking-widest mb-1">Café Wallet</div>
          <div className="fd text-2xl text-[var(--gold-lt)]">₹{walletBal.toFixed(2)}</div>
          <div className="text-[10px] text-[rgba(232,160,0,.4)] mt-1">{user.name.split(' ')[0]}'s balance</div>
          <button className="mt-3 text-[10px] font-bold text-[var(--gold-lt)] bg-[rgba(232,160,0,.12)] border border-[rgba(232,160,0,.22)] px-3 py-1.5 rounded-full hover:bg-[rgba(232,160,0,.2)] transition-all">
            + Recharge
          </button>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto no-scrollbar">
          <div className="text-[8px] font-bold text-[var(--tx4)] uppercase tracking-widest px-3 mb-2">Navigation</div>
          {[
            { id: 'menu', label: 'Menu', icon: '🍽️' },
            { id: 'wishlist', label: 'Wishlist', icon: '❤️' },
            { id: 'orders', label: 'My Orders', icon: '📦' },
            { id: 'profile', label: 'Profile', icon: '👤' }
          ].map(item => (
            <div 
              key={item.id}
              onClick={() => setPage(item.id as any)}
              className={`sb-item ${page === item.id ? 'active' : ''}`}
            >
              <span className="text-lg">{item.icon}</span>
              {item.label}
              {item.id === 'menu' && cart.length > 0 && (
                <span className="ml-auto bg-linear-to-br from-[var(--brand)] to-[var(--brand-lt)] text-white text-[9px] font-extrabold px-2 py-0.5 rounded-full shadow-lg">
                  {cart.reduce((s, i) => s + i.qty, 0)}
                </span>
              )}
            </div>
          ))}
        </nav>

        <div className="p-4 border-t border-[var(--b1)] flex items-center gap-3 bg-linear-to-t from-[rgba(255,87,34,.03)] to-transparent">
          <div className="w-9 h-9 rounded-full bg-linear-to-br from-[var(--brand)] to-[var(--gold)] flex items-center justify-center font-bold text-white text-xs shadow-lg">
            {user.name.split(' ').map(n => n[0]).join('')}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-bold truncate">{user.name}</div>
            <div className="text-[10px] text-[var(--tx4)] truncate">{user.email}</div>
          </div>
          <button onClick={handleLogout} className="p-2 text-[var(--tx4)] hover:text-red-400 transition-colors">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main">
        <header className="topbar">
          <div className="fd text-lg flex-1 text-[var(--tx)]">{page === 'menu' ? 'Menu' : page === 'orders' ? 'My Orders' : 'Profile'}</div>
          {page === 'menu' && (
            <div className="relative w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--tx4)]" />
              <input 
                type="text" 
                placeholder="Search menu items..."
                className="w-full bg-[var(--s2)] border border-[var(--b1)] rounded-full pl-10 pr-4 py-2 text-xs text-white focus:border-[var(--brand)] transition-all outline-none"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          )}
          <div className="flex items-center gap-3">
            <button 
              onClick={toggleTheme}
              className="p-2 bg-[var(--s2)] border border-[var(--b1)] rounded-full text-[var(--tx3)] hover:text-[var(--brand)] transition-all relative group"
              title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            >
              {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            </button>

            <div className="flex items-center gap-2 px-3 py-1.5 bg-[var(--s2)] border border-[var(--b1)] rounded-full text-[10px] font-bold text-white">
              <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse shadow-[0_0_6px_rgba(74,222,128,.6)]" />
              Café Open
            </div>
            <div className="px-3 py-1.5 bg-[var(--s2)] border border-[var(--b1)] rounded-full text-[10px] font-bold text-[var(--gold-lt)]">
              ₹{walletBal.toFixed(2)}
            </div>
            <button 
              onClick={() => setIsCartOpen(true)}
              className="relative p-2 bg-[var(--s2)] border border-[var(--b1)] rounded-full text-[var(--tx3)] hover:text-[var(--brand)] transition-all"
            >
              <ShoppingCart className="w-5 h-5" />
              {cart.length > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-[var(--brand)] text-white text-[10px] font-black rounded-full flex items-center justify-center shadow-lg">
                  {cart.reduce((s, i) => s + i.qty, 0)}
                </span>
              )}
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-hidden flex">
          <div className="flex-1 overflow-y-auto p-7 no-scrollbar">
            {page === 'menu' && (
              <div className="space-y-6">
                <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
                  {CATEGORIES.map(cat => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCat(cat)}
                      className={`px-5 py-2 rounded-full text-xs font-bold transition-all border ${
                        selectedCat === cat 
                          ? 'bg-linear-to-br from-[var(--brand)] to-[var(--brand-lt)] border-transparent text-white shadow-xl' 
                          : 'bg-[var(--s1)] border-[var(--b1)] text-[var(--tx3)] hover:border-[var(--b2)]'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                  <AnimatePresence mode="popLayout">
                    {filteredMenu.map((item, idx) => (
                      <motion.div 
                        key={item.id}
                        layout
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className="mcard"
                      >
                        <div className="mc-imgwrap">
                          <img 
                            src={item.image} 
                            alt={item.name} 
                            className="mc-img" 
                            referrerPolicy="no-referrer"
                          />
                          <div className="absolute inset-0 bg-linear-to-t from-black/60 to-transparent opacity-70" />
                          <div className="absolute top-3 left-3 flex gap-2">
                            <span className={`mc-tag ${item.isVeg ? 'bg-green-500/80' : 'bg-red-500/80'} text-white`}>
                              {item.isVeg ? '● Veg' : '● Non-Veg'}
                            </span>
                            {item.rating >= 4.7 && <span className="mc-tag bg-orange-500/90 text-black font-black">⭐ Top Pick</span>}
                          </div>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleWishlist(item.id);
                            }}
                            className={`absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-md border transition-all ${
                              wishlist.includes(item.id) 
                                ? 'bg-red-500 border-red-400 text-white shadow-lg shadow-red-500/20' 
                                : 'bg-black/40 border-white/10 text-white hover:bg-black/60'
                            }`}
                          >
                            <Star className={`w-4 h-4 ${wishlist.includes(item.id) ? 'fill-current' : ''}`} />
                          </button>
                          <div className="absolute bottom-3 right-3 bg-black/50 backdrop-blur-md border border-white/10 px-2.5 py-1 rounded-full text-[11px] font-bold text-[var(--gold-lt)]">
                            ★ {item.rating}
                          </div>
                        </div>
                        <div className="p-4">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-[10px] text-[var(--tx4)] font-mono bg-[var(--s3)] px-2 py-0.5 rounded-full border border-[var(--b1)]">
                              ⏱ {item.preparationTime} min
                            </span>
                          </div>
                          <div className="fd text-base mb-1 text-white">{item.name}</div>
                          <p className="text-[11px] text-[var(--tx3)] line-clamp-2 mb-4 h-9">{item.description}</p>
                          <div className="flex justify-between items-center">
                            <div className="fm text-lg">
                              <span className="text-xs text-[var(--brand-xlt)] mr-1">₹</span>
                              <span className="bg-linear-to-r from-[var(--brand-xlt)] to-[var(--gold-lt)] bg-clip-text text-transparent">{item.price}</span>
                            </div>
                            {cart.find(c => c.id === item.id) ? (
                              <div className="flex items-center gap-3 bg-[var(--brand-gl3)] border border-[rgba(255,87,34,.2)] rounded-full px-2 py-1">
                                <button onClick={() => removeFromCart(item.id)} className="w-7 h-7 rounded-full bg-[var(--s2)] flex items-center justify-center text-[var(--brand)] hover:bg-[var(--brand)] hover:text-white transition-all">
                                  <Minus className="w-3 h-3" />
                                </button>
                                <span className="fm text-xs font-bold w-4 text-center text-white">{cart.find(c => c.id === item.id)?.qty}</span>
                                <button onClick={() => addToCart(item)} className="w-7 h-7 rounded-full bg-[var(--s2)] flex items-center justify-center text-[var(--brand)] hover:bg-[var(--brand)] hover:text-white transition-all">
                                  <Plus className="w-3 h-3" />
                                </button>
                              </div>
                            ) : (
                              <button 
                                onClick={() => addToCart(item)}
                                className="w-9 h-9 rounded-full bg-linear-to-br from-[var(--brand)] to-[var(--brand-lt)] text-white flex items-center justify-center shadow-lg shadow-[rgba(255,87,34,.3)] hover:scale-110 transition-all"
                              >
                                <Plus className="w-5 h-5" />
                              </button>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            )}

            {page === 'wishlist' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="fd text-2xl text-white">Your Wishlist</h2>
                    <p className="text-xs text-[var(--tx3)]">Items you've saved for later</p>
                  </div>
                  <div className="text-[10px] font-bold text-[var(--tx4)] uppercase tracking-widest">
                    {wishlist.length} {wishlist.length === 1 ? 'item' : 'items'} saved
                  </div>
                </div>

                {wishlist.length === 0 ? (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="py-20 flex flex-col items-center justify-center text-center bg-[var(--s1)] border border-dashed border-[var(--b1)] rounded-[32px]"
                  >
                    <div className="w-24 h-24 bg-[var(--s2)] rounded-full flex items-center justify-center text-5xl mb-6 grayscale opacity-50">
                      ❤️
                    </div>
                    <h3 className="fd text-xl text-white mb-2">Wishlist is empty</h3>
                    <p className="text-xs text-[var(--tx3)] mb-8 max-w-[200px] mx-auto">
                      Save your favorite brews and snacks here to order them later.
                    </p>
                    <button 
                      onClick={() => setPage('menu')}
                      className="place-btn px-8 py-3 w-auto text-xs"
                    >
                      Browse Menu
                    </button>
                  </motion.div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                    <AnimatePresence mode="popLayout">
                      {MENU_DATA.filter(item => wishlist.includes(item.id)).map((item, idx) => (
                        <motion.div 
                          key={item.id}
                          layout
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                          transition={{ delay: idx * 0.05 }}
                          className="mcard"
                        >
                          <div className="mc-imgwrap">
                            <img 
                              src={item.image} 
                              alt={item.name} 
                              className="mc-img" 
                              referrerPolicy="no-referrer"
                            />
                            <div className="absolute inset-0 bg-linear-to-t from-black/60 to-transparent opacity-70" />
                            <button 
                              onClick={() => toggleWishlist(item.id)}
                              className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center bg-red-500 border border-red-400 text-white shadow-lg shadow-red-500/20"
                            >
                              <Star className="w-4 h-4 fill-current" />
                            </button>
                          </div>
                          <div className="p-4">
                            <div className="fd text-base mb-1 text-[var(--tx)]">{item.name}</div>
                            <div className="flex justify-between items-center mt-4">
                              <div className="fm text-lg text-[var(--brand-xlt)]">₹{item.price}</div>
                              <button 
                                onClick={() => addToCart(item)}
                                className="w-9 h-9 rounded-full bg-linear-to-br from-[var(--brand)] to-[var(--brand-lt)] text-white flex items-center justify-center shadow-lg"
                              >
                                <Plus className="w-5 h-5" />
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                )}
              </div>
            )}

            {page === 'orders' && (
              <div className="max-w-4xl mx-auto space-y-8">
                <div className="flex justify-between items-end">
                  <div className="grid grid-cols-3 gap-4 flex-1">
                    {[
                      { label: 'Total Orders', val: orders.length, icon: '📦' },
                      { label: 'Delivered', val: orders.filter(o => o.status === 'DELIVERED').length, icon: '✅' },
                      { label: 'BrewPoints', val: user.brewPoints, icon: '⭐' }
                    ].map(stat => (
                      <div key={stat.label} className="bg-[var(--s1)] border border-[var(--b1)] rounded-2xl p-5 relative overflow-hidden group">
                        <div className="text-2xl mb-2">{stat.icon}</div>
                        <div className="fm text-2xl font-bold mb-1 text-white">{stat.val}</div>
                        <div className="text-[10px] text-[var(--tx3)] uppercase tracking-widest">{stat.label}</div>
                      </div>
                    ))}
                  </div>
                  {orders.length > 0 && (
                    <button 
                      onClick={() => setOrders([])}
                      className="ml-6 mb-2 text-[10px] font-bold text-[var(--tx4)] hover:text-red-400 transition-colors uppercase tracking-widest"
                    >
                      Clear History
                    </button>
                  )}
                </div>

                <div className="space-y-4">
                  {orders.length === 0 ? (
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="py-20 flex flex-col items-center justify-center text-center bg-[var(--s1)] border border-dashed border-[var(--b1)] rounded-[32px]"
                    >
                      <div className="relative mb-8">
                        <motion.div 
                          animate={{ 
                            scale: [1, 1.05, 1],
                            rotate: [0, 2, -2, 0]
                          }}
                          transition={{ duration: 5, repeat: Infinity }}
                          className="w-32 h-32 bg-linear-to-br from-[var(--s2)] to-transparent rounded-full flex items-center justify-center text-6xl shadow-inner"
                        >
                          🥡
                        </motion.div>
                        <div className="absolute -bottom-2 -right-2 w-12 h-12 bg-[var(--s3)] border border-[var(--b1)] rounded-2xl flex items-center justify-center text-2xl shadow-lg">
                          ❓
                        </div>
                      </div>
                      <h3 className="fd text-2xl text-white mb-2">No orders found</h3>
                      <p className="text-sm text-[var(--tx3)] mb-8 max-w-xs mx-auto leading-relaxed">
                        Your order history is currently empty. Time to brew something new!
                      </p>
                      <button 
                        onClick={() => setPage('menu')}
                        className="place-btn px-10 py-4 w-auto text-sm"
                      >
                        Browse Menu & Order →
                      </button>
                    </motion.div>
                  ) : (
                    orders.map(order => (
                      <div 
                        key={order.id} 
                        onClick={() => setSelectedOrder(order)}
                        className="bg-[var(--s1)] border border-[var(--b1)] rounded-2xl p-5 flex items-center gap-5 hover:border-[var(--brand)] transition-all cursor-pointer group relative overflow-hidden"
                      >
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl ${
                          order.status === 'DELIVERED' ? 'bg-green-500/10 text-green-500' : 
                          order.status === 'OUT_FOR_DELIVERY' ? 'bg-blue-500/10 text-blue-500' :
                          'bg-orange-500/10 text-orange-500'
                        }`}>
                          {order.status === 'DELIVERED' ? '✓' : order.status === 'OUT_FOR_DELIVERY' ? '🛵' : '⏱'}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-1">
                            <span className="fm text-sm font-bold text-[var(--tx)]">{order.id}</span>
                            <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${
                              order.status === 'DELIVERED' ? 'bg-green-500/20 text-green-500' : 
                              order.status === 'OUT_FOR_DELIVERY' ? 'bg-blue-500/20 text-blue-500' :
                              'bg-orange-500/20 text-orange-500'
                            }`}>
                              {order.status.replace(/_/g, ' ')}
                            </span>
                          </div>
                          <div className="text-[11px] text-[var(--tx3)]">{order.items}</div>
                        </div>
                        <div className="text-right">
                          <div className="fm text-base font-bold text-white">₹{order.total.toFixed(2)}</div>
                          <div className="text-[10px] text-[var(--tx4)]">{order.date}</div>
                        </div>
                        <div className="absolute right-0 top-0 bottom-0 w-1 bg-[var(--brand)] opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {page === 'profile' && (
              <div className="max-w-4xl mx-auto space-y-6">
                <div className="bg-linear-to-br from-[var(--s2)] to-[var(--s3)] border border-[var(--b1)] rounded-[32px] p-8 flex items-center gap-8 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-[rgba(255,87,34,.04)] rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2" />
                  <div className="relative">
                    <div className="w-24 h-24 rounded-full bg-linear-to-br from-[var(--brand)] to-[var(--gold)] flex items-center justify-center text-3xl font-black text-white shadow-2xl border-4 border-[var(--s2)]">
                      {user.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div className="absolute bottom-1 right-1 w-5 h-5 bg-green-500 border-4 border-[var(--s2)] rounded-full" />
                  </div>
                  <div className="flex-1 relative">
                    <h2 className="fd text-3xl mb-1 text-white">{user.name}</h2>
                    <p className="fm text-sm text-[var(--tx3)] mb-4">{user.email}</p>
                    <div className="flex gap-6">
                      <div className="text-xs text-[var(--tx3)]">Dept: <span className="text-[var(--tx)] font-bold">{user.department}</span></div>
                      <div className="text-xs text-[var(--tx3)]">Floor: <span className="text-[var(--tx)] font-bold">{user.floor}</span></div>
                      <div className="text-xs text-[var(--tx3)]">ID: <span className="text-[var(--tx)] font-bold">{user.employeeId}</span></div>
                    </div>
                  </div>
                  <div className="px-4 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-500 text-[10px] font-black tracking-widest uppercase">
                    ⭐ Gold Tier
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="bg-[#0c0800] border border-[rgba(232,160,0,.18)] rounded-3xl p-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-48 h-48 bg-[rgba(232,160,0,.06)] rounded-full blur-[50px] -translate-y-1/2 translate-x-1/2" />
                    <div className="text-[9px] text-[rgba(232,160,0,.5)] font-bold uppercase tracking-widest mb-2">Café Wallet</div>
                    <div className="fm text-4xl font-bold text-[var(--gold-lt)] mb-1">₹{walletBal.toFixed(2)}</div>
                    <div className="text-[11px] text-[rgba(232,160,0,.35)] mb-6">{user.name} · {user.email}</div>
                    <div className="flex gap-3">
                      <button onClick={() => setIsWalletOpen(true)} className="flex-1 bg-[rgba(232,160,0,.14)] border border-[rgba(232,160,0,.25)] text-[var(--gold-lt)] py-2.5 rounded-xl font-bold text-xs hover:bg-[rgba(232,160,0,.22)] transition-all">
                        + Recharge
                      </button>
                      <button className="flex-1 bg-[var(--s2)] border border-[var(--b2)] text-[var(--tx3)] py-2.5 rounded-xl font-bold text-xs hover:text-white transition-all">
                        History
                      </button>
                    </div>
                  </div>

                  <div className="bg-[var(--s1)] border border-[var(--b1)] rounded-3xl p-6">
                    <div className="flex justify-between items-center mb-4">
                      <div className="fd text-sm text-[var(--tx)]">BrewPoints</div>
                      <div className="text-[10px] text-[var(--brand-xlt)] font-bold cursor-pointer hover:underline">Redeem →</div>
                    </div>
                    <div className="text-4xl font-black text-[var(--brand)] mb-2">{user.brewPoints.toLocaleString()}</div>
                    <div className="text-[11px] text-[var(--tx3)] mb-4">Gold Tier · 253 pts to Platinum</div>
                    <div className="h-1.5 bg-[var(--s3)] rounded-full overflow-hidden mb-2">
                      <div className="h-full bg-linear-to-r from-[var(--brand)] to-[var(--gold-lt)] w-[75%]" />
                    </div>
                    <div className="flex justify-between text-[9px] text-[var(--tx4)] font-bold uppercase">
                      <span>Gold</span>
                      <span>Platinum</span>
                    </div>
                  </div>
                </div>

                {/* Theme Settings */}
                <div className="bg-[var(--s1)] border border-[var(--b1)] rounded-3xl p-8">
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <h3 className="fd text-xl text-[var(--tx)] mb-1">Theme Settings</h3>
                      <p className="text-xs text-[var(--tx4)]">Customize the appearance of your application.</p>
                    </div>
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl bg-[var(--s3)] text-[var(--tx4)]`}>
                      {theme === 'light' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <button 
                      onClick={() => setTheme('light')}
                      className={`p-5 rounded-2xl border transition-all text-left relative group ${
                        theme === 'light' 
                          ? 'bg-[var(--brand-gl3)] border-[var(--brand)] shadow-lg' 
                          : 'bg-[var(--s2)] border-[var(--b1)] hover:border-[var(--b2)]'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${theme === 'light' ? 'bg-[var(--brand)] text-white' : 'bg-[var(--s3)] text-[var(--tx4)]'}`}>
                          ☀️
                        </div>
                        {theme === 'light' && <div className="w-2 h-2 bg-[var(--brand)] rounded-full shadow-[0_0_8px_var(--brand)]" />}
                      </div>
                      <div className={`text-sm font-bold ${theme === 'light' ? 'text-white' : 'text-[var(--tx3)]'}`}>Light Mode</div>
                      <div className="text-[10px] text-[var(--tx4)] uppercase tracking-widest font-bold mt-1">Clean & Bright</div>
                    </button>

                    <button 
                      onClick={() => setTheme('dark')}
                      className={`p-5 rounded-2xl border transition-all text-left relative group ${
                        theme === 'dark' 
                          ? 'bg-[var(--brand-gl3)] border-[var(--brand)] shadow-lg' 
                          : 'bg-[var(--s2)] border-[var(--b1)] hover:border-[var(--b2)]'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${theme === 'dark' ? 'bg-[var(--brand)] text-white' : 'bg-[var(--s3)] text-[var(--tx4)]'}`}>
                          🌙
                        </div>
                        {theme === 'dark' && <div className="w-2 h-2 bg-[var(--brand)] rounded-full shadow-[0_0_8px_var(--brand)]" />}
                      </div>
                      <div className={`text-sm font-bold ${theme === 'dark' ? 'text-white' : 'text-[var(--tx3)]'}`}>Dark Mode</div>
                      <div className="text-[10px] text-[var(--tx4)] uppercase tracking-widest font-bold mt-1">Deep & Focused</div>
                    </button>
                  </div>
                </div>

                {/* Notification Settings */}
                <div className="bg-[var(--s1)] border border-[var(--b1)] rounded-3xl p-8">
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <h3 className="fd text-xl text-[var(--tx)] mb-1">Notification Settings</h3>
                      <p className="text-xs text-[var(--tx4)]">Manage how you receive updates about your orders and rewards.</p>
                    </div>
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl ${notificationsEnabled ? 'bg-[var(--brand)] text-white' : 'bg-[var(--s3)] text-[var(--tx4)]'}`}>
                      <Bell className="w-5 h-5" />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-5 bg-[var(--s2)] border border-[var(--b1)] rounded-2xl hover:border-[var(--brand)] transition-all group">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-[var(--s3)] flex items-center justify-center text-lg group-hover:bg-[var(--brand)] group-hover:text-white transition-all">
                          📱
                        </div>
                        <div>
                          <div className="text-sm font-bold text-[var(--tx)]">Push Notifications</div>
                          <div className="text-[10px] text-[var(--tx4)] uppercase tracking-widest font-bold">Status updates & Promos</div>
                        </div>
                      </div>
                      <button 
                        onClick={toggleNotifications}
                        className={`w-12 h-6 rounded-full relative transition-all duration-300 ${notificationsEnabled ? 'bg-[var(--brand)]' : 'bg-[var(--s3)]'}`}
                      >
                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-300 ${notificationsEnabled ? 'left-7' : 'left-1'}`} />
                      </button>
                    </div>

                    <div className="flex items-center justify-between p-5 bg-[var(--s2)] border border-[var(--b1)] rounded-2xl opacity-50 cursor-not-allowed">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-[var(--s3)] flex items-center justify-center text-lg">
                          📧
                        </div>
                        <div>
                          <div className="text-sm font-bold text-white">Email Summaries</div>
                          <div className="text-[10px] text-[var(--tx4)] uppercase tracking-widest font-bold">Weekly reports · Coming Soon</div>
                        </div>
                      </div>
                      <div className="w-12 h-6 rounded-full bg-[var(--s3)] relative">
                        <div className="absolute top-1 left-1 w-4 h-4 bg-[var(--tx4)] rounded-full" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Saved Payment Methods */}
                <div className="bg-[var(--s1)] border border-[var(--b1)] rounded-3xl p-8">
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <h3 className="fd text-xl text-[var(--tx)] mb-1">Saved Payment Methods</h3>
                      <p className="text-xs text-[var(--tx4)]">Quickly checkout using your preferred payment options.</p>
                    </div>
                    <button className="text-[10px] font-bold text-[var(--brand)] hover:underline uppercase tracking-widest">+ Add New</button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-5 bg-linear-to-br from-[#1a1a1a] to-[#0a0a0a] border border-[var(--b1)] rounded-2xl relative overflow-hidden group hover:border-[var(--brand)] transition-all">
                      <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <CreditCard className="w-12 h-12" />
                      </div>
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-8 h-5 bg-blue-600 rounded flex items-center justify-center text-[8px] font-black text-white italic">VISA</div>
                        <div className="text-[10px] text-[var(--tx4)] font-bold uppercase tracking-widest">Primary Card</div>
                      </div>
                      <div className="fm text-sm text-white mb-1">•••• •••• •••• 4242</div>
                      <div className="text-[9px] text-[var(--tx4)] uppercase">Expires 12/28</div>
                    </div>

                    <div className="p-5 bg-[var(--s2)] border border-[var(--b1)] rounded-2xl flex items-center justify-between group hover:border-[var(--brand)] transition-all">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-[var(--s3)] flex items-center justify-center text-lg text-[var(--tx4)] group-hover:text-[var(--brand)] transition-colors">
                          <Smartphone className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="text-sm font-bold text-white">sandeep@okaxis</div>
                          <div className="text-[10px] text-[var(--tx4)] uppercase tracking-widest font-bold">Default UPI ID</div>
                        </div>
                      </div>
                      <div className="w-5 h-5 rounded-full border-2 border-[var(--brand)] flex items-center justify-center">
                        <div className="w-2 h-2 bg-[var(--brand)] rounded-full" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Cart Drawer */}
          <AnimatePresence>
            {isCartOpen && (
              <>
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setIsCartOpen(false)}
                  className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
                />
                <motion.aside 
                  initial={{ x: '100%' }}
                  animate={{ x: 0 }}
                  exit={{ x: '100%' }}
                  transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                  className="cart-panel fixed right-0 top-0 h-full z-[101] shadow-[-20px_0_50px_rgba(0,0,0,0.5)]"
                >
                  <div className="p-5 border-b border-[var(--b1)] flex justify-between items-center bg-linear-to-b from-[rgba(255,87,34,.03)] to-transparent">
                    <div>
                      <div className="fd text-lg text-white">Cart</div>
                      <div className="text-[10px] text-[var(--tx3)] font-bold uppercase tracking-widest">
                        {cart.length} {cart.length === 1 ? 'item' : 'items'} selected
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      {cart.length > 0 && (
                        <button onClick={() => setCart([])} className="text-[10px] text-[var(--tx4)] font-bold hover:text-red-400 transition-colors uppercase tracking-widest">
                          Clear All
                        </button>
                      )}
                      <button onClick={() => setIsCartOpen(false)} className="p-2 hover:bg-[var(--s2)] rounded-xl transition-all text-[var(--tx4)]">
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto p-5 space-y-4 no-scrollbar">
                    {cart.length === 0 ? (
                      <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="h-full flex flex-col items-center justify-center text-center px-6"
                      >
                        <div className="relative mb-8">
                          <motion.div 
                            animate={{ 
                              scale: [1, 1.1, 1],
                              rotate: [0, 5, -5, 0]
                            }}
                            transition={{ 
                              duration: 4, 
                              repeat: Infinity,
                              ease: "easeInOut"
                            }}
                            className="w-24 h-24 bg-linear-to-br from-[var(--brand-gl)] to-transparent rounded-full flex items-center justify-center text-5xl shadow-2xl border border-white/5"
                          >
                            🛒
                          </motion.div>
                          <motion.div 
                            animate={{ opacity: [0.1, 0.3, 0.1] }}
                            transition={{ duration: 3, repeat: Infinity }}
                            className="absolute inset-0 bg-[var(--brand)] blur-3xl -z-10 rounded-full"
                          />
                        </div>
                        <h3 className="fd text-xl text-white mb-2">Your cart is empty</h3>
                        <p className="text-xs text-[var(--tx3)] mb-8 leading-relaxed max-w-[200px]">
                          Looks like you haven't added anything to your brew list yet.
                        </p>
                        <button 
                          onClick={() => setIsCartOpen(false)}
                          className="w-full py-4 bg-[var(--s2)] border border-[var(--b1)] rounded-2xl text-xs font-bold text-white hover:border-[var(--brand)] hover:text-[var(--brand)] transition-all shadow-lg"
                        >
                          Explore Menu
                        </button>
                      </motion.div>
                    ) : (
                      cart.map(item => (
                        <div key={item.id} className="flex items-center gap-3 py-3 border-b border-[var(--b1)] last:border-0">
                          <div className="text-2xl w-10 text-center">{item.emoji}</div>
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-bold truncate text-white">{item.name}</div>
                            <div className="fm text-[10px] text-[var(--brand-xlt)]">₹{item.price} × {item.qty}</div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button onClick={() => removeFromCart(item.id)} className="w-6 h-6 rounded-full border border-[var(--b1)] flex items-center justify-center text-[var(--tx4)] hover:border-[var(--brand)] hover:text-[var(--brand)]">
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="fm text-xs font-bold w-4 text-center text-white">{item.qty}</span>
                            <button onClick={() => addToCart(item)} className="w-6 h-6 rounded-full border border-[var(--b1)] flex items-center justify-center text-[var(--tx4)] hover:border-[var(--brand)] hover:text-[var(--brand)]">
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {cart.length > 0 && (
                    <div className="p-5 bg-[var(--s0)] border-t border-[var(--b1)] space-y-4">
                      <div className="bg-[var(--s2)] border border-[var(--b1)] rounded-2xl p-4 space-y-2">
                        <div className="flex justify-between text-xs text-[var(--tx3)]">
                          <span>Subtotal</span>
                          <span className="text-white">₹{cartTotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-xs text-[var(--tx3)]">
                          <span>GST (5%)</span>
                          <span className="text-white">₹{gst.toFixed(2)}</span>
                        </div>
                        {isPromoApplied && (
                          <div className="flex justify-between text-xs text-green-400 font-bold">
                            <span>Discount (10%)</span>
                            <span>-₹{discount.toFixed(2)}</span>
                          </div>
                        )}
                        <div className="flex justify-between text-base font-bold pt-2 border-t border-[var(--b2)] text-white">
                          <span>Total</span>
                          <span className="fm text-[var(--brand-xlt)]">₹{grandTotal.toFixed(2)}</span>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="text-[10px] text-[var(--tx4)] font-bold uppercase tracking-widest px-1">Discount Code</div>
                        <div className="flex gap-2">
                          <input 
                            type="text" 
                            value={promoCode}
                            onChange={(e) => setPromoCode(e.target.value)}
                            placeholder="Enter code (e.g. QWIKBREW10)"
                            className="flex-1 bg-[var(--s2)] border border-[var(--b1)] rounded-xl px-4 py-2 text-xs text-white focus:border-[var(--brand)] transition-all outline-none"
                          />
                          <button 
                            onClick={handleApplyPromo}
                            className="px-4 py-2 bg-[var(--s3)] border border-[var(--b1)] rounded-xl text-[10px] font-bold text-white hover:bg-[var(--brand)] transition-all uppercase tracking-widest"
                          >
                            Apply
                          </button>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="text-[10px] text-[var(--tx4)] font-bold uppercase tracking-widest px-1 flex justify-between">
                          <span>Payment Method</span>
                          {selectedPaymentMethod === 'WALLET' && (
                            <span className={walletBal < grandTotal ? 'text-red-400' : 'text-[var(--gold-lt)]'}>
                              Bal: ₹{walletBal.toFixed(2)}
                            </span>
                          )}
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          {[
                            { id: 'WALLET', label: 'Wallet', icon: <Wallet className="w-3.5 h-3.5" />, desc: 'Instant' },
                            { id: 'UPI', label: 'UPI QR', icon: <Smartphone className="w-3.5 h-3.5" />, desc: 'Scan & Pay' },
                            { id: 'CARD', label: 'Card', icon: <CreditCard className="w-3.5 h-3.5" />, desc: 'Visa/Master' },
                            { id: 'NETBANKING', label: 'Bank', icon: <Package className="w-3.5 h-3.5" />, desc: 'All Banks' }
                          ].map(method => (
                            <button
                              key={method.id}
                              onClick={() => setSelectedPaymentMethod(method.id as PaymentMethodType)}
                              className={`flex flex-col items-start gap-1 p-3 rounded-2xl border transition-all relative overflow-hidden group ${
                                selectedPaymentMethod === method.id 
                                  ? 'bg-[var(--brand-gl3)] border-[var(--brand)] shadow-[0_0_15px_rgba(255,87,34,0.1)]' 
                                  : 'bg-[var(--s2)] border-[var(--b1)] hover:border-[var(--b2)]'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <span className={selectedPaymentMethod === method.id ? 'text-[var(--brand)]' : 'text-[var(--tx4)]'}>
                                  {method.icon}
                                </span>
                                <span className={`text-[11px] font-bold ${selectedPaymentMethod === method.id ? 'text-white' : 'text-[var(--tx3)]'}`}>
                                  {method.label}
                                </span>
                              </div>
                              <span className="text-[8px] text-[var(--tx4)] font-bold uppercase tracking-tighter">{method.desc}</span>
                              {selectedPaymentMethod === method.id && (
                                <motion.div 
                                  layoutId="active-pay"
                                  className="absolute top-2 right-2 w-1.5 h-1.5 bg-[var(--brand)] rounded-full shadow-[0_0_8px_var(--brand)]"
                                />
                              )}
                            </button>
                          ))}
                        </div>
                      </div>

                      <button onClick={placeOrder} className="place-btn py-4 text-base">
                        {selectedPaymentMethod === 'WALLET' ? 'Place Order' : `Pay via ${selectedPaymentMethod}`} · ₹{grandTotal.toFixed(2)}
                      </button>
                    </div>
                  )}
                </motion.aside>
              </>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Wallet Modal */}
      <AnimatePresence>
        {isWalletOpen && (
          <div className="modal-overlay" onClick={() => setIsWalletOpen(false)}>
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="modal w-full max-w-md p-8"
            >
              <div className="flex justify-between items-start mb-8">
                <div>
                  <h2 className="fd text-2xl text-white">Recharge Wallet</h2>
                  <p className="text-xs text-[var(--tx4)] font-bold uppercase tracking-widest mt-1">Instant · No transaction fee</p>
                </div>
                <button onClick={() => setIsWalletOpen(false)} className="p-2 hover:bg-[var(--s2)] rounded-xl transition-all text-[var(--tx4)]">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-3 gap-3 mb-8">
                {[100, 200, 500, 1000, 2000, 5000].map(amt => (
                  <button 
                    key={amt}
                    onClick={() => {
                      setWalletBal(prev => prev + amt);
                      setIsWalletOpen(false);
                      showToast(`₹${amt} added to wallet`, 'success');
                    }}
                    className="bg-[var(--s2)] border border-[var(--b1)] rounded-2xl p-4 hover:border-[var(--brand)] transition-all group"
                  >
                    <div className="fm text-lg font-bold text-white group-hover:text-[var(--brand)]">₹{amt}</div>
                    {amt >= 1000 && <div className="text-[8px] text-green-400 font-bold uppercase mt-1">+ Bonus</div>}
                  </button>
                ))}
              </div>

              <div className="space-y-4">
                <label className="block text-[10px] font-bold text-[var(--tx4)] uppercase tracking-widest">Or enter custom amount</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--gold)] fd text-xl">₹</span>
                  <input 
                    type="number" 
                    placeholder="0"
                    className="w-full bg-[var(--s2)] border border-[var(--b1)] rounded-2xl pl-10 pr-4 py-4 fm text-xl font-bold text-white focus:border-[var(--gold)] transition-all outline-none"
                  />
                </div>
                <button className="w-full bg-linear-to-br from-[#5c3700] via-[var(--gold)] to-[var(--gold-lt)] text-black font-black py-4 rounded-2xl shadow-xl shadow-[rgba(232,160,0,.2)]">
                  Recharge Now →
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Order Details Modal */}
      <AnimatePresence>
        {selectedOrder && (
          <div className="modal-overlay" onClick={() => setSelectedOrder(null)}>
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="modal w-full max-w-lg p-0 overflow-hidden"
            >
              <div className="p-6 border-b border-[var(--b1)] flex justify-between items-center bg-linear-to-br from-[var(--s2)] to-[var(--s1)]">
                <div>
                  <div className="text-[10px] text-[var(--tx4)] font-bold uppercase tracking-widest mb-1">Order Details</div>
                  <h2 className="fm text-xl text-white">{selectedOrder.id}</h2>
                </div>
                <button onClick={() => setSelectedOrder(null)} className="p-2 hover:bg-[var(--s3)] rounded-xl transition-all text-[var(--tx4)]">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-8">
                {/* Status Stepper */}
                <div className="relative">
                  <div className="absolute top-4 left-0 right-0 h-0.5 bg-[var(--s3)]" />
                  <div 
                    className="absolute top-4 left-0 h-0.5 bg-[var(--brand)] transition-all duration-1000" 
                    style={{ 
                      width: `${(['PREPARING', 'IN_KITCHEN', 'OUT_FOR_DELIVERY', 'DELIVERED'].indexOf(selectedOrder.status) / 3) * 100}%` 
                    }} 
                  />
                  <div className="relative flex justify-between">
                    {[
                      { id: 'PREPARING', label: 'Preparing', icon: '⏱' },
                      { id: 'IN_KITCHEN', label: 'In Kitchen', icon: '👨‍🍳' },
                      { id: 'OUT_FOR_DELIVERY', label: 'Out for Delivery', icon: '🛵' },
                      { id: 'DELIVERED', label: 'Delivered', icon: '✅' }
                    ].map((step, idx) => {
                      const statuses = ['PREPARING', 'IN_KITCHEN', 'OUT_FOR_DELIVERY', 'DELIVERED'];
                      const currentIndex = statuses.indexOf(selectedOrder.status);
                      const isCompleted = currentIndex >= idx;
                      const isActive = currentIndex === idx;

                      return (
                        <div key={step.id} className="flex flex-col items-center gap-2 z-10">
                          <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm transition-all duration-500 ${
                            isCompleted ? 'bg-[var(--brand)] text-white shadow-lg shadow-[var(--brand-gl)]' : 'bg-[var(--s3)] text-[var(--tx4)]'
                          } ${isActive ? 'scale-125 ring-4 ring-[var(--brand-gl2)]' : ''}`}>
                            {step.icon}
                          </div>
                          <span className={`text-[9px] font-bold uppercase tracking-tighter ${isCompleted ? 'text-white' : 'text-[var(--tx4)]'}`}>
                            {step.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Items List */}
                <div className="bg-[var(--s2)] border border-[var(--b1)] rounded-2xl overflow-hidden">
                  <div className="px-4 py-3 bg-[var(--s3)] border-b border-[var(--b1)] text-[10px] font-bold text-[var(--tx4)] uppercase tracking-widest">
                    Items Summary
                  </div>
                  <div className="p-4 space-y-3">
                    {selectedOrder.itemDetails.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-3">
                        <div className="text-xl">{item.emoji}</div>
                        <div className="flex-1">
                          <div className="text-xs font-bold text-white">{item.name}</div>
                          <div className="text-[10px] text-[var(--tx4)]">₹{item.price} per unit</div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs font-bold text-white">x{item.qty}</div>
                          <div className="fm text-xs text-[var(--brand-xlt)]">₹{(item.price * item.qty).toFixed(2)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="p-4 bg-[var(--s3)] border-t border-[var(--b1)] flex justify-between items-center">
                    <span className="text-xs font-bold text-white">Total Amount</span>
                    <span className="fm text-lg font-bold text-[var(--brand)]">₹{selectedOrder.total.toFixed(2)}</span>
                  </div>
                </div>

                <div className="flex gap-4">
                  {(selectedOrder.status === 'PREPARING' || selectedOrder.status === 'IN_KITCHEN') ? (
                    <button 
                      onClick={() => setIsCancelModalOpen(true)}
                      className="flex-1 bg-red-500/10 border border-red-500/20 text-red-500 py-3 rounded-xl text-xs font-bold hover:bg-red-500/20 transition-all flex items-center justify-center gap-2"
                    >
                      <X className="w-4 h-4" /> Cancel Order
                    </button>
                  ) : (
                    <button className="flex-1 bg-[var(--s2)] border border-[var(--b1)] text-white py-3 rounded-xl text-xs font-bold hover:bg-[var(--s3)] transition-all flex items-center justify-center gap-2">
                      <Bell className="w-4 h-4" /> Notify Me
                    </button>
                  )}
                  <button className="flex-1 bg-linear-to-br from-[var(--brand)] to-[var(--brand-lt)] text-white py-3 rounded-xl text-xs font-bold shadow-lg shadow-[var(--brand-gl)] flex items-center justify-center gap-2">
                    <ShoppingCart className="w-4 h-4" /> Reorder
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Cancel Confirmation Modal */}
      <AnimatePresence>
        {isCancelModalOpen && selectedOrder && (
          <div className="modal-overlay" onClick={() => setIsCancelModalOpen(false)}>
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="modal w-full max-w-sm p-8 text-center"
            >
              <div className="w-16 h-16 bg-red-500/10 border border-red-500/20 rounded-full flex items-center justify-center text-2xl mx-auto mb-6 text-red-500">
                ⚠️
              </div>
              <h2 className="fd text-xl mb-2 text-white">Cancel Order?</h2>
              <p className="text-xs text-[var(--tx3)] mb-8 leading-relaxed">
                Are you sure you want to cancel order <span className="text-white font-bold">{selectedOrder.id}</span>? 
                The full amount of <span className="text-[var(--brand)] font-bold">₹{selectedOrder.total.toFixed(2)}</span> will be refunded to your wallet.
              </p>
              
              <div className="flex gap-3">
                <button 
                  onClick={() => setIsCancelModalOpen(false)}
                  className="flex-1 bg-[var(--s2)] border border-[var(--b1)] text-white py-3 rounded-xl text-xs font-bold hover:bg-[var(--s3)] transition-all"
                >
                  No, Keep It
                </button>
                <button 
                  onClick={() => cancelOrder(selectedOrder.id)}
                  className="flex-1 bg-red-500 text-white py-3 rounded-xl text-xs font-bold shadow-lg shadow-red-500/20 hover:bg-red-600 transition-all"
                >
                  Yes, Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Order Success Modal */}
      <AnimatePresence>
        {orderSuccess && (
          <div className="modal-overlay">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="modal w-full max-w-sm p-10 text-center relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 right-0 h-1 bg-green-500" />
              <div className="w-20 h-20 bg-green-500/10 border border-green-500/20 rounded-full flex items-center justify-center text-4xl mx-auto mb-6 text-green-500">
                ✓
              </div>
              <h2 className="fd text-2xl mb-2 text-white">Order Placed!</h2>
              <p className="text-sm text-[var(--tx3)] mb-8">Your order has been sent to the kitchen. We'll notify you when it's ready.</p>
              
              <div className="bg-[var(--s2)] border border-[var(--b1)] rounded-2xl p-5 text-left space-y-3 mb-8">
                <div className="flex justify-between text-xs">
                  <span className="text-[var(--tx4)]">Order ID</span>
                  <span className="fm font-bold text-white">{orderSuccess.id}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-[var(--tx4)]">Amount Paid</span>
                  <span className="fm font-bold text-[var(--brand)]">₹{orderSuccess.amount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-[var(--tx4)]">Status</span>
                  <span className="text-green-400 font-bold">✓ SUCCESS</span>
                </div>
              </div>

              <button 
                onClick={() => {
                  setOrderSuccess(null);
                  setPage('orders');
                }}
                className="w-full bg-linear-to-br from-[#00a366] via-green-500 to-green-400 text-white font-black py-4 rounded-2xl shadow-xl shadow-green-500/20"
              >
                View My Orders
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* UPI QR Payment Gateway Modal */}
      <AnimatePresence>
        {isPaymentModalOpen && currentPaymentOrder && (
          <div className="modal-overlay" onClick={() => setIsPaymentModalOpen(false)}>
            <motion.div 
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="modal w-full max-w-md p-0 overflow-hidden"
            >
              <div className="p-6 border-b border-[var(--b1)] flex justify-between items-center bg-linear-to-br from-[var(--s2)] to-[var(--s1)]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-linear-to-br from-[#5c3700] to-[var(--gold)] flex items-center justify-center text-white shadow-lg">
                    <Smartphone className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-[10px] text-[var(--tx4)] font-bold uppercase tracking-widest mb-0.5">Payment Gateway</div>
                    <h2 className="fm text-lg text-white">UPI Secure Pay</h2>
                  </div>
                </div>
                <button onClick={() => setIsPaymentModalOpen(false)} className="p-2 hover:bg-[var(--s3)] rounded-xl transition-all text-[var(--tx4)]">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-8 text-center">
                <div className="mb-8">
                  <div className="text-[11px] text-[var(--tx4)] font-bold uppercase tracking-widest mb-2">Amount to Pay</div>
                  <div className="fm text-4xl font-black text-white">₹{currentPaymentOrder.amount.toFixed(2)}</div>
                  <div className="text-[10px] text-[var(--tx3)] mt-2">Order ID: {currentPaymentOrder.id}</div>
                </div>

                <div className="relative inline-block p-4 bg-white rounded-3xl mb-8 shadow-2xl">
                  <img 
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=upi://pay?pa=qwikbrew@bank%26pn=QwikBrew%26am=${currentPaymentOrder.amount}%26cu=INR%26tn=Order%20${currentPaymentOrder.id}`} 
                    alt="UPI QR Code"
                    className="w-48 h-48"
                  />
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-10 h-10 bg-white rounded-lg shadow-lg flex items-center justify-center p-1 border border-gray-100">
                      <div className="w-full h-full bg-[var(--brand)] rounded-md flex items-center justify-center text-white text-[10px] font-black">QB</div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4 mb-8">
                  <p className="text-xs text-[var(--tx3)] leading-relaxed">
                    Scan this QR code using any UPI app (GPay, PhonePe, Paytm) to complete your payment.
                  </p>
                  <div className="flex justify-center gap-6 opacity-40 grayscale">
                    <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/e/e1/UPI-Logo.png/1200px-UPI-Logo.png" alt="UPI" className="h-4" />
                    <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/Google_Pay_Logo.svg/1200px-Google_Pay_Logo.svg.png" alt="GPay" className="h-4" />
                    <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/7/71/PhonePe_Logo.svg/1200px-PhonePe_Logo.svg.png" alt="PhonePe" className="h-4" />
                  </div>
                </div>

                <button 
                  onClick={() => finalizeOrder(currentPaymentOrder)}
                  className="w-full bg-linear-to-br from-[var(--brand)] to-[var(--brand-lt)] text-white font-black py-4 rounded-2xl shadow-xl shadow-[var(--brand-gl)] hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                  I've Completed Payment →
                </button>
                <button 
                  onClick={() => setIsPaymentModalOpen(false)}
                  className="w-full mt-4 py-2 text-[10px] font-bold text-[var(--tx4)] hover:text-white transition-colors uppercase tracking-widest"
                >
                  Cancel Transaction
                </button>
              </div>

              <div className="p-4 bg-[var(--s2)] border-t border-[var(--b1)] text-center">
                <div className="flex items-center justify-center gap-2 text-[9px] text-[var(--tx4)] font-bold uppercase tracking-widest">
                  <div className="w-1 h-1 rounded-full bg-green-500" />
                  SSL Encrypted · PCI DSS Compliant
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>{toast && <Toast {...toast} />}</AnimatePresence>
    </div>
  );
}
