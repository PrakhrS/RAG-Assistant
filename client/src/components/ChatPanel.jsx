import { useState, useRef, useEffect } from 'react';
import { useChat } from '../hooks/useChat.js';
import AnswerCard from './AnswerCard.jsx';

export default function ChatPanel({ documentId }) {
  const { entries, isPending, submit } = useChat(documentId);
  const [input, setInput] = useState('');
  const endOfMessagesRef = useRef(null);

  // Auto-scroll to bottom when new messages appear
  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [entries]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isPending || !input.trim()) return;
    
    submit(input);
    setInput('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="flex flex-col h-[600px] border border-gray-200 rounded-lg bg-white overflow-hidden shadow-sm flex-1">
      <div className="bg-gray-50 border-b border-gray-200 py-2 px-4 flex justify-between items-center text-xs text-gray-500">
        <span>Each question is answered independently — the assistant has no memory of previous questions.</span>
      </div>

      <div 
        className="flex-1 overflow-y-auto p-4 md:p-6"
        aria-live="polite"
      >
        {entries.length === 0 ? (
          <div className="h-full flex items-center justify-center text-gray-400">
            <p>Ask a question about this document to get started.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {entries.map((entry) => (
              <AnswerCard key={entry.id} entry={entry} />
            ))}
            <div ref={endOfMessagesRef} />
          </div>
        )}
      </div>

      <div className="p-3 bg-white border-t border-gray-200">
        <form onSubmit={handleSubmit} className="relative">
          <label htmlFor="question-input" className="sr-only">Ask a question</label>
          <textarea
            id="question-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isPending}
            placeholder="Ask a question..."
            maxLength={1000}
            rows={2}
            className="w-full pl-3 pr-20 py-3 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none disabled:bg-gray-50 disabled:text-gray-500"
          />
          
          <div className="absolute right-2 bottom-2 flex items-center space-x-2 text-xs">
            <span className={`text-gray-400 ${input.length >= 1000 ? 'text-red-500' : ''}`}>
              {input.length} / 1000
            </span>
            <button
              type="submit"
              disabled={isPending || !input.trim()}
              className="bg-blue-600 text-white rounded p-1.5 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500 disabled:bg-blue-300 disabled:cursor-not-allowed transition-colors"
              aria-label="Send question"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path>
              </svg>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
