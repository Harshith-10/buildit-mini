"use client";

import { useState, useMemo } from "react";
import { Calendar, Search } from "lucide-react";

type HackathonStatus = "Upcoming" | "Ongoing" | "Completed";

interface Hackathon {
    id: number;
    title: string;
    description: string;
    status: HackathonStatus;
    startDate: string;
    buttonText: string;
    buttonVariant: "primary" | "secondary";
}

export default function LabExternalsPage() {
    const [activeTab, setActiveTab] = useState<string>("upcoming");
    const [searchQuery, setSearchQuery] = useState<string>("");

    const allHackathons: Hackathon[] = [
        {
            id: 1,
            title: "InnovateAI 2024",
            description: "Build innovative AI solutions to solve real-world problems and compete with developers worldwide.",
            status: "Upcoming",
            startDate: "Starts in 5 days",
            buttonText: "Register",
            buttonVariant: "primary",
        },
        {
            id: 2,
            title: "DataDive Challenge",
            description: "Analyze complex datasets and create data-driven solutions for business intelligence.",
            status: "Upcoming",
            startDate: "Starts in 2 weeks",
            buttonText: "View Details",
            buttonVariant: "secondary",
        },
        {
            id: 3,
            title: "EcoHack: Green Solutions",
            description: "Develop sustainable technology solutions to address environmental challenges.",
            status: "Upcoming",
            startDate: "Starts Nov 8, 2024",
            buttonText: "Register",
            buttonVariant: "secondary",
        },
        {
            id: 4,
            title: "HealthTech Innovations",
            description: "Create healthcare technology solutions that improve patient outcomes and accessibility.",
            status: "Ongoing",
            startDate: "Started 3 days ago",
            buttonText: "Join Now",
            buttonVariant: "primary",
        },
        {
            id: 5,
            title: "Fintech Future Summit",
            description: "Build the next generation of financial technology applications and services.",
            status: "Completed",
            startDate: "Ended 1 month ago",
            buttonText: "View Results",
            buttonVariant: "secondary",
        },
        {
            id: 6,
            title: "CyberSecure Contest",
            description: "Test your cybersecurity skills by identifying and fixing vulnerabilities.",
            status: "Upcoming",
            startDate: "Starts Dec 1, 2024",
            buttonText: "Register",
            buttonVariant: "secondary",
        },
        {
            id: 7,
            title: "GameDev Unleashed",
            description: "Design and develop innovative gaming experiences in a 48-hour sprint.",
            status: "Upcoming",
            startDate: "Starts Dec 5, 2024",
            buttonText: "View Details",
            buttonVariant: "secondary",
        },
        {
            id: 8,
            title: "Web3 Wizards",
            description: "Build decentralized applications on blockchain and explore Web3 technologies.",
            status: "Completed",
            startDate: "Ended 2 months ago",
            buttonText: "View Results",
            buttonVariant: "secondary",
        },
    ];

    // Filter hackathons based on active tab and search query
    const filteredHackathons = useMemo(() => {
        let filtered = allHackathons;

        // Filter by status tab
        if (activeTab !== "all") {
            filtered = filtered.filter(
                (hackathon) => hackathon.status.toLowerCase() === activeTab.toLowerCase()
            );
        }

        // Filter by search query
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(
                (hackathon) =>
                    hackathon.title.toLowerCase().includes(query) ||
                    hackathon.description.toLowerCase().includes(query)
            );
        }

        return filtered;
    }, [activeTab, searchQuery]);

    return (
        <div className="flex flex-col gap-6 sm:gap-8 py-4 sm:py-6 md:py-8 px-3 sm:px-4 md:px-6 lg:px-8 max-w-[1200px] mx-auto w-full font-(family-name:--font-space-grotesk)">
            {/* Page Heading */}
            <div className="flex flex-col gap-2 sm:gap-3">
                <div className="flex flex-col gap-1.5 sm:gap-2">
                    <h1 className="text-foreground text-2xl sm:text-3xl md:text-4xl font-black leading-tight tracking-[-0.033em]">
                        All Hackathons
                    </h1>
                    <p className="text-muted-foreground text-sm sm:text-base font-normal leading-normal">
                        Discover and join hackathons from around the world.
                    </p>
                </div>
            </div>

            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-4">
                <div className="flex items-center gap-1 sm:gap-2 rounded-lg bg-muted p-1 overflow-x-auto">
                    {["all", "upcoming", "ongoing", "completed"].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-2.5 sm:px-3 py-1.5 text-xs sm:text-sm font-medium rounded-md transition-all whitespace-nowrap ${activeTab === tab
                                ? "bg-background text-foreground shadow-sm"
                                : "text-muted-foreground hover:text-foreground"
                                }`}
                        >
                            {tab.charAt(0).toUpperCase() + tab.slice(1)}
                        </button>
                    ))}
                </div>

                <div className="relative w-full sm:w-auto sm:max-w-xs">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <Search className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
                    </div>
                    <input
                        className="block w-full rounded-lg border border-input bg-background pl-9 sm:pl-10 pr-3 py-2 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                        placeholder="Search hackathons..."
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            {/* Hackathon Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 md:gap-6 pt-2 sm:pt-4">
                {filteredHackathons.length === 0 ? (
                    <div className="col-span-full flex flex-col items-center justify-center py-12 px-4">
                        <div className="text-muted-foreground text-center">
                            <p className="text-lg font-semibold mb-2">No hackathons found</p>
                            <p className="text-sm">
                                {searchQuery
                                    ? "Try adjusting your search query"
                                    : "No hackathons match the selected filter"}
                            </p>
                        </div>
                    </div>
                ) : (
                    filteredHackathons.map((hackathon) => (
                        <div
                            key={hackathon.id}
                            className="flex flex-col gap-3 sm:gap-4 rounded-lg sm:rounded-xl p-4 sm:p-5 md:p-6 bg-card border border-border hover:border-border/80 transition-all hover:shadow-lg h-full"
                        >
                            <div className="flex flex-col gap-3 sm:gap-4 flex-1">
                                <div className="flex justify-between items-start gap-2">
                                    <h3 className="text-base sm:text-lg font-bold text-card-foreground flex-1">
                                        {hackathon.title}
                                    </h3>
                                    <span className="inline-flex items-center rounded-full bg-primary/20 px-2 sm:px-3 py-0.5 sm:py-1 text-[10px] sm:text-xs font-medium text-primary shrink-0">
                                        {hackathon.status}
                                    </span>
                                </div>
                                <p className="text-xs sm:text-sm text-muted-foreground line-clamp-3">
                                    {hackathon.description}
                                </p>
                                <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-muted-foreground">
                                    <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
                                    <span className="truncate">{hackathon.startDate}</span>
                                </div>
                            </div>
                            <button
                                className={`w-full rounded-lg py-2 sm:py-2.5 text-xs sm:text-sm font-semibold transition-all ${hackathon.buttonVariant === "primary"
                                    ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-md hover:shadow-lg active:scale-95"
                                    : "bg-secondary text-secondary-foreground hover:bg-secondary/80 active:scale-95"
                                    }`}
                            >
                                {hackathon.buttonText}
                            </button>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
