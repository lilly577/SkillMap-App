import { useAuth } from '@/hooks/user';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import LoginDialog from '@/components/LoginDialog';

export default function Home() {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 to-indigo-300">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Welcome to SkillMap
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Connect companies with skilled specialists. Find your perfect match through our intelligent matching system.
          </p>

          {isAuthenticated ? (
            <div className="space-y-4">
              <p className="text-lg text-gray-700">
                Welcome back, {user?.name}! 
              </p>
              <Button 
                size="lg" 
                onClick={() => navigate(`/${user?.userType}/dashboard`)}
              >
                Go to Dashboard
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-lg text-gray-700">
                Get started by creating an account
              </p>
              <div className="flex justify-center space-x-4">
                <LoginDialog />
                <Button 
                  variant="outline" 
                  size="lg"
                  onClick={() => navigate('/specialists')}
                >
                  Browse Specialists
                </Button>
                <Button 
                  variant="outline" 
                  size="lg"
                  onClick={() => navigate('/jobs')}
                >
                  Browse Jobs
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Features Section */}
        <div className="mt-20 grid md:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-xl font-semibold mb-3">For Companies</h3>
            <p className="text-gray-600">
              Find the perfect specialists for your projects with our intelligent matching algorithm.
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-xl font-semibold mb-3">For Specialists</h3>
            <p className="text-gray-600">
              Discover job opportunities that match your skills and preferences.
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-xl font-semibold mb-3">Smart Matching</h3>
            <p className="text-gray-600">
              Our AI-powered system ensures the best matches between companies and specialists.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}