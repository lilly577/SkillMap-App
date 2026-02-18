import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Video, Calendar, Building, Briefcase, Clock } from "lucide-react";
import { useAuth } from "@/hooks/user";
import { useToast } from "@/hooks/use-toast";
import { interviewsApi } from "@/lib/api";

interface Interview {
  _id: string;
  jobId: {
    _id: string;
    title: string;
    description: string;
  };
  companyId: {
    _id: string;
    companyName: string;
    industry: string;
  };
  applicationId: {
    _id: string;
    status: string;
  };
  scheduledDate: string;
  duration: number;
  meetingTitle: string;
  meetingDescription: string;
  meetingLink: string;
  status: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

const SpecialistInterviews = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, isAuthenticated } = useAuth();
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);

  const loadInterviews = async () => {
    try {
      setLoading(true);
      const response = await interviewsApi.getSpecialistInterviews();

      if (response.success) {
        setInterviews(response.interviews);
      }
    } catch (error) {
      console.error('Error loading interviews:', error);
      toast({
        title: "Error",
        description: "Failed to load interviews",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated || user?.userType !== 'specialist') {
      toast({
        title: "Access Denied",
        description: "Only specialists can view interviews",
        variant: "destructive",
      });
      navigate('/');
      return;
    }
    loadInterviews();
  }, [isAuthenticated, user, navigate, toast]);

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'scheduled': return 'default';
      case 'completed': return 'secondary';
      case 'cancelled': return 'destructive';
      case 'no-show': return 'destructive';
      default: return 'secondary';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTimeUntilInterview = (scheduledDate: string) => {
    const now = new Date();
    const scheduled = new Date(scheduledDate);
    const diffMs = scheduled.getTime() - now.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMs < 0) {
      return 'Past';
    } else if (diffDays > 0) {
      return `In ${diffDays} day${diffDays > 1 ? 's' : ''}`;
    } else if (diffHours > 0) {
      return `In ${diffHours} hour${diffHours > 1 ? 's' : ''}`;
    } else {
      return `In ${diffMins} minute${diffMins > 1 ? 's' : ''}`;
    }
  };

  const handleJoinInterview = (interview: Interview) => {
    const now = new Date();
    const scheduled = new Date(interview.scheduledDate);
    const canJoin = now >= new Date(scheduled.getTime() - 15 * 60000); // 15 minutes before

    if (!canJoin) {
      toast({
        title: "Cannot Join Yet",
        description: "You can join the interview 15 minutes before the scheduled time",
        variant: "destructive",
      });
      return;
    }

    if (interview.status !== 'scheduled') {
      toast({
        title: "Interview Not Available",
        description: `This interview has been ${interview.status}`,
        variant: "destructive",
      });
      return;
    }

    // Navigate to video page with meeting ID
    const meetingId = interview.meetingLink.split('/').pop() || interview._id;
    navigate(`/video/${meetingId}`);
  };

  const handleUpdateStatus = async (interviewId: string, status: string) => {
    try {
      const response = await interviewsApi.updateInterviewStatus(interviewId, status);
      
      if (response.success) {
        toast({
          title: "Status Updated",
          description: `Interview marked as ${status}`,
        });
        loadInterviews(); // Refresh the list
      }
    } catch (error: any) {
      console.error('Error updating interview status:', error);
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update interview status",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading interviews...</p>
        </div>
      </div>
    );
  }

  const scheduledInterviews = interviews.filter(i => i.status === 'scheduled');
  const pastInterviews = interviews.filter(i => i.status !== 'scheduled');

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
              <h1 className="text-2xl font-bold">My Interviews</h1>
            </div>
            <Badge variant="secondary" className="text-sm">
              {scheduledInterviews.length} upcoming, {pastInterviews.length} past
            </Badge>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Upcoming Interviews */}
        {scheduledInterviews.length > 0 && (
          <div className="mb-12">
            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Upcoming Interviews ({scheduledInterviews.length})
            </h2>
            <div className="grid gap-6">
              {scheduledInterviews.map((interview) => (
                <Card key={interview._id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{interview.meetingTitle}</CardTitle>
                        <CardDescription className="flex items-center gap-2 mt-1">
                          <Building className="h-4 w-4" />
                          {interview.companyId.companyName}
                        </CardDescription>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <Badge variant={getStatusVariant(interview.status)}>
                          {interview.status.charAt(0).toUpperCase() + interview.status.slice(1)}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {getTimeUntilInterview(interview.scheduledDate)}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <Briefcase className="h-4 w-4 text-gray-500" />
                          <div>
                            <p className="font-medium">{interview.jobId.title}</p>
                            <p className="text-gray-600">{interview.companyId.industry}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-gray-500" />
                          <div>
                            <p className="font-medium">{formatDate(interview.scheduledDate)}</p>
                            <p className="text-gray-600">{interview.duration} minutes</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-gray-500" />
                          <div>
                            <p className="font-medium">Scheduled by</p>
                            <p className="text-gray-600 capitalize">{interview.createdBy}</p>
                          </div>
                        </div>
                      </div>

                      {interview.meetingDescription && (
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">Meeting Notes</h4>
                          <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded">
                            {interview.meetingDescription}
                          </p>
                        </div>
                      )}

                      {interview.jobId.description && (
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">Job Description</h4>
                          <p className="text-sm text-gray-700 line-clamp-3">
                            {interview.jobId.description}
                          </p>
                        </div>
                      )}

                      <div className="flex gap-2 flex-wrap">
                        <Button
                          onClick={() => handleJoinInterview(interview)}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          <Video className="mr-2 h-4 w-4" />
                          Join Interview
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => handleUpdateStatus(interview._id, 'cancelled')}
                        >
                          Cancel Interview
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Past Interviews */}
        {pastInterviews.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Past Interviews ({pastInterviews.length})
            </h2>
            <div className="grid gap-6">
              {pastInterviews.map((interview) => (
                <Card key={interview._id} className="bg-gray-50">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{interview.meetingTitle}</CardTitle>
                        <CardDescription className="flex items-center gap-2 mt-1">
                          <Building className="h-4 w-4" />
                          {interview.companyId.companyName}
                        </CardDescription>
                      </div>
                      <Badge variant={getStatusVariant(interview.status)}>
                        {interview.status.charAt(0).toUpperCase() + interview.status.slice(1)}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <Briefcase className="h-4 w-4 text-gray-500" />
                          <div>
                            <p className="font-medium">{interview.jobId.title}</p>
                            <p className="text-gray-600">{interview.companyId.industry}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-gray-500" />
                          <div>
                            <p className="font-medium">{formatDate(interview.scheduledDate)}</p>
                            <p className="text-gray-600">{interview.duration} minutes</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-sm text-gray-500">
                        Updated {new Date(interview.updatedAt).toLocaleDateString()}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {interviews.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <Video className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No interviews scheduled</h3>
              <p className="text-gray-500 mb-4">Your scheduled interviews will appear here</p>
              <Button onClick={() => navigate('/specialist/dashboard')}>
                Go to Dashboard
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default SpecialistInterviews;