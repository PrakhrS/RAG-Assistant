export default function StalledStatus({ checkAgain, resetToIdle }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 border rounded-lg bg-yellow-50 text-center border-yellow-200">
      <svg className="w-12 h-12 text-yellow-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
      </svg>
      <h2 className="text-lg font-medium text-gray-900 mb-2">Taking longer than expected</h2>
      <p className="text-gray-700 mb-6 max-w-sm">The worker may not be running, or the document is taking a very long time to process.</p>
      
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={checkAgain}
          className="bg-yellow-100 hover:bg-yellow-200 text-yellow-800 font-medium py-2 px-6 rounded-md border border-yellow-300 transition-colors"
        >
          Check again
        </button>
        <button
          onClick={resetToIdle}
          className="bg-white hover:bg-gray-50 text-gray-700 font-medium py-2 px-6 rounded-md border border-gray-300 transition-colors"
        >
          Upload a different file
        </button>
      </div>
    </div>
  );
}
