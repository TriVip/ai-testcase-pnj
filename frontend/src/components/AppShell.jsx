import { useState } from 'react';
import Sidebar from './Sidebar';
import KeyboardShortcutsModal from './common/KeyboardShortcutsModal';

/**
 * AppShell — wraps all authenticated pages.
 * Renders the persistent left-rail sidebar + the page content area.
 */
const AppShell = ({ children }) => {
    const [showShortcuts, setShowShortcuts] = useState(false);

    return (
        <div className="app-shell">
            <Sidebar onOpenShortcuts={() => setShowShortcuts(true)} />
            <main className="page-content">
                {children}
            </main>
            {showShortcuts && (
                <KeyboardShortcutsModal onClose={() => setShowShortcuts(false)} />
            )}
        </div>
    );
};

export default AppShell;
