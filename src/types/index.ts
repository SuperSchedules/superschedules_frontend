// Location suggestion from autocomplete API
export interface LocationSuggestion {
  id: string | number;
  label: string;           // "Newton, MA, United States"
  lat?: number;
  lng?: number;
  country_code: string;    // "US"
}

// User preferences for event recommendations
export interface UserPreferences {
  age?: number;
  interests?: string[];
  familySize?: number;
  accessibility?: string[];
  preferredDays?: string[];
  preferredTimes?: 'morning' | 'afternoon' | 'evening' | 'any';
  transportation?: 'walking' | 'driving' | 'public' | 'any';
}

// Authentication types
export interface User {
  id: number;
  username: string;
  email: string;
  token: string;
  preferences?: UserPreferences;
}

export interface AuthContext {
  user: User | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  authFetch: AuthFetch;
}

// Use Axios instance shape for authenticated HTTP client
export type AuthFetch = import('axios').AxiosInstance;

// Place types (Schema.org Place from Django) - legacy
export interface Place {
  id?: number;
  name?: string;
  address?: string;
  telephone?: string;
  url?: string;
  latitude?: number;
  longitude?: number;
  created_at?: string;
  updated_at?: string;
}

// Venue types (normalized venue data from backend)
export interface Venue {
  id: number;
  name: string;
  street_address: string;
  city: string;
  state: string;
  postal_code: string;
  latitude?: number;
  longitude?: number;
  telephone?: string;
  url?: string;
}

// Event types
export interface Event {
  id: string;
  title: string;
  description?: string;
  location?: string; // legacy fallback
  room_name?: string | null; // room within a venue (e.g., "Children's Room")
  venue?: Venue | null; // normalized venue data
  place?: Place; // legacy Schema.org place
  start: Date | string;
  end?: Date | string;
  start_time?: string;
  end_time?: string;
  suggested?: boolean;
  url?: string;
  tags?: string[];
  metadata_tags?: string[];
  age_range?: string;
  price?: string;
  organizer?: string;
  event_status?: string; // scheduled/cancelled/postponed
  event_attendance_mode?: string; // offline/online/mixed
  external_id?: string;
  source?: number;
  affiliate_link?: string;
  revenue_source?: string;
  created_at?: string;
  updated_at?: string;
}

// Chat/LLM types
export interface ModelResponse {
  modelName?: string;
  content?: string;
  response?: string; // For streaming responses
  responseTimeMs: number;
  success?: boolean;
  isComplete?: boolean; // For streaming completion status
  error?: string | null;
  suggestedEventIds: string[];
  followUpQuestions: string[];
}

export interface DualModelResponse {
  id: number;
  modelA: ModelResponse;
  modelB: ModelResponse;
  sessionId: string | null;
  clearPreviousSuggestions: boolean;
  timestamp: Date;
}

export interface ChatMessage {
  id: number;
  type: 'user' | 'assistant' | 'dual-assistant';
  content?: string;
  timestamp: Date;
  modelA?: ModelResponse;
  modelB?: ModelResponse;
  selectedModel?: 'A' | 'B' | null;
  // Streaming fields (optional)
  isComplete?: boolean;
  suggestedEventIds?: (string | number)[];
  followUpQuestions?: string[];
  responseTimeMs?: number;
  // Debug trace link (returned when debug mode is enabled)
  debugRunId?: string | null;
}

export interface ChatContext {
  location?: string | null;
  preferences: Record<string, any>;
  session_id?: string | null;
  clear_suggestions?: boolean;
  chat_history?: Array<{ role: 'user' | 'assistant'; content: string }>;
  date_range?: {
    from: string;
    to: string;
  };
  age_range?: {
    min: number;
    max: number;
  };
  max_price?: number;
  more_like_event_id?: string | number;
  // Geo-distance and virtual event filtering
  user_location?: { lat: number; lng: number } | null;
  max_distance_miles?: number | null;
  is_virtual?: boolean | null;
  // Debug mode for RAG tracing
  debug?: boolean;
}

export interface ChatRequestPayload {
  message: string;
  context: ChatContext & {
    current_date: string;
  };
  session_id: string | null;
  clear_suggestions: boolean;
}

export interface ChatResponse {
  success: boolean;
  data?: DualModelResponse;
  error?: string;
}

// Analytics types
export interface ModelPreferenceFeedback {
  message_id: number;
  selected_model: 'A' | 'B';
  user_query: string;
  model_a: {
    name: string;
    response_time_ms: number;
    success: boolean;
    error: string | null;
    content_length: number;
  };
  model_b: {
    name: string;
    response_time_ms: number;
    success: boolean;
    error: string | null;
    content_length: number;
  };
  timestamp: string;
}

export interface AnalyticsSummary {
  total_selections: number;
  model_a_selected: number;
  model_b_selected: number;
  average_response_time_a: number;
  average_response_time_b: number;
  model_a_success_rate: number;
  model_b_success_rate: number;
}

// Component props types
export interface ChatInterfaceProps {
  onSuggestedEvents: (events: Event[]) => void;
  onSuggestionsLoading?: (loading: boolean) => void;
  onFindMoreLike?: (event: Event) => void;
  onClearEvents?: () => void;
  suggestedEvents?: Event[];
  loadingSuggestions?: boolean;
  isVisible?: boolean;
}


// API response types
export interface ApiResponse<T = any> {
  data: T;
  status: number;
  statusText: string;
}

export interface EventsListResponse {
  data: Event[];
}

export interface EventsByIdsResponse {
  data: Event[];
}
