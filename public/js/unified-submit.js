// Unified Submit Form JavaScript - Single form with automatic metadata validation
document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('unifiedSubmitForm');
    const urlInput = document.getElementById('url');
    const titleInput = document.getElementById('title');
    const descriptionInput = document.getElementById('description');
    const submitButton = document.getElementById('submitButton');
    const urlValidation = document.getElementById('urlValidation');
    const metadataPreview = document.getElementById('metadataPreview');
    const metadataGrid = document.getElementById('metadataGrid');
    const qualityScore = document.getElementById('qualityScore');
    const messageContainer = document.getElementById('messageContainer');

    let validationTimeout;
    let currentMetadata = null;
    let isValidUrl = false;

    // URL input handler with debouncing
    urlInput.addEventListener('input', () => {
        clearTimeout(validationTimeout);
        const url = urlInput.value.trim();
        
        if (!url) {
            hideValidation();
            return;
        }

        // Basic URL format check
        try {
            new URL(url);
        } catch {
            showValidationState('invalid', 'Invalid URL format');
            return;
        }

        // Debounced metadata fetching
        validationTimeout = setTimeout(() => {
            validateAndFetchMetadata(url);
        }, 1000);
    });

    // Form submission handler
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        if (!isValidUrl || !currentMetadata) {
            showMessage('Please enter a valid URL with detectable metadata', 'error');
            return;
        }

        await submitContent();
    });

    // Validate URL and fetch metadata
    async function validateAndFetchMetadata(url) {
        showValidationState('validating', 'Checking URL and extracting metadata...');
        
        try {
            const response = await fetch('/api/metadata', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ url })
            });

            if (response.ok) {
                const metadata = await response.json();
                
                // Validate metadata quality
                const validation = await validateMetadataQuality(metadata);
                
                if (validation.valid) {
                    currentMetadata = validation.metadata;
                    isValidUrl = true;
                    showValidationState('valid', `✓ Valid ${metadata.platform} ${metadata.type} detected`);
                    showMetadataPreview(validation.metadata, validation.score);
                    enableSubmission();
                    
                    // Auto-fill title and description if empty
                    if (!titleInput.value && metadata.title) {
                        titleInput.value = metadata.title;
                    }
                    if (!descriptionInput.value && metadata.description) {
                        descriptionInput.value = metadata.description;
                    }
                } else {
                    isValidUrl = false;
                    showValidationState('invalid', `✗ ${validation.reason}`);
                    hideMetadataPreview();
                    disableSubmission();
                }
            } else {
                const error = await response.json();
                isValidUrl = false;
                showValidationState('invalid', `✗ ${error.error || 'Failed to fetch metadata'}`);
                hideMetadataPreview();
                disableSubmission();
            }
        } catch (error) {
            console.error('Metadata validation error:', error);
            isValidUrl = false;
            showValidationState('invalid', '✗ Network error - please try again');
            hideMetadataPreview();
            disableSubmission();
        }
    }

    // Client-side metadata quality validation
    async function validateMetadataQuality(metadata) {
        if (!metadata) {
            return {
                valid: false,
                reason: 'No metadata could be extracted'
            };
        }

        // Check for essential components
        const hasTitle = metadata.title && 
                        metadata.title.length > 3 && 
                        !metadata.title.includes('Error') &&
                        metadata.title !== metadata.platform;

        const hasType = metadata.type && 
                       metadata.type !== 'link' && 
                       metadata.type !== 'webpage';

        const hasValidPlatform = metadata.platform && 
                               metadata.platform !== 'unknown' && 
                               metadata.platform !== 'generic';

        const hasCreatorInfo = metadata.uploader || 
                             metadata.author || 
                             extractCreatorFromUrl(urlInput.value);

        // Quality scoring
        let score = 0;
        if (hasTitle) score += 3;
        if (hasType) score += 2;
        if (hasValidPlatform) score += 2;
        if (hasCreatorInfo) score += 2;
        if (metadata.description && metadata.description.length > 10) score += 1;

        const minimumScore = 6;
        
        if (score < minimumScore) {
            const missingElements = [];
            if (!hasTitle) missingElements.push('meaningful title');
            if (!hasType) missingElements.push('content type');
            if (!hasValidPlatform) missingElements.push('recognized platform');
            if (!hasCreatorInfo) missingElements.push('creator/uploader info');

            return {
                valid: false,
                reason: `Insufficient metadata quality. Missing: ${missingElements.join(', ')}`,
                score: score
            };
        }

        // Add creator info if missing
        if (!hasCreatorInfo) {
            const extractedCreator = extractCreatorFromUrl(urlInput.value);
            if (extractedCreator) {
                metadata.uploader = extractedCreator;
            }
        }

        return {
            valid: true,
            score: score,
            metadata: metadata
        };
    }

    // Extract creator from URL patterns
    function extractCreatorFromUrl(url) {
        try {
            const patterns = [
                /patreon\.com\/([^\/\?]+)/,
                /ko-fi\.com\/([^\/\?]+)/,
                /youtube\.com\/(?:@|c\/|channel\/|user\/)([^\/\?]+)/,
                /soundcloud\.com\/([^\/\?]+)/,
                /vimeo\.com\/([^\/\?]+)/,
                /bambicloud\.com\/(?:user\/)?([^\/\?]+)/,
                /hypnotube\.com\/(?:user\/)?([^\/\?]+)/
            ];

            for (const pattern of patterns) {
                const match = url.match(pattern);
                if (match && match[1]) {
                    return match[1].replace(/[-_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                }
            }
        } catch (error) {
            console.error('Error extracting creator:', error);
        }
        return null;
    }

    // Show validation state
    function showValidationState(state, message) {
        urlValidation.className = `url-validation ${state}`;
        urlValidation.innerHTML = state === 'validating' ? 
            '<div class="spinner"></div>' + message : 
            message;
        urlValidation.style.display = 'block';
    }

    // Hide validation
    function hideValidation() {
        urlValidation.style.display = 'none';
        hideMetadataPreview();
        disableSubmission();
    }

    // Show metadata preview
    function showMetadataPreview(metadata, score) {
        const platformIcon = getPlatformIcon(metadata.platform);
        
        metadataGrid.innerHTML = `
            <span class="metadata-label">Platform:</span>
            <span class="metadata-value">
                <span class="platform-badge">
                    ${platformIcon} ${metadata.platform}
                </span>
            </span>
            
            <span class="metadata-label">Type:</span>
            <span class="metadata-value">${metadata.type}</span>
            
            <span class="metadata-label">Title:</span>
            <span class="metadata-value">${metadata.title}</span>
            
            ${metadata.uploader ? `
                <span class="metadata-label">Creator:</span>
                <span class="metadata-value">${metadata.uploader}</span>
            ` : ''}
            
            ${metadata.description ? `
                <span class="metadata-label">Description:</span>
                <span class="metadata-value">${truncateText(metadata.description, 100)}</span>
            ` : ''}
            
            ${metadata.isEmbeddable ? `
                <span class="metadata-label">Features:</span>
                <span class="metadata-value">▶️ Playable in browser</span>
            ` : ''}
        `;

        // Quality score
        let scoreClass = 'low';
        if (score >= 8) scoreClass = 'high';
        else if (score >= 6) scoreClass = 'medium';
        
        qualityScore.className = `quality-score ${scoreClass}`;
        qualityScore.textContent = `Quality: ${score}/10`;

        metadataPreview.style.display = 'block';
    }

    // Hide metadata preview
    function hideMetadataPreview() {
        metadataPreview.style.display = 'none';
    }

    // Enable submission
    function enableSubmission() {
        submitButton.disabled = false;
        submitButton.textContent = 'Submit Content';
    }

    // Disable submission
    function disableSubmission() {
        submitButton.disabled = true;
        submitButton.textContent = 'Enter valid URL to submit';
        isValidUrl = false;
        currentMetadata = null;
    }

    // Submit content
    async function submitContent() {
        submitButton.disabled = true;
        submitButton.innerHTML = '<div class="spinner"></div>Submitting...';
        
        try {
            const response = await fetch('/api/submit', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    url: urlInput.value.trim(),
                    title: titleInput.value.trim() || null,
                    description: descriptionInput.value.trim() || null
                })
            });

            if (response.ok) {
                const result = await response.json();
                showMessage(
                    `✓ Content submitted successfully! Detected as ${result.platform} ${result.contentType} (Quality Score: ${result.qualityScore}/10)`,
                    'success'
                );
                
                // Reset form
                form.reset();
                hideValidation();
                currentMetadata = null;
                isValidUrl = false;
                
                // Redirect after success
                setTimeout(() => {
                    window.location.href = '/platforms';
                }, 2000);
            } else {
                const error = await response.json();
                showMessage(`✗ ${error.message}`, 'error');
                if (error.details) {
                    console.error('Submission error details:', error.details);
                }
            }
        } catch (error) {
            console.error('Submit error:', error);
            showMessage('✗ Network error - please try again', 'error');
        } finally {
            enableSubmission();
        }
    }

    // Show message
    function showMessage(text, type) {
        messageContainer.innerHTML = `<div class="${type}-message">${text}</div>`;
        setTimeout(() => {
            messageContainer.innerHTML = '';
        }, 5000);
    }

    // Get platform icon
    function getPlatformIcon(platform) {
        const icons = {
            'youtube': '📺',
            'soundcloud': '🎵',
            'vimeo': '🎬',
            'patreon': '💰',
            'bambicloud': '🌙',
            'hypnotube': '💫',
            'twitter': '🐦',
            'spotify': '🎶',
            'bandcamp': '🎼',
            'direct': '📁',
            'generic': '🌐'
        };
        return icons[platform] || '🔗';
    }

    // Truncate text
    function truncateText(text, maxLength) {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    }
});
