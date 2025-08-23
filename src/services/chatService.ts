import { CHAT_ENDPOINTS, EVENTS_ENDPOINTS } from '../constants/api.js';
import type { AuthFetch, ChatContext, ChatResponse, Event, EventsByIdsResponse } from '../types/index.js';

export class ChatService {
  private authFetch: AuthFetch;

  constructor(authFetch: AuthFetch) {
    this.authFetch = authFetch;
  }

  async sendMessage(message: string, context: ChatContext = { preferences: {} }): Promise<ChatResponse> {
    try {
      const payload = {
        message: message.trim(),
        context: {
          current_date: new Date().toISOString(),
          location: context.location || null,
          preferences: context.preferences || {},
          ...context
        },
        session_id: context.session_id || null,
        clear_suggestions: context.clear_suggestions || false
      };

      const response = await this.authFetch.post(CHAT_ENDPOINTS.message, payload);
      
      return {
        success: true,
        data: {
          id: Date.now(),
          modelA: {
            modelName: response.data.model_a.model_name,
            content: response.data.model_a.response,
            responseTimeMs: response.data.model_a.response_time_ms,
            success: response.data.model_a.success,
            error: response.data.model_a.error,
            suggestedEventIds: response.data.model_a.suggested_event_ids || [],
            followUpQuestions: response.data.model_a.follow_up_questions || []
          },
          modelB: {
            modelName: response.data.model_b.model_name,
            content: response.data.model_b.response,
            responseTimeMs: response.data.model_b.response_time_ms,
            success: response.data.model_b.success,
            error: response.data.model_b.error,
            suggestedEventIds: response.data.model_b.suggested_event_ids || [],
            followUpQuestions: response.data.model_b.follow_up_questions || []
          },
          sessionId: response.data.session_id,
          clearPreviousSuggestions: response.data.clear_previous_suggestions || false,
          timestamp: new Date()
        }
      };
    } catch (error) {
      console.error('Chat service error:', error);
      
      // Fallback to mock response for development
      if (import.meta.env.DEV) {
        return this.getMockResponse(message);
      }
      
      return {
        success: false,
        error: (error as any).response?.data?.message || 'Failed to send message'
      };
    }
  }

  async getSuggestions(query: string, filters: Record<string, any> = {}): Promise<{ success: boolean; data?: string[]; error?: string }> {
    try {
      const params = new URLSearchParams({
        q: query,
        ...filters
      });

      const response = await this.authFetch.get(
        `${CHAT_ENDPOINTS.suggestions}?${params.toString()}`
      );
      
      return {
        success: true,
        data: response.data.suggestions || []
      };
    } catch (error) {
      console.error('Suggestions service error:', error);
      return {
        success: false,
        error: (error as any).response?.data?.message || 'Failed to get suggestions'
      };
    }
  }

  async fetchEventsByIds(eventIds: string[]): Promise<{ success: boolean; data?: Event[]; error?: string }> {
    try {
      if (!eventIds || eventIds.length === 0) {
        return { success: true, data: [] };
      }

      // Convert string IDs to integers for the backend API
      const numericIds: number[] = [];
      for (const id of eventIds) {
        const numId = parseInt(id, 10);
        if (!isNaN(numId)) {
          numericIds.push(numId);
        }
      }
      
      if (numericIds.length === 0) {
        console.warn('No valid numeric IDs found, returning mock data');
        // Return mock events if no valid numeric IDs
        const mockEvents = eventIds.map((id, index) => ({
          id: id,
          title: `Mock Event ${index + 1}`,
          description: `This is a mock event for ID: ${id}`,
          location: 'Mock Location',
          start: new Date(Date.now() + (index * 24 * 60 * 60 * 1000)),
          end: new Date(Date.now() + (index * 24 * 60 * 60 * 1000) + (2 * 60 * 60 * 1000)),
          date: new Date(Date.now() + (index * 24 * 60 * 60 * 1000)).toISOString().split('T')[0],
          suggested: true
        }));
        
        return {
          success: true,
          data: mockEvents
        };
      }

      // Make request to backend with correct integer IDs
      const params = new URLSearchParams();
      numericIds.forEach(id => params.append('ids', id.toString()));
      
      const response = await this.authFetch.get(
        `${EVENTS_ENDPOINTS.list}?${params.toString()}`
      );
      
      // Process the response and ensure proper date formatting
      const events = response.data.map((event: any): Event => ({
        ...event,
        suggested: true,
        start: event.start_time ? new Date(event.start_time) : new Date(),
        end: event.end_time ? new Date(event.end_time) : new Date(),
      }));
      
      return {
        success: true,
        data: events
      };
    } catch (error) {
      console.error('Error fetching events by IDs:', error);
      return {
        success: false,
        error: (error as any).response?.data?.message || 'Failed to fetch events'
      };
    }
  }

