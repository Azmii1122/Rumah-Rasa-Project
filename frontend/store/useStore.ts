import { create } from 'zustand';

export type SalesChannel = 'offline' | 'gofood' | 'grabfood' | 'shopee';

interface CartItem {
  variant_id: number;
  product_name: string;
  variant_name: string;
  price: number;
  quantity: number;
}

interface POSState {
  selectedChannel: SalesChannel;
  cart: CartItem[];
  
  // Actions
  setChannel: (channel: SalesChannel) => void;
  addToCart: (item: CartItem) => void;
  removeFromCart: (variant_id: number) => void;
  updateQuantity: (variant_id: number, qty: number) => void;
  clearCart: () => void;
  
  // Helper
  getTotal: () => number;
}

export const usePOSStore = create<POSState>((set, get) => ({
  selectedChannel: 'offline', // Default ke Offline
  cart: [],

  setChannel: (channel) => set({ selectedChannel: channel }),

  addToCart: (newItem) => set((state) => {
    const existing = state.cart.find(i => i.variant_id === newItem.variant_id);
    if (existing) {
      return {
        cart: state.cart.map(i => 
          i.variant_id === newItem.variant_id 
            ? { ...i, quantity: i.quantity + 1 } 
            : i
        )
      };
    }
    return { cart: [...state.cart, newItem] };
  }),

  removeFromCart: (id) => set((state) => ({
    cart: state.cart.filter(i => i.variant_id !== id)
  })),

  updateQuantity: (id, qty) => set((state) => ({
    cart: state.cart.map(i => 
      i.variant_id === id ? { ...i, quantity: qty } : i
    )
  })),

  clearCart: () => set({ cart: [] }),

  getTotal: () => {
    const { cart } = get();
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  }
}));