import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Briefcase, Building, MapPin, Calendar } from "lucide-react";
import { useAuth } from "@/hooks/user";
import { useToast } from "@/hooks/use-toast";
import { applicationsApi } from "@/lib/api";

interface Application {
  _id: string;
  jobId: {
    _id: string;
    title: string;
    description: string;
    location: string;
    experienceYears: number;
  };
  companyId: {
    _id: string;
    companyName: string;
    industry: string;
    location: string;
  };
  coverLetter: string;
  status: string;
  appliedAt: string;
  reviewedAt?: string;
}

const MyApplications = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, isAuthenticated } = useAuth();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  const loadApplications = useCallback(async () => {
    try {
      setLoading(true);
      const response = await applicationsApi.getMyApplications();

      if (response.success) {
        setApplications(response.applications);
      }
    } catch (error) {
      console.error('Error loading applications:', error);
      toast({
        title: "Error",
        description: "Failed to load applications",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (!isAuthenticated || user?.userType !== 'specialist') {
      toast({
        title: "Access Denied",
        description: "Only specialists can view applications",
        variant: "destructive",
      });
      navigate('/');
      return;
    }
    loadApplications();
  }, [isAuthenticated, user, navigate, toast, loadApplications]);

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'pending': return 'secondary';
      case 'reviewed': return 'default';
      case 'accepted': return 'default';
      case 'rejected': return 'destructive';
      default: return 'secondary';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading applications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={() => navigate('/specialist/dashboard')}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Dashboard
              </Button>
              <h1 className="text-2xl font-bold">My Applications</h1>
            </div>
            <Badge variant="secondary" className="text-sm">
              {applications.length} applications
            </Badge>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {applications.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Briefcase className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No applications yet</h3>
              <p className="text-gray-500 mb-4">Start applying for jobs to see your applications here</p>
              <Button onClick={() => navigate('/jobs')}>
                Browse Jobs
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {applications.map((application) => (
              <Card key={application._id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-xl">{application.jobId.title}</CardTitle>
                      <CardDescription className="flex items-center gap-2 mt-1">
                        <Building className="h-4 w-4" />
                        {application.companyId.companyName}
                      </CardDescription>
                    </div>
                    <Badge variant={getStatusVariant(application.status)}>
                      {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div className="flex items-center gap-2 text-gray-600">
                        <MapPin className="h-4 w-4" />
                        {application.jobId.location}
                      </div>
                      <div className="text-gray-600">
                        Experience: {application.jobId.experienceYears}+ years
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <Calendar className="h-4 w-4" />
                        Applied {formatDate(application.appliedAt)}
                      </div>
                    </div>

                    {application.coverLetter && (
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Cover Letter</h4>
                        <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded">
                          {application.coverLetter}
                        </p>
                      </div>
                    )}

                    {application.reviewedAt && (
                      <div className="text-sm text-gray-500">
                        Reviewed on {formatDate(application.reviewedAt)}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyApplications;