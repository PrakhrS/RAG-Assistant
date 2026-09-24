import { useDocument } from './hooks/useDocument.js';
import UploadPanel from './components/UploadPanel.jsx';
import ProcessingStatus from './components/ProcessingStatus.jsx';
import StalledStatus from './components/StalledStatus.jsx';
import ProcessingFailed from './components/ProcessingFailed.jsx';
import DocumentHeader from './components/DocumentHeader.jsx';
import ChatPanel from './components/ChatPanel.jsx';

function App() {
  const {
    phase,
    document,
    failedAt,
    error,
    elapsedMs,
    upload,
    checkAgain,
    resetToIdle,
  } = useDocument();

  // Determine announcement for screen readers
  let phaseAnnouncement;
  switch (phase) {
    case 'uploading':
      phaseAnnouncement = 'Uploading document...';
      break;
    case 'processing':
      phaseAnnouncement = 'Processing document...';
      break;
    case 'ready':
      phaseAnnouncement = 'Document ready';
      break;
    case 'failed':
      phaseAnnouncement = 'Processing failed';
      break;
    case 'stalled':
      phaseAnnouncement = 'Processing stalled';
      break;
    default:
      phaseAnnouncement = '';
  }

  return (
    <main className="max-w-4xl mx-auto px-4 py-8 min-h-screen flex flex-col">
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">RAG Document Assistant</h1>

      {/* aria-live region for phase transitions */}
      <p aria-live="polite" className="sr-only">
        {phaseAnnouncement}
      </p>

      <div className="flex-1 flex flex-col">
        {phase === 'idle' && (
          <UploadPanel upload={upload} resetToIdle={resetToIdle} />
        )}
        
        {(phase === 'uploading' || phase === 'processing') && (
          <ProcessingStatus document={document} elapsedMs={elapsedMs} />
        )}
        
        {phase === 'stalled' && (
          <StalledStatus checkAgain={checkAgain} resetToIdle={resetToIdle} />
        )}
        
        {phase === 'failed' && failedAt === 'processing' && (
          <ProcessingFailed document={document} resetToIdle={resetToIdle} />
        )}
        
        {phase === 'failed' && failedAt === 'upload' && (
          <UploadPanel upload={upload} uploadError={error} resetToIdle={resetToIdle} />
        )}
        
        {phase === 'ready' && (
          <>
            <DocumentHeader document={document} resetToIdle={resetToIdle} />
            <ChatPanel key={document.id} documentId={document.id} />
          </>
        )}
      </div>
    </main>
  );
}

export default App;
