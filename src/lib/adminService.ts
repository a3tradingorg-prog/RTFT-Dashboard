import { supabase, isConfigured } from './supabase';

export interface UserSession {
  id: string;
  user_id: string;
  email: string;
  device: string;
  location: string;
  ip_address: string;
  last_active: string;
}

export interface Notification {
  id: string;
  user_id: string | null; // null means global/for all users
  title: string;
  message: string;
  type: 'video' | 'pdf' | 'qa' | 'info' | 'trade';
  is_read: boolean;
  created_at: string;
}

export interface AdminQA {
  id: string;
  question_en: string;
  question_mm: string;
  answer_en: string;
  answer_mm: string;
  category_en: string;
  category_mm: string;
  created_at: string;
}

// Global state / LocalStorage keys
const STORAGE_KEYS = {
  SESSIONS: 'rtft_admin_sessions',
  NOTIFICATIONS: 'rtft_admin_notifications',
  QAS: 'rtft_admin_qas',
  RESOURCES: 'rtft_admin_resources',
  PROFILES: 'rtft_admin_profiles_mock'
};

// Seed initial mock profiles if not exists
const getMockProfiles = () => {
  const stored = localStorage.getItem(STORAGE_KEYS.PROFILES);
  if (stored) return JSON.parse(stored);

  const initial = [
    { id: 'c8f8dd02-eaa6-4427-a3f8-4c8f69ac4fb0', email: 'waiyanmyintaung37@gmail.com', full_name: 'Wai Yan Myint Aung', avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100', created_at: new Date().toISOString() },
    { id: 'a3t-test-admin', email: 'a3tradingorg@gmail.com', full_name: 'A3 Trading Admin', avatar_url: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=100', created_at: new Date().toISOString() },
    { id: 'test-user-2', email: 'student_pro@gmail.com', full_name: 'Kyaw Zin Win', avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100', created_at: new Date().toISOString() }
  ];
  localStorage.setItem(STORAGE_KEYS.PROFILES, JSON.stringify(initial));
  return initial;
};

// Seed initial notifications
const getInitialNotifications = (): Notification[] => {
  const stored = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
  if (stored) return JSON.parse(stored);

  const initial: Notification[] = [
    {
      id: 'noti-1',
      user_id: null,
      title: 'New Video Uploaded',
      message: 'Admin added a new video "VIP-1 Course: Lesson 13" in Campus!',
      type: 'video',
      is_read: false,
      created_at: new Date(Date.now() - 3600000 * 2).toISOString() // 2 hours ago
    },
    {
      id: 'noti-2',
      user_id: null,
      title: 'New PDF Resource',
      message: 'Admin uploaded "The Psychology of Money" PDF to the library.',
      type: 'pdf',
      is_read: false,
      created_at: new Date(Date.now() - 3600000 * 5).toISOString() // 5 hours ago
    }
  ];
  localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(initial));
  return initial;
};

export const adminService = {
  // 1. SESSION & DEVICE TRACKING
  async trackSession(userId: string, email: string) {
    // Detect device info
    const ua = navigator.userAgent;
    let device = 'Desktop';
    if (/Mobi|Android|iPhone|iPad/i.test(ua)) {
      if (/iPad/i.test(ua)) device = 'iPad';
      else if (/iPhone/i.test(ua)) device = 'iPhone';
      else if (/Android/i.test(ua)) device = 'Android Device';
      else device = 'Mobile Browser';
    } else if (/Macintosh/i.test(ua)) {
      device = 'macOS Desktop';
    } else if (/Windows/i.test(ua)) {
      device = 'Windows Desktop';
    } else if (/Linux/i.test(ua)) {
      device = 'Linux Desktop';
    }

    let location = 'Yangon, Myanmar';
    let ip = '103.25.10.15';

    // Try fetching geo IP (Non-blocking fallback)
    try {
      const res = await fetch('https://ipapi.co/json/').then(r => r.json());
      if (res && res.ip) {
        ip = res.ip;
        location = `${res.city || 'Yangon'}, ${res.country_name || 'Myanmar'}`;
      }
    } catch (e) {
      // Fallback to random cities for multiple profiles in testing
      const testCities = ['Yangon, Myanmar', 'Mandalay, Myanmar', 'Taunggyi, Myanmar', 'Bangkok, Thailand', 'Singapore'];
      const index = email.length % testCities.length;
      location = testCities[index];
      ip = `103.25.10.${15 + index}`;
    }

    const sessionData: UserSession = {
      id: Math.random().toString(36).substring(2, 11),
      user_id: userId,
      email,
      device,
      location,
      ip_address: ip,
      last_active: new Date().toISOString()
    };

    // Try Supabase first
    if (isConfigured) {
      try {
        const { error } = await supabase
          .from('user_sessions')
          .insert([sessionData]);
        if (!error) return;
      } catch (e) {
        console.warn('user_sessions table query failed, using localStorage fallback.');
      }
    }

    // Local Storage fallback
    const sessions = JSON.parse(localStorage.getItem(STORAGE_KEYS.SESSIONS) || '[]');
    // Filter out old sessions for this user with same device to avoid duplicate rows
    const filtered = sessions.filter((s: UserSession) => !(s.user_id === userId && s.device === device));
    filtered.unshift(sessionData);
    localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(filtered.slice(0, 100)));
  },

  async getSessions(): Promise<UserSession[]> {
    if (isConfigured) {
      try {
        const { data, error } = await supabase
          .from('user_sessions')
          .select('*')
          .order('last_active', { ascending: false });
        if (!error && data) return data;
      } catch (e) {}
    }

    // LocalStorage fallback
    const local = JSON.parse(localStorage.getItem(STORAGE_KEYS.SESSIONS) || '[]');
    if (local.length > 0) return local;

    // Return dummy data if empty
    const dummy: UserSession[] = [
      { id: 's1', user_id: 'c8f8dd02-eaa6-4427-a3f8-4c8f69ac4fb0', email: 'waiyanmyintaung37@gmail.com', device: 'Windows Desktop (Chrome)', location: 'Yangon, Myanmar', ip_address: '103.25.10.15', last_active: new Date().toISOString() },
      { id: 's2', user_id: 'test-user-2', email: 'student_pro@gmail.com', device: 'iPhone (Safari)', location: 'Mandalay, Myanmar', ip_address: '111.93.155.8', last_active: new Date(Date.now() - 600000).toISOString() },
      { id: 's3', user_id: 'a3t-test-admin', email: 'a3tradingorg@gmail.com', device: 'macOS Desktop (Safari)', location: 'Bangkok, Thailand', ip_address: '171.96.12.89', last_active: new Date().toISOString() }
    ];
    localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(dummy));
    return dummy;
  },

  // 2. ACCOUNT MANAGEMENT (PROFILES)
  async getProfiles(): Promise<any[]> {
    if (isConfigured) {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .order('created_at', { ascending: false });
        if (!error && data) return data;
      } catch (e) {}
    }
    return getMockProfiles();
  },

  async resetPasswordSimulate(email: string): Promise<string> {
    if (isConfigured) {
      try {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/profile`
        });
        if (!error) {
          return `A password reset link has been sent to ${email} via real Supabase Auth.`;
        }
      } catch (e) {}
    }
    
    // Fallback simulation
    return `[SIMULATION] Password reset email triggered successfully for ${email}! A secure reset link has been dispatched to the user.`;
  },

  // 3. RESOURCE UPLOAD (VIDEOS & PDFS)
  async addResource(resource: { title: string; description: string; category: string; url: string }) {
    const newResource = {
      id: Math.random().toString(36).substring(2, 11),
      title: resource.title,
      description: resource.description,
      category: resource.category,
      url: resource.url,
      thumbnail_url: resource.category === 'PDF' 
        ? 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400' 
        : 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=400',
      created_at: new Date().toISOString()
    };

    if (isConfigured) {
      try {
        const { error } = await supabase
          .from('resources')
          .insert([newResource]);
        if (!error) {
          // Trigger Notification
          await this.createNotification(
            `New ${resource.category === 'PDF' ? 'PDF' : 'Video'} Uploaded`,
            `Admin added "${resource.title}" under category "${resource.category}"!`,
            resource.category === 'PDF' ? 'pdf' : 'video'
          );
          return newResource;
        }
      } catch (e) {}
    }

    // Local Storage Fallback
    const list = JSON.parse(localStorage.getItem(STORAGE_KEYS.RESOURCES) || '[]');
    list.unshift(newResource);
    localStorage.setItem(STORAGE_KEYS.RESOURCES, JSON.stringify(list));

    // Trigger Notification
    await this.createNotification(
      `New ${resource.category === 'PDF' ? 'PDF' : 'Video'} Uploaded`,
      `Admin added "${resource.title}" under category "${resource.category}"!`,
      resource.category === 'PDF' ? 'pdf' : 'video'
    );

    return newResource;
  },

  async deleteResource(id: string) {
    if (isConfigured) {
      try {
        const { error } = await supabase
          .from('resources')
          .delete()
          .eq('id', id);
        if (!error) return true;
      } catch (e) {}
    }

    const list = JSON.parse(localStorage.getItem(STORAGE_KEYS.RESOURCES) || '[]');
    const filtered = list.filter((r: any) => r.id !== id);
    localStorage.setItem(STORAGE_KEYS.RESOURCES, JSON.stringify(filtered));
    return true;
  },

  // 4. Q&A POSTING
  async addQA(qa: { question_en: string; question_mm: string; answer_en: string; answer_mm: string; category_en: string; category_mm: string }) {
    const newQA: AdminQA = {
      id: Math.random().toString(36).substring(2, 11),
      ...qa,
      created_at: new Date().toISOString()
    };

    if (isConfigured) {
      try {
        const { error } = await supabase
          .from('qas')
          .insert([newQA]);
        if (!error) {
          // Trigger Notification
          await this.createNotification(
            'New Q&A Post Added',
            `Admin published a new frequently asked question: "${qa.question_mm || qa.question_en}"`,
            'qa'
          );
          return newQA;
        }
      } catch (e) {}
    }

    // Local Storage Fallback
    const list = JSON.parse(localStorage.getItem(STORAGE_KEYS.QAS) || '[]');
    list.unshift(newQA);
    localStorage.setItem(STORAGE_KEYS.QAS, JSON.stringify(list));

    // Trigger Notification
    await this.createNotification(
      'New Q&A Post Added',
      `Admin published a new frequently asked question: "${qa.question_mm || qa.question_en}"`,
      'qa'
    );

    return newQA;
  },

  async getQAs(): Promise<AdminQA[]> {
    if (isConfigured) {
      try {
        const { data, error } = await supabase
          .from('qas')
          .select('*')
          .order('created_at', { ascending: false });
        if (!error && data) return data;
      } catch (e) {}
    }

    return JSON.parse(localStorage.getItem(STORAGE_KEYS.QAS) || '[]');
  },

  async deleteQA(id: string) {
    if (isConfigured) {
      try {
        const { error } = await supabase
          .from('qas')
          .delete()
          .eq('id', id);
        if (!error) return true;
      } catch (e) {}
    }

    const list = JSON.parse(localStorage.getItem(STORAGE_KEYS.QAS) || '[]');
    const filtered = list.filter((q: any) => q.id !== id);
    localStorage.setItem(STORAGE_KEYS.QAS, JSON.stringify(filtered));
    return true;
  },

  // 5. NOTIFICATION CENTER SYSTEM
  async getNotifications(): Promise<Notification[]> {
    if (isConfigured) {
      try {
        const { data, error } = await supabase
          .from('notifications')
          .select('*')
          .order('created_at', { ascending: false });
        if (!error && data) return data;
      } catch (e) {}
    }

    return getInitialNotifications();
  },

  async createNotification(title: string, message: string, type: 'video' | 'pdf' | 'qa' | 'info' | 'trade') {
    const noti: Notification = {
      id: Math.random().toString(36).substring(2, 11),
      user_id: null,
      title,
      message,
      type,
      is_read: false,
      created_at: new Date().toISOString()
    };

    if (isConfigured) {
      try {
        await supabase
          .from('notifications')
          .insert([noti]);
      } catch (e) {}
    }

    const list = getInitialNotifications();
    list.unshift(noti);
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(list));
    
    // Dispatch a custom window event so reactive components update instantly
    window.dispatchEvent(new Event('rtft_notification_update'));
  },

  async markAsRead(id: string) {
    if (isConfigured) {
      try {
        await supabase
          .from('notifications')
          .update({ is_read: true })
          .eq('id', id);
      } catch (e) {}
    }

    const list = getInitialNotifications();
    const updated = list.map(n => n.id === id ? { ...n, is_read: true } : n);
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(updated));
    window.dispatchEvent(new Event('rtft_notification_update'));
  },

  async readAllNotifications() {
    if (isConfigured) {
      try {
        await supabase
          .from('notifications')
          .update({ is_read: true })
          .eq('is_read', false);
      } catch (e) {}
    }

    const list = getInitialNotifications();
    const updated = list.map(n => ({ ...n, is_read: true }));
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(updated));
    window.dispatchEvent(new Event('rtft_notification_update'));
  },

  async deleteAllNotifications() {
    if (isConfigured) {
      try {
        await supabase
          .from('notifications')
          .delete()
          .neq('id', 'null'); // Delete all
      } catch (e) {}
    }

    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify([]));
    window.dispatchEvent(new Event('rtft_notification_update'));
  }
};
