import React from 'react';

const Pagination = ({
    currentPage,
    totalPages,
    totalItems,
    itemsPerPage,
    onPageChange,
}) => {
    if (totalPages <= 1) return null;

    const startItem = (currentPage - 1) * itemsPerPage + 1;
    const endItem = Math.min(currentPage * itemsPerPage, totalItems);

    const getPageNumbers = () => {
        if (totalPages <= 7) {
            return Array.from({ length: totalPages }, (_, i) => i + 1);
        }
        return Array.from({ length: 7 }, (_, i) => {
            if (i === 0) return 1;
            if (i === 6) return totalPages;
            return currentPage - 2 + i;
        });
    };

    return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'var(--space-4)' }}>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>
                Showing {startItem}–{endItem} of {totalItems}
            </span>
            <div className="pagination">
                <button
                    className="pag-btn"
                    disabled={currentPage === 1}
                    onClick={() => onPageChange(currentPage - 1)}
                    aria-label="Previous page"
                >
                    ‹
                </button>
                {getPageNumbers().map((p) => (
                    <button
                        key={p}
                        className={`pag-btn${currentPage === p ? ' pag-active' : ''}`}
                        onClick={() => onPageChange(p)}
                    >
                        {p}
                    </button>
                ))}
                <button
                    className="pag-btn"
                    disabled={currentPage === totalPages}
                    onClick={() => onPageChange(currentPage + 1)}
                    aria-label="Next page"
                >
                    ›
                </button>
            </div>
        </div>
    );
};

export default Pagination;
