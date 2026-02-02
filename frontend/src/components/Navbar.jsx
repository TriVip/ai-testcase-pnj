import { useAuth } from '../contexts/AuthContext';

const Navbar = () => {
    const { user, logout } = useAuth();

    return (
        <nav className="glass sticky top-0 z-50 border-b border-white/20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    {/* Logo */}
                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-primary-600 to-accent-600 rounded-lg flex items-center justify-center">
                            <span className="text-white font-bold text-xl">AI</span>
                        </div>
                        <span className="text-xl font-bold text-gradient">Test Case Generator</span>
                    </div>

                    {/* User Menu */}
                    <div className="flex items-center space-x-4">
                        {user && (
                            <>
                                <div className="flex items-center space-x-3">
                                    <img
                                        src={user.picture}
                                        alt={user.name}
                                        className="w-10 h-10 rounded-full border-2 border-primary-500"
                                    />
                                    <div className="hidden md:block">
                                        <p className="text-sm font-semibold text-gray-800">{user.name}</p>
                                        <p className="text-xs text-gray-500">{user.email}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={logout}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-white/50 rounded-lg transition-all duration-200"
                                >
                                    Logout
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
