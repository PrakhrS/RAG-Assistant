export default function SourceList({ sources }) {
  if (!sources || sources.length === 0) return null;

  return (
    <details className="group mt-4 border border-gray-200 rounded-md bg-gray-50 overflow-hidden">
      <summary className="cursor-pointer py-2 px-3 text-sm font-medium text-gray-700 bg-white border-b border-gray-200 hover:bg-gray-50 flex items-center select-none">
        <svg
          className="w-4 h-4 mr-1.5 text-gray-400 group-open:rotate-90 transition-transform"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
        </svg>
        Sources ({sources.length})
      </summary>
      
      <div className="p-3 max-h-64 overflow-y-auto space-y-4">
        {sources.map((source) => (
          <div key={source.chunkId} className="text-sm">
            <h4 className="font-medium text-gray-700 mb-1">
              [{source.index}] Chunk {source.chunkIndex}
            </h4>
            <p className="text-gray-600 whitespace-pre-wrap pl-2 border-l-2 border-gray-300">
              {source.content}
            </p>
          </div>
        ))}
      </div>
    </details>
  );
}
