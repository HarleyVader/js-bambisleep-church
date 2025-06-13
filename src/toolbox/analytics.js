/**
 * Analytics Tool for Smolagents MCP Integration
 */

export class Analytics {
    constructor() {
        this.events = [];
        this.sessions = new Map();
    }

    /**
     * Track a user event
     */
    trackEvent(eventData) {
        const { type, userId, data } = eventData;
        
        const event = {
            id: this.generateId(),
            type,
            userId: userId || 'anonymous',
            data: data || {},
            timestamp: new Date().toISOString()
        };

        this.events.push(event);
        return event;
    }

    /**
     * Track user session
     */
    trackSession(sessionData) {
        const { userId, action } = sessionData;
        const sessionId = userId || this.generateId();
        
        if (action === 'start') {
            this.sessions.set(sessionId, {
                id: sessionId,
                startTime: new Date().toISOString(),
                endTime: null,
                duration: 0,
                pageViews: 1,
                interactions: 0
            });
        } else if (action === 'end') {
            const session = this.sessions.get(sessionId);
            if (session) {
                session.endTime = new Date().toISOString();
                session.duration = new Date(session.endTime) - new Date(session.startTime);
            }
        }

        return this.sessions.get(sessionId);
    }

    /**
     * Get analytics summary
     */
    getSummary(timeRange = '24h') {
        const now = new Date();
        const rangeMs = this.parseTimeRange(timeRange);
        const cutoff = new Date(now.getTime() - rangeMs);

        const recentEvents = this.events.filter(event => 
            new Date(event.timestamp) > cutoff
        );

        const activeSessions = Array.from(this.sessions.values()).filter(session =>
            new Date(session.startTime) > cutoff
        );

        return {
            totalEvents: recentEvents.length,
            activeSessions: activeSessions.length,
            eventTypes: this.getEventTypeStats(recentEvents),
            averageSessionDuration: this.getAverageSessionDuration(activeSessions)
        };
    }

    /**
     * Generate unique ID
     */
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    /**
     * Parse time range string to milliseconds
     */
    parseTimeRange(range) {
        const units = { h: 3600000, d: 86400000, w: 604800000 };
        const match = range.match(/^(\d+)([hdw])$/);
        if (!match) return 86400000; // Default 24h
        return parseInt(match[1]) * units[match[2]];
    }

    /**
     * Get event type statistics
     */
    getEventTypeStats(events) {
        const stats = {};
        events.forEach(event => {
            stats[event.type] = (stats[event.type] || 0) + 1;
        });
        return stats;
    }

    /**
     * Calculate average session duration
     */
    getAverageSessionDuration(sessions) {
        const completedSessions = sessions.filter(s => s.endTime);
        if (completedSessions.length === 0) return 0;
        
        const totalDuration = completedSessions.reduce((sum, s) => sum + s.duration, 0);
        return totalDuration / completedSessions.length;
    }
}

export default Analytics;
