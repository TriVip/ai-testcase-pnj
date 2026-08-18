import React from 'react';

export const SkeletonText = ({ width = '100%', height = 14, style = {}, className = '' }) => (
    <div
        className={`skeleton ${className}`}
        style={{
            width,
            height,
            borderRadius: 'var(--radius-sm)',
            backgroundColor: 'var(--border-subtle)',
            ...style,
        }}
    />
);

export const SkeletonTile = ({ count = 4 }) => (
    <div
        style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
            gap: 'var(--space-4)',
            marginBottom: 'var(--space-8)',
        }}
    >
        {Array.from({ length: count }).map((_, i) => (
            <div key={i} className="kpi-tile" style={{ pointerEvents: 'none' }}>
                <SkeletonText width="60%" height={12} style={{ marginBottom: 'var(--space-2)' }} />
                <SkeletonText width="40%" height={28} style={{ marginBottom: 'var(--space-2)' }} />
                <SkeletonText width="80%" height={12} />
            </div>
        ))}
    </div>
);

export const SkeletonTable = ({ rows = 5, cols = 5 }) => (
    <div className="data-table-wrapper" style={{ pointerEvents: 'none' }}>
        <table className="data-table">
            <thead>
                <tr>
                    {Array.from({ length: cols }).map((_, i) => (
                        <th key={i}>
                            <SkeletonText width={i === 0 ? '60%' : '80%'} height={12} />
                        </th>
                    ))}
                </tr>
            </thead>
            <tbody>
                {Array.from({ length: rows }).map((_, r) => (
                    <tr key={r}>
                        {Array.from({ length: cols }).map((_, c) => (
                            <td key={c}>
                                <SkeletonText width={c === 0 ? '75%' : '50%'} height={14} />
                            </td>
                        ))}
                    </tr>
                ))}
            </tbody>
        </table>
    </div>
);

export default {
    Text: SkeletonText,
    Tile: SkeletonTile,
    Table: SkeletonTable,
};
