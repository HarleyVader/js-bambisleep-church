/**
 * Link Management Tool for Smolagents MCP Integration
 */

export class LinkManager {
    constructor() {
        this.links = new Map();
        this.categories = new Set();
    }

    /**
     * Add a new link to the collection
     */
    addLink(linkData) {
        const { id, title, url, category, description } = linkData;
        
        if (!id || !title || !url) {
            throw new Error('Missing required fields: id, title, url');
        }

        const link = {
            id,
            title,
            url,
            category: category || 'general',
            description: description || '',
            votes: 0,
            dateAdded: new Date().toISOString(),
            isActive: true
        };

        this.links.set(id, link);
        this.categories.add(link.category);
        
        return link;
    }

    /**
     * Get link by ID
     */
    getLink(id) {
        return this.links.get(id) || null;
    }

    /**
     * Get all links, optionally filtered by category
     */
    getLinks(category = null) {
        const allLinks = Array.from(this.links.values()).filter(link => link.isActive);
        
        if (category) {
            return allLinks.filter(link => link.category === category);
        }
        
        return allLinks;
    }

    /**
     * Vote on a link
     */
    voteLink(id, voteValue = 1) {
        const link = this.links.get(id);
        if (!link) {
            throw new Error('Link not found');
        }

        link.votes += voteValue;
        return link;
    }

    /**
     * Get all categories
     */
    getCategories() {
        return Array.from(this.categories);
    }

    /**
     * Delete a link
     */
    deleteLink(id) {
        const link = this.links.get(id);
        if (!link) {
            throw new Error('Link not found');
        }

        link.isActive = false;
        return link;
    }

    /**
     * Search links by title or description
     */
    searchLinks(query) {
        const searchTerm = query.toLowerCase();
        return Array.from(this.links.values())
            .filter(link => 
                link.isActive && 
                (link.title.toLowerCase().includes(searchTerm) || 
                 link.description.toLowerCase().includes(searchTerm))
            );
    }
}

export default LinkManager;
