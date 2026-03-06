import React from 'react';
import AppShell from '../components/AppShell';

const Automation = () => {
    return (
        <AppShell>
            <div className="page-inner" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-secondary)' }}>
                <div style={{ fontSize: '3rem', marginBottom: 'var(--space-4)' }}>🤖</div>
                <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 'var(--space-2)' }}>Automation Testing</h1>
                <p style={{ textAlign: 'center', maxWidth: 400, lineHeight: 1.6 }}>
                    This feature is currently under development. Here you will be able to configure and run automated tests for your test cases.
                </p>

                <div style={{ marginTop: 'var(--space-6)', padding: 'var(--space-4)', background: 'var(--bg-surface-2)', borderRadius: 'var(--radius)', border: '1px solid var(--border)', maxWidth: 500, width: '100%' }}>
                    <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 'var(--space-3)' }}>Planned Capabilities:</div>
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: 'var(--text-sm)', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                        <li style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span style={{ color: 'var(--brand)' }}>✓</span> Playwright integration</li>
                        <li style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span style={{ color: 'var(--brand)' }}>✓</span> Run tests securely in isolated environments</li>
                        <li style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span style={{ color: 'var(--brand)' }}>✓</span> Generate detailed test reports and screenshots</li>
                    </ul>
                </div>
            </div>
        </AppShell>
    );
};

export default Automation;
