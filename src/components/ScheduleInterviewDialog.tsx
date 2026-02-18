import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/user";
import { interviewsApi, applicationsApi } from "@/lib/api";

interface ScheduleInterviewDialogProps {
  specialistId: string;
  specialistName: string;
  jobTitle: string;
  companyName: string;
  onScheduled?: () => void;
}

interface Application {
  _id: string;
  jobId?: {
    title?: string;
  } | null;
  status?: string | null;
  specialistId?: {
    _id?: string;
  } | null;
}

const ScheduleInterviewDialog = ({
  specialistId,
  specialistName,
  jobTitle,
  companyName,
  onScheduled
}: ScheduleInterviewDialogProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [applications, setApplications] = useState<Application[]>([]);
  const [selectedApplicationId, setSelectedApplicationId] = useState("");
  const [formData, setFormData] = useState({
    scheduledDate: "",
    scheduledTime: "",
    duration: "30",
    meetingTitle: "",
    meetingDescription: ""
  });

  const { toast } = useToast();
  const { user, isAuthenticated } = useAuth();

  // Load applications for this specialist
  useEffect(() => {
    const loadApplications = async () => {
      if (!isOpen || !specialistId) return;

      try {
        const response = await applicationsApi.getCompanyApplications();
        if (response.success) {
          // Filter applications for this specific specialist
          const specialistApplications = response.applications.filter(
            (app: Application) => app.specialistId?._id?.toString() === specialistId
          );
          setApplications(specialistApplications);
          
          // Auto-select if there's only one application
          if (specialistApplications.length === 1) {
            setSelectedApplicationId(specialistApplications[0]._id);
          }
        }
      } catch (error) {
        console.error('Error loading applications:', error);
      }
    };

    loadApplications();
  }, [isOpen, specialistId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isAuthenticated || user?.userType !== 'company') {
      toast({
        title: "Access Denied",
        description: "Only companies can schedule interviews",
        variant: "destructive",
      });
      return;
    }

    if (!selectedApplicationId) {
      toast({
        title: "Application Required",
        description: "Please select an application to schedule the interview for",
        variant: "destructive",
      });
      return;
    }

    // Combine date and time
    const scheduledDateTime = new Date(`${formData.scheduledDate}T${formData.scheduledTime}`);
    
    if (scheduledDateTime <= new Date()) {
      toast({
        title: "Invalid Date",
        description: "Interview must be scheduled for a future date and time",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await interviewsApi.scheduleInterview({
        applicationId: selectedApplicationId,
        scheduledDate: scheduledDateTime.toISOString(),
        duration: parseInt(formData.duration),
        meetingTitle: formData.meetingTitle || `Interview for ${jobTitle}`,
        meetingDescription: formData.meetingDescription
      });

      if (response.success) {
        toast({
          title: "Interview Scheduled!",
          description: `Interview scheduled with ${specialistName} for ${scheduledDateTime.toLocaleString()}`,
        });
        setIsOpen(false);
        setFormData({
          scheduledDate: "",
          scheduledTime: "",
          duration: "30",
          meetingTitle: "",
          meetingDescription: ""
        });
        setSelectedApplicationId("");
        onScheduled?.();
      }
    } catch (error: unknown) {
      console.error('Error scheduling interview:', error);
      const message =
        error instanceof Error ? error.message : String(error);
      toast({
        title: "Scheduling Failed",
        description: message || "Failed to schedule interview. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Set default meeting title when job title changes
  useEffect(() => {
    if (jobTitle && !formData.meetingTitle) {
      setFormData(prev => ({
        ...prev,
        meetingTitle: `Interview for ${jobTitle}`
      }));
    }
  }, [jobTitle, formData.meetingTitle]);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          Schedule Interview
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Schedule Video Interview</DialogTitle>
          <DialogDescription>
            Schedule a video interview with {specialistName} for {jobTitle}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Application Selection */}
          <div className="space-y-2">
            <Label htmlFor="application">Select Application</Label>
            <Select 
              value={selectedApplicationId} 
              onValueChange={setSelectedApplicationId}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Choose an application" />
              </SelectTrigger>
              <SelectContent>
                {applications.length === 0 ? (
                  <SelectItem value="none" disabled>
                    No applications found
                  </SelectItem>
                ) : (
                  applications.map((application) => (
                    <SelectItem key={application._id} value={application._id}>
                      {application.jobId?.title || 'Application'} - {application.status}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            {applications.length === 0 && (
              <p className="text-sm text-red-500">
                No applications found for this candidate. They need to apply first.
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="scheduledDate">Date</Label>
              <Input
                id="scheduledDate"
                type="date"
                required
                min={new Date().toISOString().split('T')[0]}
                value={formData.scheduledDate}
                onChange={(e) => handleChange('scheduledDate', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="scheduledTime">Time</Label>
              <Input
                id="scheduledTime"
                type="time"
                required
                value={formData.scheduledTime}
                onChange={(e) => handleChange('scheduledTime', e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="duration">Duration (minutes)</Label>
            <Input
              id="duration"
              type="number"
              min="15"
              max="120"
              value={formData.duration}
              onChange={(e) => handleChange('duration', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="meetingTitle">Meeting Title</Label>
            <Input
              id="meetingTitle"
              required
              placeholder="Interview for Position"
              value={formData.meetingTitle}
              onChange={(e) => handleChange('meetingTitle', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="meetingDescription">Meeting Description (Optional)</Label>
            <Textarea
              id="meetingDescription"
              placeholder="Add any additional details or agenda items..."
              value={formData.meetingDescription}
              onChange={(e) => handleChange('meetingDescription', e.target.value)}
              rows={3}
            />
          </div>

          <div className="flex gap-2 justify-end">
            <Button
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading || !selectedApplicationId || applications.length === 0}
            >
              {isLoading ? "Scheduling..." : "Schedule Interview"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ScheduleInterviewDialog;