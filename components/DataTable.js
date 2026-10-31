'use client';

import { useState } from 'react';
import { MagnifyingGlassIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

export default function DataTable({ columns, data, searchPlaceholder = 'Search...', onSearch, onRowClick, actions }) {
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const filteredData = (Array.isArray(data) ? data : []).filter((row) => {
    if (!search) return true;
    return columns.some((col) => {
      const val = row[col.key];
      return val && String(val).toLowerCase().includes(search.toLowerCase());
    });
  });

  const totalPages = Math.ceil(filteredData.length / pageSize);
  const paginatedData = filteredData.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleSearch = (value) => {
    setSearch(value);
    setCurrentPage(1);
    if (onSearch) onSearch(value);
  };

  return (
    <div className="card p-0 overflow-hidden">
      <div className="p-4 border-b border-border flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input
            type="text"
            placeholder={searchPlaceholder}
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            className="input-field pl-9"
          />
        </div>
        {actions && <div className="flex gap-2">{actions}</div>}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-gray-50/50">
              {columns.map((col) => (
                <th key={col.key} className="text-left px-4 py-3 text-xs font-medium text-text-secondary uppercase tracking-wider">
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginatedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-8 text-center text-text-muted text-sm">
                  No data found
                </td>
              </tr>
            ) : (
              paginatedData.map((row, idx) => (
                <tr key={row.id || idx} onClick={() => onRowClick && onRowClick(row)} className={`border-b border-border last:border-0 hover:bg-gray-50/50 transition-colors ${onRowClick ? 'cursor-pointer' : ''}`}>
                  {columns.map((col) => (
                    <td key={col.key} className="px-4 py-3 text-sm text-text-primary">
                      {col.render ? col.render(row[col.key], row) : row[col.key]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="px-4 py-3 border-t border-border flex items-center justify-between">
          <p className="text-sm text-text-secondary">
            Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, filteredData.length)} of {filteredData.length}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1 rounded-lg border border-border hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeftIcon className="w-4 h-4" />
            </button>
            <span className="text-sm text-text-secondary">
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1 rounded-lg border border-border hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRightIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
