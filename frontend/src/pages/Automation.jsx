import React from 'react';
import AppShell from '../components/AppShell';

const Automation = () => {
    return (
        <AppShell>
            <div className="page-inner">
                {/* Page Header */}
                <div className="page-header">
                    <div className="page-header-left">
                        <h1 className="page-title">Automation Testing</h1>
                        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
                            Automated test execution, Playwright integration, and CI/CD pipelines
                        </p>
                    </div>
                    <div className="page-header-actions">
                        <span className="status-tag status-warn">Early Access / Roadmap</span>
                    </div>
                </div>

                {/* Main Showcase Panel */}
                <div
                    className="panel"
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: 'var(--space-12) var(--space-6)',
                        textAlign: 'center',
                    }}
                >
                    <div
                        style={{
                            width: 64,
                            height: 64,
                            borderRadius: '50%',
                            backgroundColor: 'var(--brand-light)',
                            color: 'var(--brand)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 28,
                            marginBottom: 'var(--space-4)',
                            boxShadow: 'var(--shadow-sm)',
                        }}
                    >
                        🤖
                    </div>
                    <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 'var(--space-2)' }}>
                        Automated Test Runner
                    </h2>
                    <p style={{ maxWidth: 520, fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 'var(--space-6)' }}>
                        Execute your test cases directly with headless browsers, capture screenshots on failure, and automatically sync execution results back to your test plans.
                    </p>

                    {/* Feature Roadmap Grid */}
                    <div
                        style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                            gap: 'var(--space-4)',
                            maxWidth: 720,
                            width: '100%',
                            textAlign: 'left',
                        }}
                    >
                        <div style={{ padding: 'var(--space-4)', background: 'var(--bg-surface-2)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
                            <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>
                                🎭 Playwright Native
                            </div>
                            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                                Generate and execute end-to-end browser test scripts directly from test steps.
                            </div>
                        </div>

                        <div style={{ padding: 'var(--space-4)', background: 'var(--bg-surface-2)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
                            <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>
                                📸 Visual Artifacts
                            </div>
                            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                                Automatic step-by-step screenshots, video recording, and console error traces.
                            </div>
                        </div>

                        <div style={{ padding: 'var(--space-4)', background: 'var(--bg-surface-2)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
                            <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>
                                ⚡ Real-Time Progress
                            </div>
                            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                                Live status updates via WebSocket streaming results directly into active test plans.
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AppShell>
    );
};

export default Automation;
