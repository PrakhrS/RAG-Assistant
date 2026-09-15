import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';
import mammoth from 'mammoth';
import {
  insertDocument,
  updateDocumentStatus,
} from '../db/documents.queries.js';
import { extractionQueue, embeddingQueue } from '../redis/queue.js';
import { chunkText } from '../utils/chunker.js';

export async function createDocument(file) {
  const document = await insertDocument({
    filename: file.originalname,
    fileSize: file.size,
    mimeType: file.mimetype,
  });

  await extractionQueue.add('extract', {
    documentId: document.id,
    fileBuffer: file.buffer.toString('base64'),
    mimeType: file.mimetype,
  });

  return document;
}

// Called only by the worker — never by a controller.
export async function extractText(documentId, fileBuffer, mimeType) {
  await updateDocumentStatus(documentId, 'processing');

  try {
    let result;

    if (mimeType === 'application/pdf') {
      result = await extractPdf(fileBuffer);
    } else if (
      mimeType ===
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ) {
      result = await extractDocx(fileBuffer);
    } else {
      throw new Error(`Unsupported file type: ${mimeType}`);
    }

    console.log(
      `Extracted ${result.text.length} chars from document ${documentId}`,
    );

    const chunks = chunkText(result.text);

    if (chunks.length === 0) {
      await updateDocumentStatus(documentId, 'failed', {
        errorMessage: 'No extractable content found',
      });
      return;
    }

    await updateDocumentStatus(documentId, 'processing', {
      rawText: result.text,
      pageCount: result.pageCount,
    });

    await embeddingQueue.add('embed', { documentId, chunks });
  } catch (err) {
    await updateDocumentStatus(documentId, 'failed', {
      errorMessage: err.message,
    });
    throw err;
  }
}

async function extractPdf(buffer) {
  const pdf = await getDocument({
    data: new Uint8Array(buffer),
    // Suppress pdfjs-dist info/warning logs in server environment
    verbosity: 0,
  }).promise;

  const pages = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    pages.push(content.items.map((item) => item.str).join(' '));
  }

  return { text: pages.join('\n'), pageCount: pdf.numPages };
}

async function extractDocx(buffer) {
  const { value } = await mammoth.extractRawText({ buffer });
  return { text: value, pageCount: null };
}
