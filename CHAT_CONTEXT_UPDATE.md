# Frontend Chat Context Update

## Overview
The backend RAG search has been enhanced to support new filters. The frontend needs to pass additional context with chat messages.

## New Context Fields to Send

Update `streamingChatService.ts` and the chat context to include these fields:

### 1. User Location (for geo-distance search)
```typescript
// In ChatContext interface (types/index.ts)
user_location?: {
  lat: number;
  lng: number;
};
```

The backend can now filter events within X miles of the user. Get lat/lng from:
- Browser geolocation API (with permission)
- Geocoding the user's `preferences.location` string (e.g., "Newton, MA" → lat/lng)

### 2. Virtual Event Preference
```typescript
// In ChatContext interface
is_virtual?: boolean | null;  // true = virtual only, false = in-person only, null = any
```

Map from `preferences.transportation`:
- `'walking'` or `'driving'` → `is_virtual: false` (in-person)
- User explicitly asks for "online events" → `is_virtual: true`
- Default → `null` (any)

### 3. Max Distance (based on transportation)
```typescript
// In ChatContext interface
max_distance_miles?: number;
```

Suggested mapping from `preferences.transportation`:
- `'walking'` → 2 miles
- `'driving'` → 30 miles
- `'public'` → 15 miles
- `'any'` → null (no limit)

### 4. Full Preferences Object
The backend can now use more of the preferences. Ensure the full object is passed:

```typescript
context: {
  location: preferences.location,
  preferences: {
    age: preferences.age,
    familySize: preferences.familySize,
    interests: preferences.interests,           // ["Music", "Family Events", ...]
    budgetRange: preferences.budgetRange,       // ["free", "low"]
    accessibility: preferences.accessibility,   // ["Wheelchair accessible", ...]
    preferredTimes: preferences.preferredTimes, // "morning" | "afternoon" | "evening"
    transportation: preferences.transportation,
  },
  date_range: dateRange,
  // NEW fields:
  user_location: userLocation,      // { lat, lng } or null
  max_distance_miles: maxDistance,  // number or null
  is_virtual: isVirtual,            // boolean or null
}
```

## Files to Update

### 1. `src/types/index.ts`
Add new fields to `ChatContext` interface:
```typescript
export interface ChatContext {
  location?: string | null;
  preferences: Record<string, any>;
  session_id?: string | null;
  clear_suggestions?: boolean;
  chat_history?: Array<{ role: 'user' | 'assistant'; content: string }>;
  date_range?: { from: string; to: string };
  age_range?: { min: number; max: number };
  max_price?: number;
  more_like_event_id?: string | number;
  // NEW:
  user_location?: { lat: number; lng: number } | null;
  max_distance_miles?: number | null;
  is_virtual?: boolean | null;
}
```

### 2. `src/hooks/useUserPreferences.ts`
Add helper to get distance from transportation mode:
```typescript
const getMaxDistanceFromTransportation = (transport: string | undefined): number | null => {
  switch (transport) {
    case 'walking': return 2;
    case 'public': return 15;
    case 'driving': return 30;
    default: return null;
  }
};
```

### 3. `src/components/ChatInterface.tsx` (or wherever context is built)
Build the full context before sending:
```typescript
const buildChatContext = (): ChatContext => {
  const maxDistance = getMaxDistanceFromTransportation(preferences.transportation);

  return {
    location: preferences.location,
    preferences: { ...preferences },
    date_range: dateRange,
    user_location: userLocation,  // from geolocation or geocoded address
    max_distance_miles: maxDistance,
    is_virtual: null,  // or derive from user query/preference
    session_id: currentSessionId,
  };
};
```

### 4. Optional: Geolocation Hook
Create `src/hooks/useGeolocation.ts` to get user's lat/lng:
```typescript
export const useGeolocation = () => {
  const [location, setLocation] = useState<{lat: number, lng: number} | null>(null);

  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => setLocation(null)
      );
    }
  }, []);

  return location;
};
```

## Backend Changes (Already Done)
The backend RAG service now accepts these parameters and will:
- Filter events within `max_distance_miles` of `user_location`
- Filter by `is_virtual` preference
- Always exclude cancelled and full events
- Include `age_range`, `audience_tags`, `is_virtual`, `requires_registration` in returned event data

## Testing
After updating, verify in browser console that the context object sent to `/api/v1/chat/stream` includes the new fields.
