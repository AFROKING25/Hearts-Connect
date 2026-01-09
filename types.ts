
export enum AppTab {
  DISCOVERY = 'discovery',
  MATCHES = 'matches',
  GHOST = 'ghost',
  MESSAGES = 'messages',
  PROFILE = 'profile'
}

export interface User {
  id: string;
  name: string;
  age: number;
  dob?: string;
  gender?: 'male' | 'female' | 'custom';
  interestedIn?: 'men' | 'women' | 'everyone';
  locationCity?: string;
  locationCountry?: string;
  locationRegion?: string;
  bio: string;
  distance: string;
  distanceValue?: number; // km
  online: boolean;
  photo: string;
  isInstagramVerified: boolean;
  instagramHandle?: string;
  instagramPhotos?: string[];
  interests: string[];
  intent: 'casual' | 'serious' | 'friends' | 'fwb';
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  text: string;
  timestamp: number;
}

export interface Match {
  id: string;
  users: [string, string];
  timestamp: number;
}
