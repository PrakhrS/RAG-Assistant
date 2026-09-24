export default function ErrorNotice({ kind, status, context = 'ask' }) {
  let message = 'A server error occurred. Try again.';

  if (kind === 'network') {
    message = "Can't reach the server — check that the API is running.";
  } else if (kind === 'timeout') {
    message = 'The request took too long. Try again.';
  } else if (kind === 'aborted') {
    message = 'The request was cancelled.';
  } else if (kind === 'http') {
    if (status === 404) {
      message = 'This document no longer exists. Upload it again.';
    } else if (status === 400 && context === 'upload') {
      message = 'Unsupported file type. Upload a PDF or DOCX.';
    } else if (status === 400 && context === 'ask') {
      message = 'The request was rejected. Try rephrasing your question.';
    } else if (status === 413) {
      message = 'File is too large. Maximum size is 10 MB.';
    } else if (status === 502) {
      message = "The AI service couldn't process this question (possibly blocked by content policy). Try rephrasing.";
    } else if (status === 503) {
      message = 'AI providers are temporarily unavailable. Try again shortly.';
    }
  }

  return (
    <div className="bg-red-50 text-red-700 p-4 rounded-md border border-red-200">
      <p className="text-sm font-medium">{message}</p>
    </div>
  );
}
