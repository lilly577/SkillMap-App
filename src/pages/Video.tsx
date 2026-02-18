import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/user";
import { useToast } from "@/hooks/use-toast";
import { interviewsApi } from "@/lib/api";
import { ArrowLeft, Video as VideoIcon, Mic, MicOff, VideoOff, Phone, Users } from "lucide-react";

const Video = () => {
  const { meetingId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, isAuthenticated } = useAuth();
  
  type Interview = {
    _id: string;
    meetingTitle: string;
    meetingLink: string;
    scheduledDate: string;
    duration: number;
    status: string;
    meetingDescription?: string;
    jobId?: { title?: string };
    companyId?: { companyName?: string };
    specialistId?: { fullName?: string };
    // Add other fields as needed
  };

  const [interview, setInterview] = useState<Interview | null>(null);
  const [loading, setLoading] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [isInCall, setIsInCall] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (meetingId && meetingId !== 'temp') {
      loadInterviewDetails();
    } else {
      setLoading(false);
      toast({
        title: "Invalid Meeting",
        description: "No valid meeting ID provided",
        variant: "destructive",
      });
    }
  }, [meetingId]);

  const loadInterviewDetails = async () => {
    try {
      setLoading(true);
      
      let interviewData = null;
      
      if (user?.userType === 'specialist') {
        const response = await interviewsApi.getSpecialistInterviews();
        if (response.success) {
          interviewData = response.interviews.find((interview: Interview) => 
            interview.meetingLink.includes(meetingId!) || interview._id === meetingId
          );
        }
      } else if (user?.userType === 'company') {
        const response = await interviewsApi.getCompanyInterviews();
        if (response.success) {
          interviewData = response.interviews.find((interview: Interview) => 
            interview.meetingLink.includes(meetingId!) || interview._id === meetingId
          );
        }
      }

      if (interviewData) {
        setInterview(interviewData);
        
        // Validate if user can join the interview
        validateInterviewAccess(interviewData);
      } else {
        toast({
          title: "Meeting Not Found",
          description: "The requested interview could not be found",
          variant: "destructive",
        });
        navigate(-1);
      }
    } catch (error) {
      console.error('Error loading interview details:', error);
      toast({
        title: "Error",
        description: "Failed to load interview details",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const validateInterviewAccess = (interviewData: Interview) => {
    const now = new Date();
    const scheduled = new Date(interviewData.scheduledDate);
    const canJoinEarly = new Date(scheduled.getTime() - 15 * 60000); // 15 minutes before
    
    // Check if interview is scheduled
    if (interviewData.status !== 'scheduled') {
      toast({
        title: "Interview Not Available",
        description: `This interview has been ${interviewData.status}`,
        variant: "destructive",
      });
      return false;
    }

    // Check if it's too early to join
    if (now < canJoinEarly) {
      toast({
        title: "Cannot Join Yet",
        description: "You can join the interview 15 minutes before the scheduled time",
        variant: "destructive",
      });
      return false;
    }

    // Check if interview is too old (more than 2 hours past scheduled time)
    const twoHoursAfter = new Date(scheduled.getTime() + 2 * 60 * 60000);
    if (now > twoHoursAfter) {
      toast({
        title: "Interview Expired",
        description: "This interview session has expired",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const startVideoCall = async () => {
    if (!interview) {
      toast({
        title: "No Interview Data",
        description: "Interview information is not available",
        variant: "destructive",
      });
      return;
    }

    // Re-validate before starting call
    if (!validateInterviewAccess(interview)) {
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: videoEnabled,
        audio: audioEnabled
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      localStreamRef.current = stream;
      setIsInCall(true);

      toast({
        title: "Meeting Started",
        description: "You have joined the video call",
      });

      try {
        await interviewsApi.updateInterviewStatus(interview._id, 'in-progress');
        setInterview({ ...interview, status: 'in-progress' });

      } catch (error) {
        console.error('Error updating interview status:', error);
      }
    } catch (error) {
      console.error('Error accessing media devices:', error);
      toast({
        title: "Camera/Mic Access Required",
        description: "Please allow camera and microphone access to join the call",
        variant: "destructive",
      });
    }
  };

  const endVideoCall = async () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    
    setIsInCall(false);

    // Update interview status to completed when call ends
    if (interview) {
      try {
        await interviewsApi.updateInterviewStatus(interview._id, 'completed');
        toast({
          title: "Call Completed",
          description: "Interview has been marked as completed",
        });
      } catch (error) {
        console.error('Error updating interview status:', error);
        toast({
          title: "Call Ended",
          description: "You have left the video call",
        });
      }
    } else {
      toast({
        title: "Call Ended",
        description: "You have left the video call",
      });
    }
  };

  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoEnabled;
        setVideoEnabled(!videoEnabled);
      }
    }
  };

  const toggleAudio = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioEnabled;
        setAudioEnabled(!audioEnabled);
      }
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
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
      return 'Now';
    } else if (diffDays > 0) {
      return `In ${diffDays} day${diffDays > 1 ? 's' : ''}`;
    } else if (diffHours > 0) {
      return `In ${diffHours} hour${diffHours > 1 ? 's' : ''}`;
    } else {
      return `In ${diffMins} minute${diffMins > 1 ? 's' : ''}`;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
          <p className="mt-4">Loading meeting...</p>
        </div>
      </div>
    );
  }

  if (!interview) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center text-white">
          <VideoIcon className="h-16 w-16 mx-auto mb-4 text-gray-400" />
          <h1 className="text-2xl font-bold mb-2">Meeting Not Found</h1>
          <p className="text-gray-300 mb-4">The requested interview could not be found or you don't have access.</p>
          <Button onClick={() => navigate(-1)}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={() => navigate(-1)} className="text-white hover:bg-gray-700">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <div>
                <h1 className="text-xl font-bold">
                  {interview.meetingTitle}
                </h1>
                <p className="text-gray-300 text-sm">
                  {formatDate(interview.scheduledDate)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant={interview.status === 'scheduled' ? 'default' : 'secondary'}>
                {interview.status.charAt(0).toUpperCase() + interview.status.slice(1)}
              </Badge>
              <Badge variant="outline">
                {getTimeUntilInterview(interview.scheduledDate)}
              </Badge>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {!isInCall ? (
          // Pre-call screen
          <div className="max-w-4xl mx-auto">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl flex items-center justify-center gap-2">
                  <VideoIcon className="h-8 w-8" />
                  {interview.meetingTitle}
                </CardTitle>
                <CardDescription className="text-gray-300">
                  Interview for <strong>{interview.jobId?.title}</strong> between{" "}
                  <strong>{interview.companyId?.companyName}</strong> and{" "}
                  <strong>{interview.specialistId?.fullName || 'Specialist'}</strong>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Meeting Info */}
                  <div className="space-y-6">
                    <div className="bg-gray-700 p-4 rounded-lg">
                      <h3 className="font-semibold mb-2">Meeting Details</h3>
                      <div className="space-y-2 text-sm">
                        <div>
                          <span className="text-gray-300">Title:</span>
                          <p className="font-medium">{interview.meetingTitle}</p>
                        </div>
                        <div>
                          <span className="text-gray-300">Scheduled:</span>
                          <p className="font-medium">{formatDate(interview.scheduledDate)}</p>
                        </div>
                        <div>
                          <span className="text-gray-300">Duration:</span>
                          <p className="font-medium">{interview.duration} minutes</p>
                        </div>
                        <div>
                          <span className="text-gray-300">Participants:</span>
                          <p className="font-medium">
                            {interview.companyId?.companyName} & {interview.specialistId?.fullName || 'Specialist'}
                          </p>
                        </div>
                        {interview.meetingDescription && (
                          <div>
                            <span className="text-gray-300">Description:</span>
                            <p className="font-medium">{interview.meetingDescription}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="bg-gray-700 p-4 rounded-lg">
                      <h3 className="font-semibold mb-2">Preparation Tips</h3>
                      <ul className="text-sm text-gray-300 space-y-1">
                        <li>• Test your camera and microphone</li>
                        <li>• Ensure good lighting</li>
                        <li>• Choose a quiet environment</li>
                        <li>• Have your portfolio ready</li>
                        <li>• Prepare questions for the interviewer</li>
                      </ul>
                    </div>
                  </div>

                  {/* Video Preview */}
                  <div className="space-y-4">
                    <div className="bg-black rounded-lg aspect-video flex items-center justify-center relative">
                      <video
                        ref={videoRef}
                        autoPlay
                        muted
                        className="w-full h-full object-cover rounded-lg"
                      />
                      {!videoEnabled && (
                        <div className="absolute text-center">
                          <VideoOff className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                          <p className="text-gray-400">Camera Off</p>
                        </div>
                      )}
                    </div>

                    {/* Controls */}
                    <div className="flex justify-center gap-4">
                      <Button
                        variant={videoEnabled ? "default" : "destructive"}
                        size="sm"
                        onClick={toggleVideo}
                      >
                        {videoEnabled ? <VideoIcon className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
                        {videoEnabled ? "Camera On" : "Camera Off"}
                      </Button>
                      <Button
                        variant={audioEnabled ? "default" : "destructive"}
                        size="sm"
                        onClick={toggleAudio}
                      >
                        {audioEnabled ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
                        {audioEnabled ? "Mic On" : "Mic Off"}
                      </Button>
                    </div>

                    <Button
                      onClick={startVideoCall}
                      className="w-full bg-green-600 hover:bg-green-700"
                      size="lg"
                      disabled={interview.status !== 'scheduled'}
                    >
                      <Phone className="mr-2 h-5 w-5" />
                      {interview.status === 'scheduled' ? 'Join Meeting' : `Meeting ${interview.status}`}
                    </Button>

                    {interview.status !== 'scheduled' && (
                      <p className="text-center text-sm text-gray-400">
                        This interview cannot be joined because it's {interview.status}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          // In-call screen
          <div className="h-[calc(100vh-200px)] flex flex-col">
            {/* Video Grid */}
            <div className="flex-1 bg-black rounded-lg relative">
              <video
                ref={videoRef}
                autoPlay
                muted
                className="w-full h-full object-cover rounded-lg"
              />
              
              {/* Controls */}
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-4">
                <Button
                  variant={videoEnabled ? "default" : "destructive"}
                  size="lg"
                  onClick={toggleVideo}
                >
                  {videoEnabled ? <VideoIcon className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
                </Button>
                <Button
                  variant={audioEnabled ? "default" : "destructive"}
                  size="lg"
                  onClick={toggleAudio}
                >
                  {audioEnabled ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
                </Button>
                <Button
                  variant="destructive"
                  size="lg"
                  onClick={endVideoCall}
                >
                  <Phone className="h-5 w-5" />
                </Button>
              </div>

              {/* Status Bar */}
              <div className="absolute top-4 left-4 bg-black bg-opacity-50 px-3 py-2 rounded-lg">
                <div className="flex items-center gap-2 text-sm">
                  <Users className="h-4 w-4" />
                  <span>2 participants</span>
                  <Badge variant="secondary" className="ml-2">
                    Live
                  </Badge>
                </div>
              </div>
            </div>

            {/* Meeting Info */}
            <div className="mt-4 bg-gray-800 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">Current Meeting</h3>
              <p className="text-sm text-gray-300">
                {interview.meetingTitle} • Started{" "}
                {new Date().toLocaleTimeString()}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Video;