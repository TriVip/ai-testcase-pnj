import { useState } from 'react';
import { testCasesAPI } from '../services/api';
import { useToast } from './Toast';

const ImportTestCaseModal = ({ onClose, onImportComplete }) => {
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [result, setResult] = useState(null);
    const [errors, setErrors] = useState([]);
    const toast = useToast();

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            // Validate file type
            const validTypes = [
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'application/vnd.ms-excel',
                'text/csv'
            ];
            if (!validTypes.includes(selectedFile.type) &&
                !selectedFile.name.endsWith('.xlsx') &&
                !selectedFile.name.endsWith('.xls') &&
                !selectedFile.name.endsWith('.csv')) {
                toast.error('Invalid file type. Please upload XLSX or CSV file.');
                return;
            }
            setFile(selectedFile);
            setResult(null);
            setErrors([]);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        const droppedFile = e.dataTransfer.files[0];
        if (droppedFile) {
            setFile(droppedFile);
            setResult(null);
            setErrors([]);
        }
    };

    const handleDragOver = (e) => {
        e.preventDefault();
    };

    const handleImport = async () => {
        if (!file) {
            toast.error('Please select a file to import');
            return;
        }

        setUploading(true);
        setResult(null);
        setErrors([]);

        try {
            const response = await testCasesAPI.importTestCases(file);
            setResult({
                success: true,
                count: response.data.count,
                message: response.data.message,
            });
            toast.success(`Successfully imported ${response.data.count} test cases!`);

            // Auto close after 2 seconds and refresh
            setTimeout(() => {
                onImportComplete();
                onClose();
            }, 2000);
        } catch (error) {
            console.error('Import failed:', error);
            const errorData = error.response?.data;

            if (errorData?.errors) {
                setErrors(errorData.errors);
                setResult({
                    success: false,
                    totalRows: errorData.totalRows,
                    validRows: errorData.validRows,
                    invalidRows: errorData.invalidRows,
                });
            }

            toast.error(errorData?.message || 'Failed to import test cases');
        } finally {
            setUploading(false);
        }
    };

    const handleDownloadTemplate = async (format) => {
        try {
            const response = await testCasesAPI.downloadTemplate(format);
            const blob = new Blob([response.data], {
                type: format === 'xlsx'
                    ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
                    : 'text/csv'
            });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `test-cases-template.${format}`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
            toast.success(`Template downloaded successfully!`);
        } catch (error) {
            console.error('Download failed:', error);
            toast.error('Failed to download template');
        }
    };

    return (
        <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={onClose}
        >
            <div
                className="glass rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="p-6">
                    {/* Header */}
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">Import Test Cases</h2>
                            <p className="text-gray-600 mt-1">Upload XLSX or CSV file to import multiple test cases</p>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-gray-500 hover:text-gray-700 text-2xl"
                        >
                            ×
                        </button>
                    </div>

                    {/* Template Download */}
                    <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                        <h3 className="font-semibold text-gray-900 mb-2">Download Template</h3>
                        <p className="text-sm text-gray-600 mb-3">
                            Download a template file to see the required format and sample data
                        </p>
                        <div className="flex gap-2">
                            <button
                                onClick={() => handleDownloadTemplate('xlsx')}
                                className="btn-secondary flex items-center gap-2"
                            >
                                <i className="fi fi-tr-file-spreadsheet"></i>
                                Download XLSX Template
                            </button>
                            <button
                                onClick={() => handleDownloadTemplate('csv')}
                                className="btn-secondary flex items-center gap-2"
                            >
                                <i className="fi fi-tr-file-spreadsheet"></i>
                                Download CSV Template
                            </button>
                        </div>
                    </div>

                    {/* File Upload */}
                    <div className="mb-6">
                        <h3 className="font-semibold text-gray-900 mb-3">Upload File</h3>
                        <div
                            onDrop={handleDrop}
                            onDragOver={handleDragOver}
                            className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-primary-500 transition-colors cursor-pointer"
                        >
                            <input
                                type="file"
                                accept=".xlsx,.xls,.csv"
                                onChange={handleFileChange}
                                className="hidden"
                                id="file-upload"
                            />
                            <label htmlFor="file-upload" className="cursor-pointer">
                                <i className="fi fi-tr-file-spreadsheet text-4xl text-gray-400 mb-3 block"></i>
                                {file ? (
                                    <div>
                                        <p className="text-gray-900 font-medium">{file.name}</p>
                                        <p className="text-sm text-gray-500 mt-1">
                                            {(file.size / 1024).toFixed(2)} KB
                                        </p>
                                    </div>
                                ) : (
                                    <div>
                                        <p className="text-gray-900 font-medium">
                                            Drop your file here or click to browse
                                        </p>
                                        <p className="text-sm text-gray-500 mt-1">
                                            Supports XLSX and CSV files (max 5MB)
                                        </p>
                                    </div>
                                )}
                            </label>
                        </div>
                    </div>

                    {/* Import Result */}
                    {result && (
                        <div className={`mb-6 p-4 rounded-lg ${result.success ? 'bg-green-50' : 'bg-red-50'}`}>
                            <h3 className={`font-semibold mb-2 ${result.success ? 'text-green-900' : 'text-red-900'}`}>
                                {result.success ? 'Import Successful!' : 'Import Failed'}
                            </h3>
                            {result.success ? (
                                <p className="text-green-700">
                                    Successfully imported {result.count} test cases
                                </p>
                            ) : (
                                <div className="text-red-700">
                                    <p className="mb-2">
                                        Total rows: {result.totalRows} | Valid: {result.validRows} | Invalid: {result.invalidRows}
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Validation Errors */}
                    {errors.length > 0 && (
                        <div className="mb-6 max-h-60 overflow-y-auto">
                            <h3 className="font-semibold text-red-900 mb-2">Validation Errors:</h3>
                            <ul className="space-y-1">
                                {errors.map((error, index) => (
                                    <li key={index} className="text-sm text-red-700 bg-red-50 p-2 rounded">
                                        {error}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex justify-end gap-3">
                        <button
                            onClick={onClose}
                            className="btn-secondary"
                            disabled={uploading}
                        >
                            {result?.success ? 'Close' : 'Cancel'}
                        </button>
                        {!result?.success && (
                            <button
                                onClick={handleImport}
                                className="btn-primary"
                                disabled={!file || uploading}
                            >
                                {uploading ? (
                                    <>
                                        <i className="fi fi-tr-settings animate-spin"></i>
                                        Importing...
                                    </>
                                ) : (
                                    <>
                                        <i className="fi fi-tr-file-spreadsheet"></i>
                                        Import Test Cases
                                    </>
                                )}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ImportTestCaseModal;
