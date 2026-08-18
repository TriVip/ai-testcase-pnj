import React from 'react';

const Pagination = ({
    currentPage,
    totalPages,
    totalItems,
    itemsPerPage,
    onPageChange,
}) => {
    if (totalPages <= 1) return null;

    // currentPage can arrive out of range (e.g. a filter shrank the result
    // set after a later page was selected) — clamp so the math below can't
    // walk off either end of [1, totalPages].
    const safePage = Math.min(Math.max(1, currentPage), totalPages);

    const startItem = (safePage - 1) * itemsPerPage + 1;
    const endItem = Math.min(safePage * itemsPerPage, totalItems);

    const getPageNumbers = () => {
        if (totalPages <= 7) {
            return Array.from({ length: totalPages }, (_, i) => i + 1);
        }
        // Always show page 1 and the last page, plus a 5-wide window around
        // safePage — the window shifts to stay inside [2, totalPages - 1]
        // instead of running past it, which is what produced negative /
        // duplicate page numbers near either end.
        const windowSize = 5;
        let start = Math.max(2, safePage - 2);
        let end = Math.min(totalPages - 1, start + windowSize - 1);
        start = Math.max(2, end - windowSize + 1);

        const middle = [];
        for (let p = start; p <= end; p += 1) middle.push(p);
        return [1, ...middle, totalPages];
    };

    return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'var(--space-4)' }}>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>
                Showing {startItem}–{endItem} of {totalItems}
            </span>
            <div className="pagination">
                <button
                    className="pag-btn"
                    disabled={safePage === 1}
                    onClick={() => onPageChange(safePage - 1)}
                    aria-label="Previous page"
                >
                    ‹
                </button>
                {getPageNumbers().map((p) => (
                    <button
                        key={p}
                        className={`pag-btn${safePage === p ? ' pag-active' : ''}`}
                        onClick={() => onPageChange(p)}
                    >
                        {p}
                    </button>
                ))}
                <button
                    className="pag-btn"
                    disabled={safePage === totalPages}
                    onClick={() => onPageChange(safePage + 1)}
                    aria-label="Next page"
                >
                    ›
                </button>
            </div>
        </div>
    );
};

export default Pagination;
