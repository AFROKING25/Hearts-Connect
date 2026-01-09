
import { User, Message } from './types';
import { MOCK_USERS } from './constants';

const DB_KEYS = {
  USERS: 'hearts_connect_users',
  MESSAGES: 'hearts_connect_messages',
  SESSION: 'hearts_connect_session'
};

/**
 * Database Simulation Service
 * mimicking MySQL persistence logic
 */
export const db = {
  // Initialize DB with seed data if empty
  init: () => {
    if (!localStorage.getItem(DB_KEYS.USERS)) {
      localStorage.setItem(DB_KEYS.USERS, JSON.stringify(MOCK_USERS));
    }
    if (!localStorage.getItem(DB_KEYS.MESSAGES)) {
      localStorage.setItem(DB_KEYS.MESSAGES, JSON.stringify([]));
    }
  },

  // Users Table
  users: {
    getAll: (): User[] => {
      const data = localStorage.getItem(DB_KEYS.USERS);
      return data ? JSON.parse(data) : [];
    },
    getById: (id: string): User | undefined => {
      return db.users.getAll().find(u => u.id === id);
    },
    create: (user: User): void => {
      const users = db.users.getAll();
      users.push(user);
      localStorage.setItem(DB_KEYS.USERS, JSON.stringify(users));
      localStorage.setItem(DB_KEYS.SESSION, user.id);
    },
    update: (id: string, updates: Partial<User>): void => {
      const users = db.users.getAll();
      const idx = users.findIndex(u => u.id === id);
      if (idx !== -1) {
        users[idx] = { ...users[idx], ...updates };
        localStorage.setItem(DB_KEYS.USERS, JSON.stringify(users));
      }
    }
  },

  // Messages Table
  messages: {
    getByChatId: (myId: string, theirId: string): Message[] => {
      const all = JSON.parse(localStorage.getItem(DB_KEYS.MESSAGES) || '[]');
      return all.filter((m: Message) => 
        (m.senderId === myId && m.receiverId === theirId) || 
        (m.senderId === theirId && m.receiverId === myId)
      );
    },
    send: (message: Message): void => {
      const all = JSON.parse(localStorage.getItem(DB_KEYS.MESSAGES) || '[]');
      all.push(message);
      localStorage.setItem(DB_KEYS.MESSAGES, JSON.stringify(all));
    }
  },

  // Auth/Session
  auth: {
    getCurrentUser: (): User | null => {
      const id = localStorage.getItem(DB_KEYS.SESSION);
      if (!id) return null;
      return db.users.getById(id) || null;
    },
    logout: () => {
      localStorage.removeItem(DB_KEYS.SESSION);
    }
  }
};
