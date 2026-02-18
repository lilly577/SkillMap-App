import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Briefcase, Filter, ArrowLeft, MapPin, Building } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import ApplyDialog from "@/components/ApplyDialog";

interface Job {
    id: string;
    title: string;
    description: string;
    requirements: string[];
    location: string;
    experienceYears: number;
    company: {
        id: string;
        name: string;
        industry: string;
        location: string;
        website: string;
    };
    createdAt: string;
}

const BrowseJobs = () => {
    const navigate = useNavigate();
    const [jobs, setJobs] = useState<Job[]>([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        search: "",
        location: "",
        industry: "all",
        minExperience: "",
        maxExperience: "",
        skills: ""
    });
    const [pagination, setPagination] = useState({
        page: 1,
        totalPages: 1,
        total: 0
    });

    const industryOptions = [
        "Technology",
        "Finance",
        "Healthcare",
        "Education",
        "E-commerce",
        "Manufacturing",
        "Consulting",
        "Startup"
    ];

    const { toast } = useToast();

    const loadJobs = async (page = 1) => {
        try {
            setLoading(true);

            // Create params object, excluding "all" values
            const params: Record<string, string> = {
                page: page.toString(),
                limit: "12"
            };

            // Only add filters that have values and are not "all"
            Object.entries(filters).forEach(([key, value]) => {
                if (value && value !== "all") {
                    params[key] = value;
                }
            });

            const queryString = new URLSearchParams(params).toString();
            const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
            const response = await fetch(`${API_BASE_URL}/api/browse/jobs?${queryString}`);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            if (data.success) {
                setJobs(data.jobs);
                setPagination({
                    page: data.currentPage,
                    totalPages: data.totalPages,
                    total: data.total
                });
            }
        } catch (error) {
            console.error('Error loading jobs:', error);
            // Show user-friendly error message
            toast({
                title: "Error",
                description: "Failed to load jobs. Please check if the server is running.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadJobs();
    }, []);

    const handleFilterChange = (key: string, value: string) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    const handleSearch = () => {
        loadJobs(1);
    };

    const handleClearFilters = () => {
        setFilters({
            search: "",
            location: "",
            industry: "all",
            minExperience: "",
            maxExperience: "",
            skills: ""
        });
        loadJobs(1);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString();
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white shadow-sm border-b">
                <div className="container mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Button variant="ghost" onClick={() => navigate("/")}>
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Back to Home
                            </Button>
                            <h1 className="text-2xl font-bold">Browse Jobs</h1>
                        </div>
                        <Badge variant="secondary" className="text-sm">
                            {pagination.total} jobs found
                        </Badge>
                    </div>
                </div>
            </header>

            <div className="container mx-auto px-4 py-8">
                {/* Filters */}
                <Card className="mb-6">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Filter className="h-5 w-5" />
                            Filters
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                            <div>
                                <Input
                                    placeholder="Search jobs or companies..."
                                    value={filters.search}
                                    onChange={(e) => handleFilterChange("search", e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                                />
                            </div>
                            <Input
                                placeholder="Location"
                                value={filters.location}
                                onChange={(e) => handleFilterChange("location", e.target.value)}
                            />
                            <Select value={filters.industry} onValueChange={(value) => handleFilterChange("industry", value)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="All Industries" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Industries</SelectItem>
                                    {industryOptions.map(industry => (
                                        <SelectItem key={industry} value={industry}>{industry}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Input
                                type="number"
                                placeholder="Min experience (years)"
                                value={filters.minExperience}
                                onChange={(e) => handleFilterChange("minExperience", e.target.value)}
                            />
                        </div>
                        <div className="flex gap-4">
                            <Input
                                placeholder="Skills required (comma separated)"
                                value={filters.skills}
                                onChange={(e) => handleFilterChange("skills", e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                                className="flex-1"
                            />
                            <Button onClick={handleSearch}>
                                <Search className="mr-2 h-4 w-4" />
                                Search
                            </Button>
                            <Button variant="outline" onClick={handleClearFilters}>
                                Clear
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Jobs Grid */}
                {loading ? (
                    <div className="text-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                        <p className="mt-4 text-gray-600">Loading jobs...</p>
                    </div>
                ) : jobs.length === 0 ? (
                    <Card>
                        <CardContent className="py-12 text-center">
                            <Briefcase className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">No jobs found</h3>
                            <p className="text-gray-500">Try adjusting your search criteria</p>
                        </CardContent>
                    </Card>
                ) : (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                            {jobs.map(job => (
                                <Card key={job.id} className="hover:shadow-lg transition-shadow">
                                    <CardHeader>
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <CardTitle className="text-xl">{job.title}</CardTitle>
                                                <CardDescription className="flex items-center gap-2 mt-1">
                                                    <Building className="h-4 w-4" />
                                                    {job.company.name}
                                                </CardDescription>
                                            </div>
                                            <Badge variant="secondary">
                                                {job.experienceYears}+ years
                                            </Badge>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-4">
                                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                                <MapPin className="h-4 w-4" />
                                                {job.location}
                                            </div>

                                            <p className="text-sm text-gray-700 line-clamp-3">
                                                {job.description}
                                            </p>

                                            <div className="flex flex-wrap gap-1">
                                                {job.requirements.slice(0, 5).map((requirement, idx) => (
                                                    <Badge key={idx} variant="outline" className="text-xs">
                                                        {requirement}
                                                    </Badge>
                                                ))}
                                                {job.requirements.length > 5 && (
                                                    <Badge variant="secondary" className="text-xs">
                                                        +{job.requirements.length - 5} more
                                                    </Badge>
                                                )}
                                            </div>

                                            <div className="flex justify-between items-center text-sm text-gray-500">
                                                <span>Posted {formatDate(job.createdAt)}</span>
                                                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                                    {job.company.industry}
                                                </span>
                                            </div>

                                            <div className="flex gap-2">
                                                <Button size="sm" variant="outline" asChild>
                                                    <a href={job.company.website} target="_blank" rel="noopener noreferrer">
                                                        Company Website
                                                    </a>
                                                </Button>
                                                <ApplyDialog
                                                    jobId={job.id}
                                                    jobTitle={job.title}
                                                    companyName={job.company.name}
                                                />
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>

                        {/* Pagination */}
                        {pagination.totalPages > 1 && (
                            <div className="flex justify-center gap-2">
                                <Button
                                    variant="outline"
                                    disabled={pagination.page === 1}
                                    onClick={() => loadJobs(pagination.page - 1)}
                                >
                                    Previous
                                </Button>
                                <span className="flex items-center px-4 text-sm text-gray-600">
                                    Page {pagination.page} of {pagination.totalPages}
                                </span>
                                <Button
                                    variant="outline"
                                    disabled={pagination.page === pagination.totalPages}
                                    onClick={() => loadJobs(pagination.page + 1)}
                                >
                                    Next
                                </Button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default BrowseJobs;