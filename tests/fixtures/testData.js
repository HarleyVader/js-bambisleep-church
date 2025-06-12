// Test fixtures for various data structures
module.exports = {
  // Sample creator data
  creators: [
    {
      id: "test-creator-1",
      name: "Test Creator 1",
      title: "Test Creator 1 - Hypnosis Content",
      url: "https://example.com/creator1",
      votes: 5,
      description: "Sample bambisleep creator for testing"
    },
    {
      id: "test-creator-2", 
      name: "Test Creator 2",
      title: "Test Creator 2 - Audio Content",
      url: "https://example.com/creator2",
      votes: 3,
      description: "Another test creator"
    }
  ],

  // Sample link data
  links: [
    {
      id: "test-link-1",
      title: "Test Bambisleep Audio",
      url: "https://example.com/audio1",
      description: "Test bambisleep hypnosis audio",
      contentType: "audio",
      platform: "soundcloud",
      votes: 10,
      createdAt: "2025-06-12T10:00:00Z"
    },
    {
      id: "test-link-2",
      title: "Test Video Content", 
      url: "https://example.com/video1",
      description: "Test bambisleep video content",
      contentType: "video",
      platform: "youtube",
      votes: 7,
      createdAt: "2025-06-12T11:00:00Z"
    }
  ],

  // Sample vote data
  votes: [
    {
      id: "test-vote-1",
      linkId: "test-link-1",
      itemType: "link",
      type: "upvote",
      voter: "test-user-1",
      timestamp: "2025-06-12T10:30:00Z"
    },
    {
      id: "test-vote-2", 
      linkId: "test-creator-1",
      itemType: "creator",
      type: "upvote", 
      voter: "test-user-2",
      timestamp: "2025-06-12T11:30:00Z"
    }
  ],

  // Sample comment data
  comments: [
    {
      id: "test-comment-1",
      linkId: "test-link-1",
      author: "test-user-1",
      content: "Great content, very relaxing!",
      timestamp: "2025-06-12T12:00:00Z"
    },
    {
      id: "test-comment-2",
      linkId: "test-link-1", 
      author: "test-user-2",
      content: "Thanks for sharing this",
      timestamp: "2025-06-12T12:30:00Z"
    }
  ],
  // Sample bambisleep content detection patterns
  contentDetectionSamples: {
    positive: [
      "bambi sleep hypnosis audio for relaxation",
      "bambisleep transformation content",
      "hypno conditioning for sissies", 
      "bimbo princess training audio",
      "feminization hypnosis content"
    ],
    negative: [
      "regular music content",
      "news article about technology",
      "cooking recipe tutorial",
      "sports highlights video"
    ]
  }
};
