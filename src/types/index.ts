export interface Event {
  id: string;
  name: string;
  date: Date;
  startTime: string;
  endTime: string;
  venue?: string;
  danceFloor: string;
  amount: number;
  notes: string;
  frequency: 'single' | 'multiple';
  status?: 'open' | 'created' | 'offered' | 'confirmed' | 'declined' | 'cancelled';
  artistId?: string;
  artistName?: string;
  interestChecks?: Array<{ artistId: string; artistName: string; djResponse?: 'interested' | 'declined' }>;
  bookingRequests?: Array<{ artistId: string; artistName: string }>;
  selectedDates?: string[];
  openForRequests?: boolean;
  requestCount?: number;
  desiredGenres?: string[];
}

export interface Artist {
  id: string;
  name: string;
  type: string;
  location: string;
  genres: string[];
  about: string;
  image?: string;
  status?: 'pending' | 'accepted' | 'declined';
  request?: string;
  priceRange?: string;
  rating?: number;
  reviewCount?: number;
  experience?: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  receiverId: string;
  text: string;
  timestamp: Date;
  isRead: boolean;
  eventId?: string;
  eventName?: string;
}

export interface Conversation {
  id: string;
  artistId: string;
  artistName: string;
  lastMessage: string;
  lastMessageTime: Date;
  unreadCount: number;
  eventId?: string;
  eventName?: string;
}

export interface ArtistRequest {
  id: string;
  eventId: string;
  eventName: string;
  artistId: string;
  artistName: string;
  artistType: string;
  artistGenres: string[];
  artistRating?: number;
  artistReviewCount?: number;
  message: string;
  requestedAt: Date;
  status: 'pending' | 'accepted' | 'declined';
}

export interface HistoryEvent {
  id: string;
  name: string;
  date: Date;
  venue: string;
  artist: string;
  status: 'completed' | 'cancelled';
}
