// Authentication types
export interface User {
  id: number;
  username: string;
  email: string;
  token: string;
}

export interface AuthContext {
  user: User | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  authFetch: AuthFetch;
}

export interface AuthFetch {
  get: (url: string) => Promise<{ data: any }>;
  post: (url: string, data?: any) => Promise<{ data: any }>;
  put: (url: string, data?: any) => Promise<{ data: any }>;
  delete: (url: string) => Promise<{ data: any }>;
}

// Event types
export interface Event {
  id: string;
  title: string;
  description?: string;
  location?: string;
  start: Date | string;
  end?: Date | string;
  start_time?: string;
  end_time?: string;
  suggested?: boolean;
  url?: string;
  tags?: string[];
  age_range?: string;
  price?: string;
  organizer?: string;
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
}

export interface ChatContext {
  location?: string | null;
  preferences: Record<string, any>;
  session_id?: string | null;
  clear_suggestions?: boolean;
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
  onCalendarUpdate?: (event: Event) => void;
  suggestedEvents?: Event[];
  loadingSuggestions?: boolean;
  isVisible?: boolean;
}

export interface DualChatInterfaceProps extends ChatInterfaceProps {}

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