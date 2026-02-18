import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/user';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredUserType?: 'company' | 'specialist';
}

export default function ProtectedRoute({ 
  children, 
  requiredUserType 
}: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, user, verifyAuth } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated && !isLoading) {
      verifyAuth().then(() => {
        const auth = useAuth.getState();
        if (!auth.isAuthenticated) {
          navigate('/');
        } else if (requiredUserType && auth.user?.userType !== requiredUserType) {
          // Redirect to correct dashboard if user type doesn't match
          navigate(`/${auth.user?.userType}/dashboard`);
        }
      });
    }
  }, [isAuthenticated, isLoading, navigate, requiredUserType, verifyAuth]);

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  // Check if user type matches requirement
  if (requiredUserType && user?.userType !== requiredUserType) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg text-red-600">
          Access denied. {requiredUserType === 'company' ? 'Company' : 'Specialist'} account required.
        </div>
      </div>
    );
  }

  // If not authenticated, show nothing (will redirect)
  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}