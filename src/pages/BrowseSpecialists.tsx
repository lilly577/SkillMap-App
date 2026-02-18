import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Users, Filter, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Specialist {
    id: string;
    fullName: string;
    expertise: string;
    yearsExperience: number;
    education: string;
    portfolio: string;
    programmingLanguages: string[];
    cvUrl: string;
    createdAt: string;
}

const BrowseSpecialists = () => {
    const navigate = useNavigate();
    const [specialists, setSpecialists] = useState<Specialist[]>([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        search: "",
        expertise: "all",
        minExperience: "",
        maxExperience: "",
        skills: ""
    });
    const [pagination, setPagination] = useState({
        page: 1,
        totalPages: 1,
        total: 0
    });

    const expertiseOptions = [
        "Software Engineer",
        "Hardware Engineer",
        "Full Stack Developer",
        "Frontend Developer",
        "Backend Developer",
        "DevOps Engineer",
        "Mobile Developer",
        "Embedded Systems"
    ];

    const { toast } = useToast();

    const loadSpecialists = async (page = 1) => {
        try {
            setLoading(true);

            // Create params object, excluding "all" values
            interface QueryParams {
                page: string;
                limit: string;
                search?: string;
                expertise?: string;
                minExperience?: string;
                maxExperience?: string;
                skills?: string;
                [key: string]: string | undefined;
            }
            
            const params: QueryParams = {
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
            const response = await fetch(`${API_BASE_URL}/api/browse/specialists?${queryString}`);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            if (data.success) {
                setSpecialists(data.specialists);
                setPagination({
                    page: data.currentPage,
                    totalPages: data.totalPages,
                    total: data.total
                });
            }
        } catch (error) {
            console.error('Error loading specialists:', error);
            // Show user-friendly error message
            toast({
                title: "Error",
                description: "Failed to load specialists. Please check if the server is running.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadSpecialists();
    }, []);

    const handleFilterChange = (key: string, value: string) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    const handleSearch = () => {
        loadSpecialists(1);
    };

    const handleClearFilters = () => {
        setFilters({
            search: "",
            expertise: "all",
            minExperience: "",
            maxExperience: "",
            skills: ""
        });
        loadSpecialists(1);
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
                            <h1 className="text-2xl font-bold">Browse Specialists</h1>
                        </div>
                        <Badge variant="secondary" className="text-sm">
                            {pagination.total} specialists found
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
                                    placeholder="Search by name or expertise..."
                                    value={filters.search}
                                    onChange={(e) => handleFilterChange("search", e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                                />
                            </div>
                            <Select value={filters.expertise} onValueChange={(value) => handleFilterChange("expertise", value)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="All Expertise" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Expertise</SelectItem>
                                    {expertiseOptions.map(exp => (
                                        <SelectItem key={exp} value={exp}>{exp}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Input
                                type="number"
                                placeholder="Min experience (years)"
                                value={filters.minExperience}
                                onChange={(e) => handleFilterChange("minExperience", e.target.value)}
                            />
                            <Input
                                type="number"
                                placeholder="Max experience (years)"
                                value={filters.maxExperience}
                                onChange={(e) => handleFilterChange("maxExperience", e.target.value)}
                            />
                        </div>
                        <div className="flex gap-4">
                            <Input
                                placeholder="Skills (comma separated)"
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

                {/* Specialists Grid */}
                {loading ? (
                    <div className="text-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                        <p className="mt-4 text-gray-600">Loading specialists...</p>
                    </div>
                ) : specialists.length === 0 ? (
                    <Card>
                        <CardContent className="py-12 text-center">
                            <Users className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">No specialists found</h3>
                            <p className="text-gray-500">Try adjusting your search criteria</p>
                        </CardContent>
                    </Card>
                ) : (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                            {specialists.map(specialist => (
                                <Card key={specialist.id} className="hover:shadow-lg transition-shadow">
                                    <CardHeader>
                                        <CardTitle className="text-lg">{specialist.fullName}</CardTitle>
                                        <CardDescription>{specialist.expertise}</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-3">
                                            <div className="flex justify-between text-sm">
                                                <span className="text-gray-600">Experience:</span>
                                                <span className="font-medium">{specialist.yearsExperience} years</span>
                                            </div>
                                            {specialist.education && (
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-gray-600">Education:</span>
                                                    <span className="font-medium">{specialist.education}</span>
                                                </div>
                                            )}
                                            <div className="flex flex-wrap gap-1">
                                                {specialist.programmingLanguages.slice(0, 5).map((skill, idx) => (
                                                    <Badge key={idx} variant="secondary" className="text-xs">
                                                        {skill}
                                                    </Badge>
                                                ))}
                                                {specialist.programmingLanguages.length > 5 && (
                                                    <Badge variant="outline" className="text-xs">
                                                        +{specialist.programmingLanguages.length - 5} more
                                                    </Badge>
                                                )}
                                            </div>
                                            {specialist.portfolio && (
                                                <div className="text-sm">
                                                    <a
                                                        href={specialist.portfolio}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-blue-600 hover:underline"
                                                    >
                                                        View Portfolio
                                                    </a>
                                                </div>
                                            )}
                                            <div className="text-xs text-gray-500">
                                                Joined {formatDate(specialist.createdAt)}
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
                                    onClick={() => loadSpecialists(pagination.page - 1)}
                                >
                                    Previous
                                </Button>
                                <span className="flex items-center px-4 text-sm text-gray-600">
                                    Page {pagination.page} of {pagination.totalPages}
                                </span>
                                <Button
                                    variant="outline"
                                    disabled={pagination.page === pagination.totalPages}
                                    onClick={() => loadSpecialists(pagination.page + 1)}
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

export default BrowseSpecialists;