import { useRef, useState } from 'react';
import ErrorNotice from './ErrorNotice.jsx';

export default function UploadPanel({ upload, uploadError, resetToIdle }) {
  const inputRef = useRef(null);
  const [validationError, setValidationError] = useState(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setValidationError(null);

    const lowerName = file.name.toLowerCase();
    if (!lowerName.endsWith('.pdf') && !lowerName.endsWith('.docx')) {
      setValidationError('Please select a PDF or DOCX file.');
      inputRef.current.value = '';
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setValidationError('File exceeds the 10 MB limit.');
      inputRef.current.value = '';
      return;
    }

    if (file.size === 0) {
      setValidationError('File is empty.');
      inputRef.current.value = '';
      return;
    }

    upload(file);
    inputRef.current.value = ''; // Reset so the same file can be selected again if needed
  };

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 text-center">
      <svg className="w-12 h-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
      </svg>
      <p className="text-gray-700 font-medium mb-1">Upload a document to get started</p>
      <p className="text-sm text-gray-500 mb-6">PDF or DOCX up to 10 MB</p>

      <label className="cursor-pointer bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-md focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500">
        <span>Select File</span>
        <input
          type="file"
          accept=".pdf,.docx"
          className="sr-only"
          ref={inputRef}
          onChange={handleFileChange}
        />
      </label>

      {validationError && (
        <div className="mt-6 w-full max-w-md">
          <p className="text-sm text-red-600 font-medium bg-red-50 py-2 px-3 rounded border border-red-200">{validationError}</p>
        </div>
      )}

      {uploadError && (
        <div className="mt-6 w-full max-w-md flex flex-col gap-3">
          <ErrorNotice kind={uploadError.kind} status={uploadError.status} context="upload" />
          <button
            onClick={resetToIdle}
            className="text-sm text-gray-600 hover:text-gray-900 underline"
          >
            Upload another
          </button>
        </div>
      )}
    </div>
  );
}
