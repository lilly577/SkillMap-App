import { useAuth } from '@/hooks/user';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import LoginDialog from '@/components/LoginDialog';

export default function Navigation() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <h1 
              className="text-xl font-bold text-blue-600 cursor-pointer"
              onClick={() => navigate('/')}
            >
              SkillMap
            </h1>
          </div>

          <div className="flex items-center space-x-4">
            {isAuthenticated && user ? (
              <>
                <span className="text-sm text-gray-700">
                  Welcome, {user.name} ({user.userType})
                </span>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => navigate(`/${user.userType}/dashboard`)}
                >
                  Dashboard
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleLogout}
                >
                  Logout
                </Button>
              </>
            ) : (
              <LoginDialog />
              // <Button 
              //   variant="default" 
              //   size="sm"
              //   onClick={() => navigate('/')}
              // >
              //   Login / Register
              // </Button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}