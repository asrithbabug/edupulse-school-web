'use client';

import { useState, useRef } from 'react';
import { ArrowDownTrayIcon, ArrowUpTrayIcon, DocumentArrowUpIcon } from '@heroicons/react/24/outline';
import { api } from '@/lib/api';

/** The API calls staff "staff"; the tab is labelled Teachers / Staff. */
const apiType = (tab) => (tab === 'students' ? 'students' : 'staff');
const isCsv = (file) => /\.csv$/i.test(file?.name || '');

export default function BulkImportPage() {
  const [activeTab, setActiveTab] = useState('students');
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [results, setResults] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const handleDownloadTemplate = async () => {
    try {
      await api.downloadTemplate(apiType(activeTab));
    } catch (err) {
      alert(err.message || 'Failed to download template');
    }
  };

  const handleFileSelect = (e) => {
    const selected = e.target.files?.[0];
    if (selected && !isCsv(selected)) {
      alert('Please choose a .csv file. In Excel: File > Save As > CSV UTF-8.');
      return;
    }
    if (selected) {
      setFile(selected);
      setResults(null);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const dropped = e.dataTransfer.files?.[0];
    if (dropped) {
      if (isCsv(dropped)) {
        setFile(dropped);
        setResults(null);
      } else {
        alert('Please upload a .csv file. In Excel: File > Save As > CSV UTF-8.');
      }
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setResults(null);

    try {
      setResults(await api.importCsv(apiType(activeTab), file));
    } catch (err) {
      setResults({ error: err.message || 'Upload failed. Please try again.' });
    }
    setUploading(false);
  };

  const resetUpload = () => {
    setFile(null);
    setResults(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h2 className="text-2xl font-bold text-text-primary">Bulk Import</h2>
        <p className="text-text-secondary text-sm mt-1">
          Import students or staff from a spreadsheet (CSV, opens in Excel or Google Sheets)
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border">
        <button
          onClick={() => { setActiveTab('students'); resetUpload(); }}
          className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'students'
              ? 'border-primary text-primary'
              : 'border-transparent text-text-secondary hover:text-text-primary'
          }`}
        >
          Students
        </button>
        <button
          onClick={() => { setActiveTab('teachers'); resetUpload(); }}
          className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'teachers'
              ? 'border-primary text-primary'
              : 'border-transparent text-text-secondary hover:text-text-primary'
          }`}
        >
          Staff
        </button>
      </div>

      {/* Download Template */}
      <div className="bg-white rounded-xl border border-border p-6">
        <h3 className="text-sm font-semibold text-text-primary mb-2">Step 1: Download Template</h3>
        <p className="text-text-secondary text-sm mb-4">
          Download the template, open it in Excel or Google Sheets, fill one row per {activeTab === 'students' ? 'student' : 'staff member'} (keep the header row), and save it as CSV. Each person gets a login and, if an email is given, a set-password email.
        </p>
        <button
          onClick={handleDownloadTemplate}
          className="btn-secondary flex items-center gap-2 text-sm"
        >
          <ArrowDownTrayIcon className="w-4 h-4" />
          Download {activeTab === 'students' ? 'Student' : 'Staff'} Template (.csv)
        </button>
      </div>

      {/* Upload Area */}
      <div className="bg-white rounded-xl border border-border p-6">
        <h3 className="text-sm font-semibold text-text-primary mb-2">Step 2: Upload File</h3>
        <p className="text-text-secondary text-sm mb-4">
          Upload the filled CSV file. Rows with errors are skipped and listed below; fix them and upload just those rows again.
        </p>

        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
            dragOver
              ? 'border-primary bg-primary/5'
              : file
                ? 'border-green-400 bg-green-50'
                : 'border-border hover:border-primary/50 hover:bg-gray-50'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,text/csv"
            onChange={handleFileSelect}
            className="hidden"
          />
          <DocumentArrowUpIcon className={`w-10 h-10 mx-auto mb-3 ${file ? 'text-green-500' : 'text-text-secondary'}`} />
          {file ? (
            <div>
              <p className="text-sm font-medium text-green-700">{file.name}</p>
              <p className="text-xs text-text-secondary mt-1">
                {(file.size / 1024).toFixed(1)} KB — Click to change
              </p>
            </div>
          ) : (
            <div>
              <p className="text-sm text-text-primary font-medium">
                Drag & drop your CSV file here
              </p>
              <p className="text-xs text-text-secondary mt-1">
                or click to browse (.csv)
              </p>
            </div>
          )}
        </div>

        <div className="flex gap-3 mt-4">
          <button
            onClick={handleUpload}
            disabled={!file || uploading}
            className="btn-primary flex items-center gap-2 text-sm disabled:opacity-50"
          >
            <ArrowUpTrayIcon className="w-4 h-4" />
            {uploading ? 'Uploading...' : 'Upload & Import'}
          </button>
          {file && (
            <button onClick={resetUpload} className="btn-secondary text-sm">
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Results */}
      {results && (
        <div className="bg-white rounded-xl border border-border p-6">
          <h3 className="text-sm font-semibold text-text-primary mb-4">Import Results</h3>

          {results.error ? (
            <div className="p-4 bg-red-50 rounded-lg">
              <p className="text-sm text-red-700 font-medium">Import Failed</p>
              <p className="text-sm text-red-600 mt-1">{results.error}</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-green-50 rounded-lg text-center">
                  <p className="text-2xl font-bold text-green-700">{results.success}</p>
                  <p className="text-sm text-green-600">Successfully Imported</p>
                </div>
                <div className="p-4 bg-red-50 rounded-lg text-center">
                  <p className="text-2xl font-bold text-red-700">{results.failed}</p>
                  <p className="text-sm text-red-600">Failed</p>
                </div>
              </div>

              {results.errors && results.errors.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-text-primary mb-2">Error Details:</p>
                  <div className="max-h-40 overflow-y-auto bg-gray-50 rounded-lg p-3 space-y-1">
                    {results.errors.map((e, i) => (
                      <p key={i} className="text-xs text-red-600">
                        Row {e.row}: {e.message}
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
