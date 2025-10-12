import React from 'react';
import { Map, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { ErrorBoundary } from '../components';
import styles from './Roadmap.module.css';

const Roadmap = () => {
    const roadmapItems = [
        {
            phase: 'Phase 1',
            title: 'Foundation',
            status: 'completed',
            items: ['Basic website structure', 'Tool categorization', 'Safety resources']
        },
        {
            phase: 'Phase 2',
            title: 'MCP Integration',
            status: 'in-progress',
            items: ['Connect MCP tools', 'Real-time tool status', 'Basic automation']
        },
        {
            phase: 'Phase 3',
            title: 'AI Agents',
            status: 'planned',
            items: ['Autonomous knowledge building', 'Community assistance', 'Smart recommendations']
        },
        {
            phase: 'Phase 4',
            title: 'Community',
            status: 'planned',
            items: ['User accounts', 'Community features', 'Content sharing']
        }
    ];

    const getStatusIcon = (status) => {
        switch (status) {
            case 'completed': return <CheckCircle className={styles.completed} size={20} />;
            case 'in-progress': return <Clock className={styles.inProgress} size={20} />;
            default: return <AlertCircle className={styles.planned} size={20} />;
        }
    };

    return (
        <ErrorBoundary>
            <div className={styles.roadmapPage}>
                <header className={styles.header}>
                    <Map size={48} />
                    <h1>Development Roadmap</h1>
                    <p>Our journey toward a complete digital sanctuary</p>
                </header>

                <div className={styles.timeline}>
                    {roadmapItems.map((item, index) => (
                        <div key={index} className={`${styles.roadmapItem} ${styles[item.status]}`}>
                            <div className={styles.itemHeader}>
                                {getStatusIcon(item.status)}
                                <div>
                                    <h3>{item.phase}</h3>
                                    <h4>{item.title}</h4>
                                </div>
                            </div>
                            <ul className={styles.itemList}>
                                {item.items.map((feature, idx) => (
                                    <li key={idx}>{feature}</li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
            </div>
        </ErrorBoundary>
    );
};

export default Roadmap;
