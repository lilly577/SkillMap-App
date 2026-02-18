import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { Users, Building2, Zap, MessageSquare, Video, Bell } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-300">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-secondary/5 to-background py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center space-y-6">
            <h1 className="text-5xl md:text-6xl font-bold text-foreground">
              Tech Skill <span className="text-primary">Matchmaker</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Connect skilled tech professionals with innovative companies. Real-time matching, instant communication, seamless hiring.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
              <Button 
                size="lg" 
                className="bg-primary hover:bg-primary/90"
                onClick={() => navigate("/specialist/register")}
              >
                <Users className="mr-2 h-5 w-5" />
                I'm a Tech Specialist
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                className="border-primary text-primary hover:bg-primary/10"
                onClick={() => navigate("/company/register")}
              >
                <Building2 className="mr-2 h-5 w-5" />
                I'm Hiring
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-3xl font-bold text-center mb-12">Why Choose SkillMap App?</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="p-6 hover:shadow-lg transition-shadow">
              <div className="bg-primary/10 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                <Zap className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Real-Time Matching</h3>
              <p className="text-muted-foreground">
                Advanced algorithms match candidates with job requirements instantly, powered by real-time data analysis.
              </p>
            </Card>

            <Card className="p-6 hover:shadow-lg transition-shadow">
              <div className="bg-secondary/10 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                <MessageSquare className="h-6 w-6 text-secondary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Instant Communication</h3>
              <p className="text-muted-foreground">
                Built-in chat system for seamless communication between candidates and hiring companies.
              </p>
            </Card>

            <Card className="p-6 hover:shadow-lg transition-shadow">
              <div className="bg-primary/10 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                <Video className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Video Interviews</h3>
              <p className="text-muted-foreground">
                Integrated video conferencing for conducting interviews without leaving the platform.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-[url('https://img.freepik.com/premium-photo/abstract-technology-background-with-glowing-circuit-lines-blue-digital-landscape-futuristic-motherboard-design-electronic-connections-concept-cyber-network-illustration-hightech-innovation_256259-10499.jpg?semt=ais_hybrid&w=740&q=80')] bg-cover bg-center text-white">

        <div className="container mx-auto max-w-4xl text-center">
          <Bell className="h-16 w-16 mx-auto mb-6 opacity-90" />
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Get Matched with the Right Opportunities
          </h2>
          <p className="text-lg mb-8 opacity-90">
            Receive email notifications when new matches are found. Never miss the perfect opportunity.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              variant="secondary"
              onClick={() => navigate("/specialist/register")}
            >
              Get Started as Specialist
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              className="bg-transparent border-white text-white hover:bg-white/10"
              onClick={() => navigate("/company/register")}
            >
              Post a Job
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Index;
