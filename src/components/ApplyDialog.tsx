import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/user";
import { applicationsApi } from "@/lib/api";

interface ApplyDialogProps {
  jobId: string;
  jobTitle: string;
  companyName: string;
  onApplied?: () => void;
}

const ApplyDialog = ({ jobId, jobTitle, companyName, onApplied }: ApplyDialogProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [coverLetter, setCoverLetter] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { user, isAuthenticated } = useAuth();

  const handleApply = async () => {
    if (!isAuthenticated) {
      toast({
        title: "Login Required",
        description: "Please login to apply for this job",
        variant: "destructive",
      });
      return;
    }

    if (user?.userType !== 'specialist') {
      toast({
        title: "Access Denied",
        description: "Only specialists can apply for jobs",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await applicationsApi.applyForJob(jobId, coverLetter);

      if (response.success) {
        toast({
          title: "Application Submitted!",
          description: `You have successfully applied for ${jobTitle} at ${companyName}`,
        });
        setIsOpen(false);
        setCoverLetter("");
        onApplied?.();
      } else {
        throw new Error(response.message);
      }
    } catch (error: unknown) {
      console.error('Error applying for job:', error);
      toast({
        title: "Application Failed",
        description: error instanceof Error ? error.message : "Failed to apply for job. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button size="lg">
          Apply Now
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Apply for {jobTitle}</DialogTitle>
          <DialogDescription>
            Apply for this position at {companyName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="coverLetter">Cover Letter (Optional)</Label>
            <Textarea
              id="coverLetter"
              placeholder="Tell the company why you're a good fit for this position..."
              value={coverLetter}
              onChange={(e) => setCoverLetter(e.target.value)}
              rows={4}
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
              onClick={handleApply}
              disabled={isLoading}
            >
              {isLoading ? "Applying..." : "Submit Application"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ApplyDialog;