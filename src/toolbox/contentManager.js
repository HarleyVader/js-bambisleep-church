/**
 * Content Manager Tool for Smolagents MCP Integration
 */

export class ContentManager {
    constructor() {
        this.content = new Map();
        this.templates = new Map();
    }

    /**
     * Create or update content
     */
    setContent(contentData) {
        const { id, type, title, body, metadata } = contentData;
        
        if (!id || !type) {
            throw new Error('Missing required fields: id, type');
        }

        const content = {
            id,
            type,
            title: title || '',
            body: body || '',
            metadata: metadata || {},
            lastModified: new Date().toISOString(),
            version: this.getNextVersion(id)
        };

        this.content.set(id, content);
        return content;
    }

    /**
     * Get content by ID
     */
    getContent(id) {
        return this.content.get(id) || null;
    }

    /**
     * Get content by type
     */
    getContentByType(type) {
        return Array.from(this.content.values())
            .filter(content => content.type === type);
    }

    /**
     * Generate page content with template
     */
    generatePage(templateId, data = {}) {
        const template = this.templates.get(templateId);
        if (!template) {
            throw new Error('Template not found');
        }

        return this.renderTemplate(template, data);
    }

    /**
     * Save template
     */
    saveTemplate(templateData) {
        const { id, name, content, variables } = templateData;
        
        const template = {
            id,
            name,
            content,
            variables: variables || [],
            createdAt: new Date().toISOString()
        };

        this.templates.set(id, template);
        return template;
    }

    /**
     * Simple template rendering
     */
    renderTemplate(template, data) {
        let rendered = template.content;
        
        Object.keys(data).forEach(key => {
            const placeholder = `{{${key}}}`;
            rendered = rendered.replace(new RegExp(placeholder, 'g'), data[key]);
        });

        return rendered;
    }

    /**
     * Search content
     */
    searchContent(query, type = null) {
        const searchTerm = query.toLowerCase();
        let results = Array.from(this.content.values());

        if (type) {
            results = results.filter(content => content.type === type);
        }

        return results.filter(content =>
            content.title.toLowerCase().includes(searchTerm) ||
            content.body.toLowerCase().includes(searchTerm)
        );
    }

    /**
     * Delete content
     */
    deleteContent(id) {
        return this.content.delete(id);
    }

    /**
     * Get next version number for content
     */
    getNextVersion(id) {
        const existing = this.content.get(id);
        return existing ? (existing.version || 0) + 1 : 1;
    }

    /**
     * Get all content types
     */
    getContentTypes() {
        const types = new Set();
        this.content.forEach(content => types.add(content.type));
        return Array.from(types);
    }
}

export default ContentManager;
