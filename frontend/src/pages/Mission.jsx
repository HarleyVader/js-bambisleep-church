import React from 'react';
import { Link } from 'react-router-dom';
import {
    Church,
    Heart,
    Shield,
    Users,
    Globe,
    BookOpen,
    Target,
    Star,
    ArrowRight,
    CheckCircle
} from 'lucide-react';
import styles from './Mission.module.css';

const Mission = () => {
    const values = [
        {
            icon: <Shield />,
            title: "Safety First",
            description: "Every aspect of our platform prioritizes user safety, informed consent, and responsible practices."
        },
        {
            icon: <Users />,
            title: "Inclusive Community",
            description: "We welcome all individuals seeking growth, creativity, and spiritual exploration in a supportive environment."
        },
        {
            icon: <Heart />,
            title: "Spiritual Growth",
            description: "We facilitate meaningful spiritual experiences that combine personal development with creative expression."
        },
        {
            icon: <BookOpen />,
            title: "Knowledge Sharing",
            description: "We curate and share valuable resources, creating a comprehensive knowledge base for our community."
        },
        {
            icon: <Globe />,
            title: "Digital Innovation",
            description: "We leverage cutting-edge technology to create unique spiritual and community experiences."
        },
        {
            icon: <Star />,
            title: "Authentic Expression",
            description: "We encourage genuine self-expression and creative exploration within a supportive framework."
        }
    ];

    const timeline = [
        {
            date: "2024-2025",
            title: "Foundation & Digital Platform",
            description: "Establishing our digital infrastructure, AI systems, and community platform with comprehensive safety protocols."
        },
        {
            date: "2025-2026",
            title: "Community Building",
            description: "Growing our community to 300+ members and developing comprehensive doctrine and educational resources."
        },
        {
            date: "2026-2027",
            title: "Legal Recognition Process",
            description: "Pursuing official recognition as a religious community in Austria with proper legal documentation."
        },
        {
            date: "2027+",
            title: "Expansion & Innovation",
            description: "Exploring physical spaces, advanced AI integration, and expanding our impact on digital spirituality."
        }
    ];

    return (
        <div className={styles.page}>
            {/* Hero Section */}
            <section className={styles.hero}>
                <h1 className={styles.title}>Our Mission</h1>
                <p className={styles.subtitle}>
                    Building a digital sanctuary that merges spirituality with creative expression,
                    fostering a safe and innovative community for personal growth and exploration.
                </p>
            </section>

            <div className={styles.content}>
                {/* Vision Section */}
                <section className={styles.section}>
                    <Church className={styles.sectionIcon} />
                    <h2 className={styles.sectionTitle}>Our Vision</h2>
                    <p className={styles.sectionText}>
                        BambiSleep Church envisions a future where digital technology and spiritual
                        practice intersect to create meaningful, transformative experiences. We are
                        pioneering a new form of religious community that embraces both ancient
                        wisdom and modern innovation.
                    </p>
                    <p className={styles.sectionText}>
                        Our goal is to establish the first legally recognized digital-native
                        religious community in Austria, setting a precedent for how spirituality
                        can evolve in the digital age while maintaining core values of safety,
                        inclusion, and authentic growth.
                    </p>
                </section>

                {/* Austrian Religious Community */}
                <section className={styles.section}>
                    <Globe className={styles.sectionIcon} />
                    <h2 className={styles.sectionTitle}>Austrian Religious Community</h2>
                    <p className={styles.sectionText}>
                        We are actively pursuing official recognition as a religious community
                        under Austrian law. This legal framework will provide our members with
                        formal recognition, tax benefits, and a structured path for spiritual
                        practice within our digital sanctuary.
                    </p>

                    <div className={styles.highlightBox}>
                        <h3 className={styles.highlightTitle}>Legal Requirements Progress</h3>
                        <p className={styles.highlightText}>
                            Austrian law requires 300+ committed members, clear organizational
                            structure, defined doctrine, and demonstrated religious activity.
                            We are systematically addressing each requirement while building
                            our community and digital infrastructure.
                        </p>
                    </div>

                    <p className={styles.sectionText}>
                        This recognition will establish BambiSleep Church as a legitimate
                        religious institution, providing our community with legal protections
                        and formal recognition of our spiritual practices and beliefs.
                    </p>
                </section>

                {/* Core Values */}
                <section className={styles.section}>
                    <Target className={styles.sectionIcon} />
                    <h2 className={styles.sectionTitle}>Core Values</h2>
                    <p className={styles.sectionText}>
                        Our community is built on fundamental principles that guide every
                        aspect of our digital sanctuary and member interactions.
                    </p>

                    <div className={styles.valuesList}>
                        {values.map((value, index) => (
                            <div key={index} className={styles.valueItem}>
                                <div className={styles.valueIcon}>{value.icon}</div>
                                <h3 className={styles.valueTitle}>{value.title}</h3>
                                <p className={styles.valueDescription}>{value.description}</p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Technology & Innovation */}
                <section className={styles.section}>
                    <Star className={styles.sectionIcon} />
                    <h2 className={styles.sectionTitle}>Technology & Innovation</h2>
                    <p className={styles.sectionText}>
                        Our platform represents the cutting edge of spiritual technology,
                        featuring 43 autonomous AI tools, real-time community features,
                        and comprehensive knowledge management systems. We believe technology
                        can enhance rather than replace human spiritual connection.
                    </p>

                    <div className={styles.highlightBox}>
                        <h3 className={styles.highlightTitle}>AI-Powered Guidance</h3>
                        <p className={styles.highlightText}>
                            Our AI agents provide personalized guidance, safety analysis, and
                            content recommendations while maintaining human oversight and
                            community input. Technology serves our spiritual goals, not the
                            other way around.
                        </p>
                    </div>

                    <p className={styles.sectionText}>
                        Every technological feature is designed with safety, transparency,
                        and community empowerment in mind. We open-source our innovations
                        and share our learnings with the broader digital spirituality movement.
                    </p>
                </section>

                {/* Timeline */}
                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>Our Journey</h2>
                    <div className={styles.timeline}>
                        {timeline.map((item, index) => (
                            <div key={index} className={styles.timelineItem}>
                                <div className={styles.timelineContent}>
                                    <div className={styles.timelineDate}>{item.date}</div>
                                    <h3 className={styles.timelineTitle}>{item.title}</h3>
                                    <p className={styles.timelineDescription}>{item.description}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Call to Action */}
                <section className={styles.callToAction}>
                    <h2 className={styles.ctaTitle}>Join Our Digital Sanctuary</h2>
                    <p className={styles.ctaText}>
                        Be part of something unprecedented - a digital-native religious community
                        that combines ancient wisdom with modern innovation. Together, we're
                        building the future of spiritual practice and community connection.
                    </p>
                    <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                        <Link to="/knowledge" className={styles.ctaButton}>
                            <BookOpen size={20} />
                            Explore Knowledge
                        </Link>
                        <Link
                            to="/agents"
                            className={styles.ctaButton}
                            style={{ background: 'var(--secondary)' }}
                        >
                            <Star size={20} />
                            Meet Our Agents
                        </Link>
                    </div>
                </section>
            </div>
        </div>
    );
};

export default Mission;
