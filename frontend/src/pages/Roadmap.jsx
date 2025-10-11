import React, { useState } from 'react';
import {
    Calendar,
    Target,
    Users,
    DollarSign,
    CheckCircle,
    Clock,
    AlertCircle,
    TrendingUp,
    Building,
    Zap
} from 'lucide-react';
import styles from './Roadmap.module.css';

const Roadmap = () => {
    const [selectedPhase, setSelectedPhase] = useState(null);

    const phases = [
        {
            id: 1,
            title: "Phase 1: Foundation & Planning",
            progress: 75,
            status: "inProgress",
            timeline: "Q4 2024 - Q1 2025",
            budget: "€10,000 - €25,000",
            description: "Establishing digital infrastructure, legal research, and initial community building with comprehensive safety protocols.",
            tasks: [
                { title: "Digital Infrastructure Setup", status: "complete", description: "Web platform, AI systems, and MCP server implementation" },
                { title: "Knowledge Base Development", status: "complete", description: "Curated BambiSleep resources and safety guidelines" },
                { title: "Legal Research & Documentation", status: "inProgress", description: "Austrian religious community law research and requirement analysis" },
                { title: "AI Agent Development", status: "complete", description: "43 autonomous AI tools for community assistance" },
                { title: "Financial Planning", status: "inProgress", description: "Budget development and funding strategy planning" }
            ],
            deliverables: [
                "Functional web platform with AI integration",
                "Comprehensive knowledge base with 39+ entries",
                "Legal requirements documentation",
                "43 operational MCP tools",
                "Initial community safety protocols"
            ]
        },
        {
            id: 2,
            title: "Phase 2: Community Building",
            progress: 25,
            status: "inProgress",
            timeline: "Q1 2025 - Q3 2025",
            budget: "€15,000 - €35,000",
            description: "Growing to 300+ committed members while developing comprehensive doctrine and educational resources.",
            tasks: [
                { title: "Member Recruitment & Onboarding", status: "inProgress", description: "Reaching 300+ committed community members" },
                { title: "Doctrine Development", status: "inProgress", description: "Comprehensive spiritual doctrine and community guidelines" },
                { title: "Educational Content Creation", status: "pending", description: "Courses, workshops, and learning materials" },
                { title: "Community Platform Enhancement", status: "pending", description: "Advanced features for member interaction and growth" },
                { title: "Leadership Structure", status: "pending", description: "Formal governance and community leadership roles" }
            ],
            deliverables: [
                "300+ committed community members",
                "Complete spiritual doctrine document",
                "Educational curriculum and materials",
                "Community governance structure",
                "Member engagement systems"
            ]
        },
        {
            id: 3,
            title: "Phase 3: Legal Recognition",
            progress: 5,
            status: "planning",
            timeline: "Q3 2025 - Q4 2026",
            budget: "€20,000 - €50,000",
            description: "Pursuing official recognition as a religious community in Austria with complete legal documentation.",
            tasks: [
                { title: "Legal Documentation Preparation", status: "pending", description: "Complete statutes, constitution, and required paperwork" },
                { title: "Member Commitment Documentation", status: "pending", description: "Formal documentation of 300+ committed members" },
                { title: "Organizational Structure Formalization", status: "pending", description: "Official leadership hierarchy and governance" },
                { title: "Application Submission", status: "pending", description: "Submit application to Austrian Office of Religious Affairs" },
                { title: "Tax Exemption Application", status: "pending", description: "Apply for religious organization tax benefits" }
            ],
            deliverables: [
                "Complete legal documentation package",
                "Official application submission",
                "Documented organizational structure",
                "Member commitment verification",
                "Tax exemption status"
            ]
        },
        {
            id: 4,
            title: "Phase 4: Revenue & Sustainability",
            progress: 0,
            status: "future",
            timeline: "Q2 2026 - Q4 2026",
            budget: "€25,000+ Revenue Target",
            description: "Establishing sustainable revenue streams and financial independence through digital offerings and community support.",
            tasks: [
                { title: "Digital Revenue Streams", status: "pending", description: "Donations, subscriptions, and digital content sales" },
                { title: "Grant Applications", status: "pending", description: "Cultural, religious, and innovation grant applications" },
                { title: "Workshop & Event Programs", status: "pending", description: "Paid educational and community events" },
                { title: "Merchandise & Materials", status: "pending", description: "Community-branded items and educational materials" },
                { title: "Corporate Partnerships", status: "pending", description: "Ethical partnerships with aligned organizations" }
            ],
            deliverables: [
                "Multiple active revenue streams",
                "Financial sustainability achieved",
                "Grant funding secured",
                "Community event program",
                "Partnership agreements"
            ]
        },
        {
            id: 5,
            title: "Phase 5: Physical Presence & Expansion",
            progress: 0,
            status: "future",
            timeline: "2027+",
            budget: "€100,000+",
            description: "Optional expansion into physical spaces and broader community impact initiatives.",
            tasks: [
                { title: "Physical Space Assessment", status: "pending", description: "Evaluate need and options for physical community space" },
                { title: "Creative Hub Development", status: "pending", description: "Multi-purpose space for community gatherings and activities" },
                { title: "Technology Integration", status: "pending", description: "Advanced AI and community technology implementations" },
                { title: "Community Expansion", status: "pending", description: "Scaling to larger community and broader impact" },
                { title: "International Recognition", status: "pending", description: "Expand recognition to other countries and regions" }
            ],
            deliverables: [
                "Physical community space (optional)",
                "Expanded technology platform",
                "International community presence",
                "Advanced AI integration",
                "Sustainable growth model"
            ]
        }
    ];

    const milestones = [
        {
            icon: <Users />,
            title: "300 Members",
            date: "Q3 2025",
            description: "Reach required membership for Austrian religious community recognition"
        },
        {
            icon: <Building />,
            title: "Legal Recognition",
            date: "Q4 2026",
            description: "Official recognition as Austrian religious community"
        },
        {
            icon: <DollarSign />,
            title: "Financial Independence",
            date: "Q4 2026",
            description: "Achieve sustainable revenue and financial independence"
        },
        {
            icon: <Zap />,
            title: "Advanced AI Integration",
            date: "2027+",
            description: "Next-generation AI features and community tools"
        }
    ];

    const getStatusIcon = (status) => {
        switch (status) {
            case 'complete': return <CheckCircle size={16} />;
            case 'inProgress': return <Clock size={16} />;
            case 'pending': return <AlertCircle size={16} />;
            default: return <Clock size={16} />;
        }
    };

    const getStatusClass = (status) => {
        switch (status) {
            case 'complete': return 'complete';
            case 'inProgress': return 'inProgress';
            case 'planning': return 'planning';
            case 'future': return 'future';
            default: return 'future';
        }
    };

    return (
        <div className={styles.page}>
            {/* Header */}
            <header className={styles.header}>
                <h1 className={styles.title}>Development Roadmap</h1>
                <p className={styles.subtitle}>
                    Our strategic path from digital platform to legally recognized Austrian religious community
                </p>
            </header>

            {/* Overview */}
            <section className={styles.overview}>
                <h2 className={styles.overviewTitle}>Project Overview</h2>
                <p className={styles.overviewText}>
                    BambiSleep Church follows a carefully planned 5-phase approach to establish a legally
                    recognized religious community in Austria. Each phase builds upon the previous one,
                    ensuring sustainable growth, legal compliance, and community value creation.
                </p>
            </section>

            {/* Phases */}
            <section className={styles.phasesList}>
                {phases.map((phase) => (
                    <div key={phase.id} className={styles.phase}>
                        <header className={styles.phaseHeader}>
                            <h2 className={styles.phaseTitle}>{phase.title}</h2>
                            <div className={styles.phaseProgress}>
                                <div className={styles.progressBar}>
                                    <div
                                        className={styles.progressFill}
                                        style={{ width: `${phase.progress}%` }}
                                    />
                                </div>
                                <span className={styles.progressText}>{phase.progress}%</span>
                                <span className={`${styles.phaseStatus} ${styles[getStatusClass(phase.status)]}`}>
                                    {phase.status.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                                </span>
                            </div>
                        </header>

                        <div className={styles.phaseContent}>
                            <p className={styles.phaseDescription}>{phase.description}</p>

                            <div className={styles.phaseMeta}>
                                <div className={styles.metaItem}>
                                    <div className={styles.metaLabel}>Timeline</div>
                                    <div className={styles.metaValue}>{phase.timeline}</div>
                                </div>
                                <div className={styles.metaItem}>
                                    <div className={styles.metaLabel}>Budget</div>
                                    <div className={styles.metaValue}>{phase.budget}</div>
                                </div>
                                <div className={styles.metaItem}>
                                    <div className={styles.metaLabel}>Status</div>
                                    <div className={styles.metaValue}>{phase.progress}% Complete</div>
                                </div>
                            </div>

                            <div className={styles.tasksList}>
                                <h3 className={styles.tasksTitle}>Key Tasks</h3>
                                {phase.tasks.map((task, index) => (
                                    <div key={index} className={styles.task}>
                                        <div className={`${styles.taskStatus} ${styles[task.status]}`}>
                                            {getStatusIcon(task.status)}
                                        </div>
                                        <div className={styles.taskContent}>
                                            <h4 className={styles.taskTitle}>{task.title}</h4>
                                            <p className={styles.taskDescription}>{task.description}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                ))}
            </section>

            {/* Key Milestones */}
            <section className={styles.milestones}>
                <h2 className={styles.milestonesTitle}>Key Milestones</h2>
                <div className={styles.milestonesList}>
                    {milestones.map((milestone, index) => (
                        <div key={index} className={styles.milestone}>
                            <div className={styles.milestoneIcon}>{milestone.icon}</div>
                            <h3 className={styles.milestoneTitle}>{milestone.title}</h3>
                            <div className={styles.milestoneDate}>{milestone.date}</div>
                            <p className={styles.milestoneDescription}>{milestone.description}</p>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );
};

export default Roadmap;
