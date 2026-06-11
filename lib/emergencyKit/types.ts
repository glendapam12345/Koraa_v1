export type EmergencyKitEventId =
  | 'breakup'
  | 'pet_loss'
  | 'job_loss'
  | 'anxiety'
  | 'burnout'
  | 'sadness'
  | 'family'
  | 'transition'
  | 'other';

export type EmergencyKitModuleId =
  | 'music'
  | 'movies'
  | 'shows'
  | 'books'
  | 'internet'
  | 'places'
  | 'support_circle'
  | 'letters'
  | 'memory_box';

export type ComfortItemBase = {
  id: string;
  createdAt: string;
  tags?: EmergencyKitEventId[];
};

export type ComfortMusicItem = ComfortItemBase & {
  type: 'music';
  title: string;
  artist?: string;
  coverUrl?: string;
  spotifyUrl?: string;
};

export type ComfortMovieItem = ComfortItemBase & {
  type: 'movies';
  title: string;
  description?: string;
  posterUrl?: string;
  platform?: string;
  watchUrl?: string;
  duration?: string;
};

export type ComfortShowItem = ComfortItemBase & {
  type: 'shows';
  title: string;
  platform?: string;
  seasons?: string;
  coverUrl?: string;
  watchUrl?: string;
};

export type ComfortBookItem = ComfortItemBase & {
  type: 'books';
  title: string;
  author?: string;
  coverUrl?: string;
};

export type ComfortInternetItem = ComfortItemBase & {
  type: 'internet';
  title: string;
  kind: 'tiktok' | 'youtube' | 'podcast' | 'newsletter' | 'instagram' | 'other';
  url?: string;
  thumbnailUrl?: string;
};

export type ComfortPlaceItem = ComfortItemBase & {
  type: 'places';
  title: string;
  notes?: string;
  mapUrl?: string;
};

export type SupportPerson = ComfortItemBase & {
  type: 'support_circle';
  name: string;
  relationship?: string;
  photoUrl?: string;
  phone?: string;
};

export type SelfLetter = ComfortItemBase & {
  type: 'letters';
  content: string;
  eventTags: EmergencyKitEventId[];
};

export type MemoryItem = ComfortItemBase & {
  type: 'memory_box';
  title: string;
  note?: string;
  mediaUrl?: string;
  kind: 'photo' | 'video' | 'note' | 'voice';
};

export type ComfortItem =
  | ComfortMusicItem
  | ComfortMovieItem
  | ComfortShowItem
  | ComfortBookItem
  | ComfortInternetItem
  | ComfortPlaceItem
  | SupportPerson
  | SelfLetter
  | MemoryItem;

export type EmergencyKitPreferences = {
  favoriteShow?: string;
  favoriteCafe?: string;
  favoriteActivity?: string;
  favoritePlaylist?: string;
  favoriteMovie?: string;
};

export type EmergencyKitSessionPayload = {
  eventId: EmergencyKitEventId;
  customText?: string;
  locale: 'es' | 'en';
  recentEmotions: string[];
  avgEnergy: number | null;
  energyTrend: 'low' | 'steady' | 'rising' | 'unknown';
  checkInCount: number;
  savedItemTitles: string[];
  letterSnippets: string[];
  preferences: EmergencyKitPreferences;
};

export type EmergencyKitAiResponse = {
  supportMessage: string;
  gentleActions: string[];
  patternInsight?: string;
  crisisMode: boolean;
  prioritizedModules: EmergencyKitModuleId[];
  recommendedItemIds: string[];
  fromAi: boolean;
};

export type EmergencyKitSessionState = {
  eventId: EmergencyKitEventId;
  customText?: string;
  response: EmergencyKitAiResponse;
  openedAt: string;
};

export type NewComfortItem =
  | Omit<ComfortMusicItem, 'id' | 'createdAt'>
  | Omit<ComfortMovieItem, 'id' | 'createdAt'>
  | Omit<ComfortShowItem, 'id' | 'createdAt'>
  | Omit<ComfortBookItem, 'id' | 'createdAt'>
  | Omit<ComfortInternetItem, 'id' | 'createdAt'>
  | Omit<ComfortPlaceItem, 'id' | 'createdAt'>
  | Omit<SupportPerson, 'id' | 'createdAt'>
  | Omit<SelfLetter, 'id' | 'createdAt'>
  | Omit<MemoryItem, 'id' | 'createdAt'>;
