import Sidebar from './Sidebar';

/**
 * AppShell — wraps all authenticated pages.
 * Renders the persistent left-rail sidebar + the page content area.
 */
const AppShell = ({ children }) => {
    return (
        <div className="app-shell">
            <Sidebar />
            <main className="page-content">
                {children}
            </main>
        </div>
    );
};

export default AppShell;
