import ErrorNotice from './ErrorNotice.jsx';
import SourceList from './SourceList.jsx';

export default function AnswerCard({ entry }) {
  const { question, status, result, error } = entry;

  return (
    <div className="mb-6 pb-6 border-b border-gray-100 last:border-0 last:mb-0 last:pb-0">
      <div className="flex items-start mb-3">
        <div className="w-8 h-8 rounded bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm shrink-0 mt-0.5 mr-3">
          U
        </div>
        <div className="bg-gray-100 text-gray-800 rounded-2xl rounded-tl-none px-4 py-2 max-w-[85%]">
          <p className="whitespace-pre-wrap">{question}</p>
        </div>
      </div>

      <div className="flex items-start">
        <div className="w-8 h-8 rounded bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-sm shrink-0 mt-0.5 mr-3">
          AI
        </div>
        <div className="flex-1 max-w-[90%]">
          {status === 'pending' && (
            <div className="h-9 flex items-center px-4 rounded-2xl bg-white border border-gray-200 w-24">
              <div className="flex space-x-1.5">
                <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></div>
              </div>
            </div>
          )}

          {status === 'error' && (
            <ErrorNotice kind={error.kind} status={error.status} context="ask" />
          )}

          {status === 'success' && (
            <div className="bg-white text-gray-800 rounded-2xl rounded-tl-none border border-gray-200 px-4 py-3 shadow-sm">
              {!result.answered ? (
                <p className="text-gray-600 italic">
                  No relevant information found for this question — try rephrasing.
                </p>
              ) : (
                <>
                  {result.truncated && (
                    <div className="mb-3 bg-yellow-50 text-yellow-800 text-xs px-2 py-1.5 rounded border border-yellow-200">
                      The answer may be cut off — try asking a more focused question.
                    </div>
                  )}
                  
                  <p className="whitespace-pre-wrap leading-relaxed">{result.answer}</p>
                  
                  {result.provider && (
                    <p className="mt-2 text-xs text-gray-400 uppercase tracking-wide">
                      Answered by {result.provider}
                    </p>
                  )}
                  
                  <SourceList sources={result.sources} />
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
