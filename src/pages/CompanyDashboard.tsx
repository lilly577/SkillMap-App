import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Bell, Briefcase, MessageSquare, Plus, Users, Video } from "lucide-react";
import { useAuth } from "@/hooks/user";
import { applicationsApi, companyApi, specialistsApi } from "@/lib/api";
import { chatApi } from "@/lib/api";
import ScheduleInterviewDialog from "@/components/ScheduleInterviewDialog";

const CompanyDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();

  const [isPostJobOpen, setIsPostJobOpen] = useState(false);
  const [jobData, setJobData] = useState({
    title: "",
    description: "",
    requirements: "",
    location: "",
    experienceYears: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [postedJobs, setPostedJobs] = useState<any[]>([]);
  const [candidates, setCandidates] = useState<any[]>([]);
  const [matchedCandidates, setMatchedCandidates] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);


  // Fetch company data
  useEffect(() => {
    const fetchCompanyData = async () => {
      try {
        setIsLoading(true);
        await loadApplications();
        // Fetch posted jobs, matched candidates, and all specialists
        const [jobsResponse, matchesResponse, specialistsResponse] = await Promise.all([
          companyApi.getMyJobs(),
          companyApi.getMatchedCandidates(),
          specialistsApi.getAll()
        ]);

        if (jobsResponse.success) {
          setPostedJobs(jobsResponse.jobs || []);
        }

        if (matchesResponse.success) {
          const sortedCandidates = [...(matchesResponse.candidates || [])]
            .sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));
          setMatchedCandidates(sortedCandidates);
        }

        if (specialistsResponse.success) {
          setCandidates(specialistsResponse.candidates || []);
        }

      } catch (error) {
        console.error("Error fetching company data:", error);
        toast({
          title: "Error",
          description: "Unable to load dashboard data.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchCompanyData();
  }, [toast]);

  // load applications
  const loadApplications = async () => {
    try {
      const response = await applicationsApi.getCompanyApplications();
      if (response.success) {
        setApplications(response.applications);
      }
    } catch (error) {
      console.error('Error loading applications:', error);
    }
  };

  const matchedCandidatesWithApps = matchedCandidates.map(candidate => {
    // Find the corresponding application
    const application = applications.find(app =>
      app.specialistId?._id?.toString() === candidate.specialistId?.toString() ||
      app.specialistId?._id?.toString() === candidate.id?.toString()
    );

    return {
      ...candidate,
      applicationId: application?._id
    };
  });

  const handleMessageCandidate = async (candidateId: string, candidateName: string) => {
    try {
      // Use the actual specialist user ID, not the match ID
      const response = await chatApi.startChat(candidateId, 'specialist');

      if (response.success) {
        navigate(`/chat?chatId=${response.chat._id}&recipientId=${candidateId}&recipientName=${encodeURIComponent(candidateName)}&recipientType=specialist`);
      } else {
        toast({
          title: "Error",
          description: "Failed to start conversation",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error starting chat:', error);
      toast({
        title: "Error",
        description: "Failed to start conversation",
        variant: "destructive",
      });
    }
  };

  // Enhanced function to post job to backend
  const handlePostJob = async (e: React.FormEvent) => {
    e.preventDefault();

    // Basic client-side validation
    if (!jobData.title.trim() || !jobData.description.trim()) {
      toast({
        title: "Validation Error",
        description: "Title and description are required.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await companyApi.postJob({
        ...jobData,
        experienceYears: parseInt(jobData.experienceYears, 10) || 0,
      });

      if (response.success) {
        toast({
          title: "Job Posted Successfully!",
          description: "We'll notify matching candidates via email.",
        });

        setIsPostJobOpen(false);
        setJobData({
          title: "",
          description: "",
          requirements: "",
          location: "",
          experienceYears: "",
        });

        // Refresh jobs list
        const jobsResponse = await companyApi.getMyJobs();
        if (jobsResponse.success) {
          setPostedJobs(jobsResponse.jobs || []);
        }
      } else {
        throw new Error(response.message || "Failed to post job");
      }
    } catch (error: any) {
      console.error("Error posting job:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to post job. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-blue-100">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold">Company Dashboard</h1>
            {user && (
              <Badge variant="secondary" className="ml-2">
                {user.name}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-4">
            <Dialog open={isPostJobOpen} onOpenChange={setIsPostJobOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Post Job
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Post a New Job</DialogTitle>
                  <DialogDescription>
                    Fill in the details to find the perfect candidate.
                  </DialogDescription>
                </DialogHeader>
                {/* Post Job Form */}
                <form onSubmit={handlePostJob} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Job Title *</Label>
                    <Input
                      id="title"
                      required
                      value={jobData.title}
                      onChange={(e) => setJobData({ ...jobData, title: e.target.value })}
                      placeholder="Senior Full Stack Developer"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Job Description *</Label>
                    <Textarea
                      id="description"
                      required
                      value={jobData.description}
                      onChange={(e) =>
                        setJobData({ ...jobData, description: e.target.value })
                      }
                      placeholder="Describe the role and responsibilities..."
                      rows={4}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="requirements">Required Skills *</Label>
                    <Textarea
                      id="requirements"
                      required
                      value={jobData.requirements}
                      onChange={(e) =>
                        setJobData({ ...jobData, requirements: e.target.value })
                      }
                      placeholder="React, Node.js, MongoDB, 5+ years experience..."
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="location">Location *</Label>
                    <Input
                      id="location"
                      required
                      value={jobData.location}
                      onChange={(e) =>
                        setJobData({ ...jobData, location: e.target.value })
                      }
                      placeholder="San Francisco, CA or Remote"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="experienceYears">Required Experience (Years) *</Label>
                    <Input
                      id="experienceYears"
                      type="number"
                      required
                      min="0"
                      value={jobData.experienceYears}
                      onChange={(e) =>
                        setJobData({ ...jobData, experienceYears: e.target.value })
                      }
                      placeholder="5"
                    />
                  </div>

                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Posting..." : "Post Job"}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>

            <Button variant="ghost" size="icon">
              <Bell className="h-5 w-5" />
            </Button>

            <Button variant="ghost" onClick={() => navigate("/chat")}>
              <MessageSquare className="mr-2 h-4 w-4" />
              Messages
            </Button>
            <Button variant="ghost" onClick={() => navigate("/company/interviews")}>
              <Video className="mr-2 h-4 w-4" />
              Interviews
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <Tabs defaultValue="candidates" className="space-y-6">
          <TabsList>
            <TabsTrigger value="candidates">
              <Users className="mr-2 h-4 w-4" />
              Matched Candidates
            </TabsTrigger>
            <TabsTrigger value="jobs">
              <Briefcase className="mr-2 h-4 w-4" />
              Posted Jobs
            </TabsTrigger>
            <TabsTrigger value="browse">
              <Users className="mr-2 h-4 w-4" />
              Browse All Specialists
            </TabsTrigger>
          </TabsList>

          {/* Matched Candidates Tab */}
          <TabsContent value="candidates" className="space-y-4">
            {isLoading ? (
              <div className="text-center py-8">
                <p className="text-gray-600">Loading candidates...</p>
              </div>
            ) : matchedCandidates.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center text-gray-600">
                    <Users className="mx-auto h-12 w-12 mb-4 text-gray-400" />
                    <p className="text-lg font-medium mb-2">No matched candidates yet</p>
                    <p className="text-sm">Post jobs to find matching specialists!</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {matchedCandidatesWithApps.map((candidate) => (
                  <Card key={candidate.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <CardTitle>{candidate.name}</CardTitle>
                          <CardDescription>
                            {candidate.expertise} • {candidate.experience} years experience
                          </CardDescription>
                        </div>
                        <Badge variant="default">{candidate.matchScore}% Match</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex flex-wrap gap-2">
                          {candidate.skills?.map((skill: string, idx: number) => (
                            <Badge key={idx} variant="outline">
                              {skill}
                            </Badge>
                          ))}
                        </div>
                        <div className="flex gap-2">
                          <Button onClick={() => handleMessageCandidate(candidate.specialistId || candidate.id, candidate.name)}>
                            <MessageSquare className="mr-2 h-4 w-4" />
                            Message Candidate
                          </Button>
                          <ScheduleInterviewDialog
                            specialistId={candidate.specialistId || candidate.id}
                            specialistName={candidate.name}
                            jobTitle={candidate.expertise} // Or use actual job title if available
                            companyName={user?.name || ''}
                            onScheduled={() => {
                              toast({
                                title: "Interview Scheduled",
                                description: `Interview scheduled with ${candidate.name}`,
                              });
                              // Optionally refresh data
                              loadApplications();
                            }}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Posted Jobs Tab */}
          <TabsContent value="jobs" className="space-y-4">
            {isLoading ? (
              <div className="text-center py-8">
                <p className="text-gray-600">Loading jobs...</p>
              </div>
            ) : postedJobs.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center text-gray-600">
                    <Briefcase className="mx-auto h-12 w-12 mb-4 text-gray-400" />
                    <p className="text-lg font-medium mb-2">No jobs posted yet</p>
                    <p className="text-sm">Click "Post Job" to create your first job listing!</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              postedJobs.map((job) => (
                <Card key={job._id || job.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle>{job.title}</CardTitle>
                        <CardDescription>{job.description}</CardDescription>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {job.requirements?.map((req: string, idx: number) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              {req}
                            </Badge>
                          ))}
                        </div>
                        <CardDescription className="mt-2">
                          <span className="font-bold">Posted:</span> {formatDate(job.createdAt)}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-6 text-sm">
                      <div>
                        <span className="text-muted-foreground font-bold">Location: </span>
                        <span className="font-semibold">{job.location}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground font-bold">Experience: </span>
                        <span className="font-semibold">{job.experienceYears} years</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          {/* Browse All Specialists Tab */}
          <TabsContent value="browse" className="space-y-4">
            {isLoading ? (
              <div className="text-center py-8">
                <p className="text-gray-600">Loading specialists...</p>
              </div>
            ) : candidates.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center text-gray-600">
                    <Users className="mx-auto h-12 w-12 mb-4 text-gray-400" />
                    <p className="text-lg font-medium">No specialists available</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {candidates.map((candidate) => (
                  <Card key={candidate._id || candidate.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="space-y-1">
                        <CardTitle>{candidate.fullName}</CardTitle>
                        <CardDescription>
                          {candidate.expertise} • {candidate.yearsExperience} years experience
                        </CardDescription>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {candidate.education && (
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">Education:</span> {candidate.education}
                          </p>
                        )}
                        <div className="flex flex-wrap gap-2">
                          {candidate.programmingLanguages?.map((skill: string, idx: number) => (
                            <Badge key={idx} variant="outline">
                              {skill}
                            </Badge>
                          ))}
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => handleMessageCandidate(candidate._id, candidate.fullName)}>
                            <MessageSquare className="mr-2 h-4 w-4" />
                            Contact
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default CompanyDashboard;
