export default function DocumentHeader({ document, resetToIdle }) {
  const hasPageCount = document?.pageCount != null;

  return (
    <div className="flex flex-row items-center justify-between pb-4 mb-6 border-b border-gray-200">
      <div>
        <h2 className="text-lg font-medium text-gray-900">
          {document?.filename || 'Document'}
          {hasPageCount && <span className="text-gray-500 font-normal"> · {document.pageCount} pages</span>}
        </h2>
      </div>
      <button
        onClick={resetToIdle}
        className="text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors"
      >
        Upload new document
      </button>
    </div>
  );
}
