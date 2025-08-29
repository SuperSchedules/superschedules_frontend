import { useState } from 'react';
import './Calendar.css';
import ChatInterface from '../components/ChatInterface';

export default function CalendarPage() {
  const [suggestedEvents, setSuggestedEvents] = useState<any[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  return (
    <div className="calendar-page-new">
      <h1>Calendar</h1>
      {/* Chat Section at Top */}
      <div className="chat-section-separate">
        <ChatInterface
          onSuggestedEvents={setSuggestedEvents}
          onSuggestionsLoading={setLoadingSuggestions}
          suggestedEvents={suggestedEvents}
          loadingSuggestions={loadingSuggestions}
        />
      </div>

    </div>
  );
}
