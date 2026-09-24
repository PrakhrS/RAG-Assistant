export default function ProcessingStatus({ document, elapsedMs }) {
  const seconds = Math.floor(elapsedMs / 1000);
  const name = document?.filename || 'Document';
  const hasPageCount = document?.pageCount != null;

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 border rounded-lg bg-gray-50 text-center">
      <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-6"></div>
      <h2 className="text-lg font-medium text-gray-900 mb-2">
        {name} {hasPageCount && <span className="text-gray-500 font-normal">({document.pageCount} pages)</span>}
      </h2>
      <p className="text-gray-600">Processing… {seconds}s</p>
    </div>
  );
}
