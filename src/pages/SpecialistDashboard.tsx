import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNavigate } from "react-router-dom";
import { Bell, Briefcase, MessageSquare, User, Video } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/user";
import { specialistApi } from "@/lib/api";
import { chatApi } from "@/lib/api";
import ApplyDialog from "@/components/ApplyDialog";

type Match = {
  id: string;
  position: string;
  company: string;
  companyId?: string; // Add this - the actual company user ID
  jobId: string;
  location?: string;
  requirements?: string[];
  matchScore?: number;
  status?: string;
};

type NotificationItem = {
  id: string;
  message: string;
  time?: string;
  read?: boolean;
};

const SpecialistDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();

  const [matches, setMatches] = useState<Match[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch matches and notifications from backend
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);

        // Use the authenticated API calls
        const [matchesResponse, notificationsResponse] = await Promise.all([
          specialistApi.getMatches(),
          specialistApi.getNotifications()
        ]);

        if (matchesResponse.success) {
          const sortedMatches = [...(matchesResponse.matches || [])]
            .sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));
          setMatches(sortedMatches);
        }

        if (notificationsResponse.success) {
          setNotifications(notificationsResponse.notifications || []);
        }

      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        toast({
          title: "Error",
          description: "Unable to load your dashboard data.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();

    // Note: WebSocket implementation can be added back later if needed
    // For now, we'll focus on the authenticated REST API

  }, [toast]);

  const handleMessageClick = async (companyId: string, companyName: string) => {
    // Validate that we have a proper ID
    if (!companyId || companyId === 'null' || companyId === 'undefined') {
      toast({
        title: "Error",
        description: "Invalid company ID",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await chatApi.startChat(companyId, 'company');

      if (response.success) {
        navigate(`/chat?chatId=${response.chat._id}&recipientId=${companyId}&recipientName=${encodeURIComponent(companyName)}&recipientType=company`);
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

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-blue-100">
        <p className="text-lg font-medium text-gray-600">Loading your dashboard...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-blue-100">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold">Specialist Dashboard</h1>
            {user && (
              <Badge variant="secondary" className="ml-2">
                {user.name}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              {notifications.filter(n => !n.read).length > 0 && (
                <span className="absolute top-1 right-1 h-2 w-2 bg-destructive rounded-full" />
              )}
            </Button>
            <Button variant="ghost" onClick={() => navigate("/chat")}>
              <MessageSquare className="mr-2 h-4 w-4" />
              Messages
            </Button>
            <Button variant="ghost" onClick={() => navigate("/specialist/interviews")}>
              <Video className="mr-2 h-4 w-4" />
              My Interviews
            </Button>
            <Button variant="outline" onClick={() => navigate("/specialist/profile")}>
              <User className="mr-2 h-4 w-4" />
              Profile
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <Tabs defaultValue="matches" className="space-y-6">
          <TabsList>
            <TabsTrigger value="matches">
              <Briefcase className="mr-2 h-4 w-4" />
              Job Matches
            </TabsTrigger>
            <TabsTrigger value="notifications">
              <Bell className="mr-2 h-4 w-4" />
              Notifications
              {notifications.filter(n => !n.read).length > 0 && (
                <Badge variant="destructive" className="ml-2 h-5 w-5 p-0 flex items-center justify-center">
                  {notifications.filter(n => !n.read).length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Job Matches Tab */}
          <TabsContent value="matches" className="space-y-4">
            {matches.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center text-gray-600">
                    <Briefcase className="mx-auto h-12 w-12 mb-4 text-gray-400" />
                    <p className="text-lg font-medium mb-2">No job matches yet</p>
                    <p className="text-sm">We'll notify you when we find matches for your skills!</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {matches.map((match, idx) => (
                  <Card key={match.id || idx} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <CardTitle>{match.position}</CardTitle>
                          <CardDescription>
                            {match.company} • {match.location || 'Remote'}
                          </CardDescription>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <Badge variant={match.status === "new" ? "default" : "secondary"}>
                            {match.matchScore ?? 0}% Match
                          </Badge>
                          {match.status && (
                            <Badge variant="outline" className="text-xs">
                              {match.status}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {match.requirements && match.requirements.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {match.requirements.map((req: string, idx2: number) => (
                              <Badge key={idx2} variant="outline">{req}</Badge>
                            ))}
                          </div>
                        )}
                        <div className="flex gap-2">
                          <Button size="lg" onClick={() => {
                            // Use companyId instead of company name
                            const companyId = match.companyId || match.company;
                            handleMessageClick(companyId, match.company);
                          }}>
                            <MessageSquare className="mr-2 h-4 w-4" />
                            Message Company
                          </Button>
                          <ApplyDialog
                            jobId={match.jobId}
                            jobTitle={match.position}
                            companyName={match.company}
                          />
                          <Button size="lg" variant="outline" onClick={() => navigate("/video")}>
                            <Video className="mr-2 h-4 w-4" />
                            Schedule Interview
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="space-y-4">
            {notifications.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center text-gray-600">
                    <Bell className="mx-auto h-12 w-12 mb-4 text-gray-400" />
                    <p className="text-lg font-medium">No notifications</p>
                    <p className="text-sm">You're all caught up!</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              notifications.map((notification, idx) => (
                <Card
                  key={notification.id || idx}
                  className={notification.read ? "opacity-60" : "border-l-4 border-l-blue-500"}
                >
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="font-medium">{notification.message}</p>
                        {!notification.read && (
                          <Badge variant="secondary" className="mt-1 text-xs">
                            New
                          </Badge>
                        )}
                      </div>
                      <span className="text-sm text-muted-foreground whitespace-nowrap ml-4">
                        {notification.time}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default SpecialistDashboard;
