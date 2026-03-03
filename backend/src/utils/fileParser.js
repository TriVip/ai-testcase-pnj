import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';

/**
 * Extracts raw text from an uploaded file buffer based on its mimetype/extension.
 * 
 * @param {Object} file - The file object from multer (req.file)
 * @returns {Promise<string>} - The extracted text
 */
export const extractTextFromFile = async (file) => {
    if (!file || !file.buffer) return '';

    const mimetype = file.mimetype;

    try {
        // Plain Text
        if (mimetype === 'text/plain') {
            return file.buffer.toString('utf-8');
        }

        // PDF
        if (mimetype === 'application/pdf') {
            const data = await pdfParse(file.buffer);
            return data.text;
        }

        // DOCX
        if (mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
            const result = await mammoth.extractRawText({ buffer: file.buffer });
            return result.value;
        }

        throw new Error('Unsupported file type. Only TXT, PDF, and DOCX are allowed.');
    } catch (error) {
        console.error('File parsing error:', error);
        throw new Error(`Failed to read file content: ${error.message}`);
    }
};