  getMockResponse(message: string): ChatResponse {
    const lowerMessage = message.toLowerCase();
    
    // Parse age mentions
    const ageMatch = lowerMessage.match(/(\d+)[\s-]*(?:and|to|-)?\s*(\d+)?\s*year[s]?\s*old/i);
    const ages = ageMatch ? [parseInt(ageMatch[1]), parseInt(ageMatch[2]) || parseInt(ageMatch[1])] : null;
    
    // Parse location mentions
    const locationMatch = lowerMessage.match(/(in|at|near)\s+([a-zA-Z\s,]+?)(?:\s|$|,)/i);
    const location = locationMatch ? locationMatch[2].trim() : 'local area';
    
    // Parse time mentions
    const timeMatch = lowerMessage.match(/(today|tomorrow|this\s+(?:week|weekend|month)|next\s+(?:\d+\s+)?(?:hours?|days?|week|month))/i);
    const timeframe = timeMatch ? timeMatch[1] : 'upcoming';
    
    let responseText = `I understand you're looking for activities`;
    if (ages) {
      responseText += ` for ${ages[0]}${ages[1] && ages[1] !== ages[0] ? `-${ages[1]}` : ''} year olds`;
    }
    responseText += ` in ${location}`;
    if (timeframe !== 'upcoming') {
      responseText += ` ${timeframe}`;
    }
    responseText += `. Let me find some suitable events for you!`;

    // Generate mock event IDs (using integers that might exist in the database)
    const mockEventIds = this.generateMockEventIds(ages, location, timeframe);
    
    const followUpQuestions = [];
    if (!ages) {
      followUpQuestions.push("What age range are you looking for?");
    }
    if (location === 'local area') {
      followUpQuestions.push("What city or area are you in?");
    }
    if (lowerMessage.includes('indoor') || lowerMessage.includes('outdoor')) {
      // No follow-up needed
    } else {
      followUpQuestions.push("Do you prefer indoor or outdoor activities?");
    }

    return {
      success: true,
      data: {
        id: Date.now(),
        modelA: {
          modelName: 'mock-model-a',
          content: responseText,
          responseTimeMs: Math.floor(Math.random() * 2000) + 500, // Random 500-2500ms
          success: true,
          error: null,
          suggestedEventIds: mockEventIds,
          followUpQuestions: followUpQuestions.slice(0, 2)
        },
        modelB: {
          modelName: 'mock-model-b',
          content: responseText + ' (This is a slightly different response from model B for comparison.)',
          responseTimeMs: Math.floor(Math.random() * 3000) + 800, // Random 800-3800ms  
          success: true,
          error: null,
          suggestedEventIds: mockEventIds,
          followUpQuestions: followUpQuestions.slice(0, 1) // Different follow-ups
        },
        sessionId: null,
        clearPreviousSuggestions: false,
        timestamp: new Date()
      }
    };
  }

  generateMockEventIds(ages: number[] | null, location: string, timeframe: string): string[] {
    // In development, return mock event IDs that would come from your RAG system
    // These would be actual event IDs from your PostgreSQL database in production
    
    const availableEventIds = [
      'event-001', 'event-002', 'event-003', 'event-004', 'event-005',
      'event-006', 'event-007', 'event-008', 'event-009', 'event-010'
    ];
    
    // Simulate filtering logic that would happen in your RAG system
    let relevantIds = availableEventIds;
    
    // Simulate age-based filtering
    if (ages) {
      relevantIds = availableEventIds.slice(0, 6); // Simulate fewer matches for specific ages
    }
    
    // Simulate location-based filtering  
    if (location && location !== 'local area') {
      relevantIds = relevantIds.slice(0, 4); // Even fewer matches for specific locations
    }
    
    // Simulate time-based filtering
    if (timeframe.includes('today') || timeframe.includes('tomorrow')) {
      relevantIds = relevantIds.slice(0, 2); // Very few events for immediate timeframes
    }
    
    // Return 2-3 event IDs as would come from your RAG system
    return relevantIds.slice(0, Math.min(3, relevantIds.length));
  }

  // Keep this method for development fallback when event fetching fails
  generateMockEventsFromIds(eventIds: string[]): Event[] {
    const baseEvents = {
      'event-001': {
        id: 'event-001',
        title: "Family Story Time",
        description: "Interactive storytelling session perfect for young children",
        location: "Newton Public Library",
        start: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
        end: new Date(Date.now() + 24 * 60 * 60 * 1000 + 90 * 60 * 1000), // 1.5 hours later
        suggested: true
      },
      'event-002': {
        id: 'event-002',
        title: "Kids Craft Workshop",
        description: "Creative arts and crafts activity",
        location: "Newton Community Center",
        start: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        end: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000 + 120 * 60 * 1000),
        suggested: true
      },
      'event-003': {
        id: 'event-003',
        title: "Playground Playdate",
        description: "Supervised playground activities and games",
        location: "Newton Park",
        start: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        end: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000 + 120 * 60 * 1000),
        suggested: true
      }
    };
    
    return eventIds.map(id => baseEvents[id as keyof typeof baseEvents] || {
      id,
      title: `Event ${id}`,
      description: "Event details would come from database",
      location: "Location TBD",
      start: new Date(Date.now() + 24 * 60 * 60 * 1000),
      end: new Date(Date.now() + 24 * 60 * 60 * 1000 + 90 * 60 * 1000),
      suggested: true
    });
  }
}