import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/user";
import { Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function LoginDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");
  const [loading, setLoading] = useState(false);
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    // Login fields
    loginEmail: "",
    loginPassword: "",
    
    // Register common fields
    registerEmail: "",
    registerPassword: "",
    confirmPassword: "",
    
    // Company register fields
    companyName: "",
    location: "",
    website: "",
    industry: "",
    
    // Specialist register fields
    fullName: "",
    expertise: "",
    yearsExperience: "",
    education: "",
    portfolio: "",
    programmingLanguages: "",
  });

  const { login, registerCompany, registerSpecialist } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const success = await login(formData.loginEmail, formData.loginPassword);
      
      if (success) {
        const userType = localStorage.getItem('userType') as 'company' | 'specialist';
        navigate(`/${userType}/dashboard`);
        setIsOpen(false);
        resetForm();
      } else {
        toast({
          title: "Login Failed",
          description: "Please check your credentials.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: "Login Failed",
        description: "An error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCompanyRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.registerPassword !== formData.confirmPassword) {
      toast({
        title: "Password Mismatch",
        description: "Passwords don't match!",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const success = await registerCompany({
        companyName: formData.companyName,
        email: formData.registerEmail,
        password: formData.registerPassword,
        location: formData.location,
        website: formData.website,
        industry: formData.industry,
      });

      if (success) {
        navigate('/company/dashboard');
        setIsOpen(false);
        resetForm();
      } else {
        toast({
          title: "Registration Failed",
          description: "Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Registration error:', error);
      toast({
        title: "Registration Failed",
        description: "An error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSpecialistRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.registerPassword !== formData.confirmPassword) {
      toast({
        title: "Password Mismatch",
        description: "Passwords don't match!",
        variant: "destructive",
      });
      return;
    }

    if (!cvFile) {
      toast({
        title: "CV Required",
        description: "Please upload your CV.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // Create FormData for file upload
      const formDataToSend = new FormData();
      
      // Append all specialist fields
      formDataToSend.append('fullName', formData.fullName);
      formDataToSend.append('email', formData.registerEmail);
      formDataToSend.append('password', formData.registerPassword);
      formDataToSend.append('expertise', formData.expertise);
      formDataToSend.append('yearsExperience', formData.yearsExperience);
      formDataToSend.append('education', formData.education);
      formDataToSend.append('portfolio', formData.portfolio);
      
      // Handle programming languages array
      const languagesArray = formData.programmingLanguages
        .split(',')
        .map(lang => lang.trim())
        .filter(lang => lang.length > 0);
      formDataToSend.append('programmingLanguages', JSON.stringify(languagesArray));
      
      // Append CV file
      formDataToSend.append('cv', cvFile);

      // Use the auth API call directly
      const API_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
      const response = await fetch(`${API_URL}/api/auth/specialist/register`, {
        method: "POST",
        body: formDataToSend,
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Store token and user data
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        localStorage.setItem('userType', data.user.userType);

        toast({
          title: "Registration Successful!",
          description: "Your profile has been created successfully.",
        });
        
        navigate("/specialist/dashboard");
        setIsOpen(false);
        resetForm();
        setCvFile(null);
      } else {
        toast({
          title: "Registration Failed",
          description: data.message || "Please try again later.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Registration error:', error);
      toast({
        title: "Registration Failed",
        description: "An error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      loginEmail: "", loginPassword: "",
      registerEmail: "", registerPassword: "", confirmPassword: "",
      companyName: "", location: "", website: "", industry: "",
      fullName: "", expertise: "", yearsExperience: "", education: "", portfolio: "", programmingLanguages: ""
    });
    setCvFile(null);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="default">Login / Register</Button>
      </DialogTrigger>

      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Welcome to SkillMap</DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "login" | "register")}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Login</TabsTrigger>
            <TabsTrigger value="register">Register</TabsTrigger>
          </TabsList>

          {/* Login Tab */}
          <TabsContent value="login" className="space-y-4">
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="loginEmail">Email</Label>
                <Input
                  id="loginEmail"
                  type="email"
                  required
                  placeholder="Enter your email"
                  value={formData.loginEmail}
                  onChange={(e) => handleInputChange('loginEmail', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="loginPassword">Password</Label>
                <Input
                  id="loginPassword"
                  type="password"
                  required
                  placeholder="Enter your password"
                  value={formData.loginPassword}
                  onChange={(e) => handleInputChange('loginPassword', e.target.value)}
                />
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Logging in..." : "Login"}
              </Button>
            </form>
          </TabsContent>

          {/* Register Tab */}
          <TabsContent value="register" className="space-y-4">
            <Tabs defaultValue="specialist" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="specialist">Specialist</TabsTrigger>
                <TabsTrigger value="company">Company</TabsTrigger>
              </TabsList>

              {/* Specialist Registration */}
              <TabsContent value="specialist" className="space-y-4">
                <form onSubmit={handleSpecialistRegister} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="fullName">Full Name *</Label>
                      <Input
                        id="fullName"
                        required
                        placeholder="Enter your full name"
                        value={formData.fullName}
                        onChange={(e) => handleInputChange('fullName', e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="registerEmail">Email *</Label>
                      <Input
                        id="registerEmail"
                        type="email"
                        required
                        placeholder="Enter your email"
                        value={formData.registerEmail}
                        onChange={(e) => handleInputChange('registerEmail', e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="registerPassword">Password *</Label>
                      <Input
                        id="registerPassword"
                        type="password"
                        required
                        minLength={6}
                        placeholder="Create a password"
                        value={formData.registerPassword}
                        onChange={(e) => handleInputChange('registerPassword', e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirm Password *</Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        required
                        placeholder="Confirm your password"
                        value={formData.confirmPassword}
                        onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="expertise">Area of Expertise *</Label>
                      <Select
                        value={formData.expertise}
                        onValueChange={(value) => handleInputChange('expertise', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select expertise" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="software">Software Engineer</SelectItem>
                          <SelectItem value="hardware">Hardware Engineer</SelectItem>
                          <SelectItem value="fullstack">Full Stack Developer</SelectItem>
                          <SelectItem value="frontend">Frontend Developer</SelectItem>
                          <SelectItem value="backend">Backend Developer</SelectItem>
                          <SelectItem value="devops">DevOps Engineer</SelectItem>
                          <SelectItem value="mobile">Mobile Developer</SelectItem>
                          <SelectItem value="embedded">Embedded Systems</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="yearsExperience">Years of Experience *</Label>
                      <Input
                        id="yearsExperience"
                        type="number"
                        required
                        min="0"
                        placeholder="5"
                        value={formData.yearsExperience}
                        onChange={(e) => handleInputChange('yearsExperience', e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="education">Level of Education *</Label>
                    <Select
                      value={formData.education}
                      onValueChange={(value) => handleInputChange('education', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select education level" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="highschool">High School</SelectItem>
                        <SelectItem value="associate">Associate Degree</SelectItem>
                        <SelectItem value="bachelor">Bachelor's Degree</SelectItem>
                        <SelectItem value="master">Master's Degree</SelectItem>
                        <SelectItem value="phd">PhD</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="portfolio">Portfolio Link</Label>
                    <Input
                      id="portfolio"
                      type="url"
                      placeholder="https://github.com/username"
                      value={formData.portfolio}
                      onChange={(e) => handleInputChange('portfolio', e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="programmingLanguages">Programming Languages *</Label>
                    <Textarea
                      id="programmingLanguages"
                      required
                      placeholder="JavaScript, Python, Java, C++, React, Node.js..."
                      value={formData.programmingLanguages}
                      onChange={(e) => handleInputChange('programmingLanguages', e.target.value)}
                      rows={3}
                    />
                    <p className="text-sm text-muted-foreground">Separate languages with commas</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cv">Upload CV *</Label>
                    <div className="flex items-center gap-4">
                      <Input
                        id="cv"
                        type="file"
                        accept=".pdf,.doc,.docx"
                        required
                        onChange={(e) => setCvFile(e.target.files?.[0] || null)}
                      />
                      <Upload className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <p className="text-sm text-muted-foreground">PDF, DOC, or DOCX (Max 5MB)</p>
                  </div>

                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Registering..." : "Register as Specialist"}
                  </Button>
                </form>
              </TabsContent>

              {/* Company Registration */}
              <TabsContent value="company" className="space-y-4">
                <form onSubmit={handleCompanyRegister} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="companyName">Company Name *</Label>
                    <Input
                      id="companyName"
                      required
                      placeholder="Enter company name"
                      value={formData.companyName}
                      onChange={(e) => handleInputChange('companyName', e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="registerEmailCompany">Email *</Label>
                    <Input
                      id="registerEmailCompany"
                      type="email"
                      required
                      placeholder="Enter company email"
                      value={formData.registerEmail}
                      onChange={(e) => handleInputChange('registerEmail', e.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="registerPasswordCompany">Password *</Label>
                      <Input
                        id="registerPasswordCompany"
                        type="password"
                        required
                        minLength={6}
                        placeholder="Create a password"
                        value={formData.registerPassword}
                        onChange={(e) => handleInputChange('registerPassword', e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirmPasswordCompany">Confirm Password *</Label>
                      <Input
                        id="confirmPasswordCompany"
                        type="password"
                        required
                        placeholder="Confirm your password"
                        value={formData.confirmPassword}
                        onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="industry">Industry</Label>
                      <Input
                        id="industry"
                        placeholder="e.g., Technology, Finance"
                        value={formData.industry}
                        onChange={(e) => handleInputChange('industry', e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="location">Location</Label>
                      <Input
                        id="location"
                        placeholder="e.g., San Francisco, CA"
                        value={formData.location}
                        onChange={(e) => handleInputChange('location', e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="website">Website</Label>
                    <Input
                      id="website"
                      type="url"
                      placeholder="https://company.com"
                      value={formData.website}
                      onChange={(e) => handleInputChange('website', e.target.value)}
                    />
                  </div>

                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Registering..." : "Register as Company"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}