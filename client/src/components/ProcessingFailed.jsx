export default function ProcessingFailed({ document, resetToIdle }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 border rounded-lg bg-red-50 text-center border-red-200">
      <svg className="w-12 h-12 text-red-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
      </svg>
      <h2 className="text-lg font-medium text-gray-900 mb-2">We couldn't process this document.</h2>
      
      {document?.errorMessage && (
        <p className="text-sm text-red-700 mb-6 bg-red-100/50 p-3 rounded text-left w-full max-w-md border border-red-200/50 font-mono">
          {document.errorMessage}
        </p>
      )}

      <button
        onClick={resetToIdle}
        className="bg-white hover:bg-gray-50 text-gray-700 font-medium py-2 px-6 rounded-md border border-gray-300 transition-colors"
      >
        Upload another file
      </button>
    </div>
  );
}
