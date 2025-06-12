const UniversalContentDetector = require('../../../src/utils/universalContentDetector');
const testData = require('../../fixtures/testData');

describe('UniversalContentDetector', () => {
  let detector;

  beforeEach(() => {
    detector = new UniversalContentDetector();
  });

  describe('constructor', () => {
    it('should initialize with detection patterns', () => {
      expect(detector.detectionPatterns).toBeDefined();
      expect(detector.detectionPatterns.bambisleep).toBeInstanceOf(Array);
      expect(detector.detectionPatterns.contentTypes).toBeInstanceOf(Object);
    });

    it('should initialize with platform patterns', () => {
      expect(detector.platformPatterns).toBeDefined();
      expect(detector.platformPatterns.youtube).toBeInstanceOf(RegExp);
      expect(detector.platformPatterns.soundcloud).toBeInstanceOf(RegExp);
    });

    it('should initialize with confidence weights', () => {
      expect(detector.confidenceWeights).toBeDefined();
      expect(detector.confidenceWeights.titleMatch).toBeDefined();
      expect(detector.confidenceWeights.descriptionMatch).toBeDefined();
    });
  });

  describe('detectContent', () => {
    it('should detect bambisleep content successfully', async () => {
      const input = {
        url: 'https://soundcloud.com/bambi-sleep-audio',
        content: 'bambi sleep hypnosis for relaxation and transformation',
        metadata: {
          title: 'Bambi Sleep - Deep Hypnosis',
          description: 'Feminization hypnosis audio for sissies'
        }
      };

      const result = await detector.detectContent(input);

      expect(result.isBambiSleep).toBe(true);
      expect(result.confidence).toBeGreaterThan(0);
      expect(result.platform).toBe('soundcloud');
      expect(result.analysis.patternMatches.length).toBeGreaterThan(0);
    });

    it('should reject non-bambisleep content', async () => {
      const input = {
        url: 'https://youtube.com/watch?v=regular-music',
        content: 'regular music content about cooking',
        metadata: {
          title: 'How to Cook Pasta',
          description: 'Simple cooking tutorial'
        }
      };

      const result = await detector.detectContent(input);

      expect(result.isBambiSleep).toBe(false);
      expect(result.confidence).toBeLessThan(15); // Below bambisleep threshold
    });

    it('should detect content types correctly', async () => {
      const input = {
        url: 'https://soundcloud.com/audio-content.mp3',
        content: 'audio content with bambisleep themes',
        metadata: {
          title: 'Hypnosis Audio File',
          description: 'MP3 audio file for hypnosis'
        }
      };

      const result = await detector.detectContent(input);

      expect(result.contentTypes).toContain('audio');
    });

    it('should handle missing parameters gracefully', async () => {
      const result = await detector.detectContent({});

      expect(result).toBeDefined();
      expect(result.isBambiSleep).toBe(false);
      expect(result.confidence).toBe(0);
      expect(result.timestamp).toBeDefined();
    });

    it('should handle errors gracefully', async () => {
      // Mock a method to throw an error
      const originalMethod = detector.detectPlatform;
      detector.detectPlatform = jest.fn().mockImplementation(() => {
        throw new Error('Platform detection failed');
      });

      const result = await detector.detectContent({
        url: 'https://example.com'
      });

      expect(result.error).toBeDefined();
      expect(result.error).toBe('Platform detection failed');

      // Restore original method
      detector.detectPlatform = originalMethod;
    });
  });

  describe('detectPlatform', () => {
    it('should detect YouTube URLs', () => {
      expect(detector.detectPlatform('https://youtube.com/watch?v=123')).toBe('youtube');
      expect(detector.detectPlatform('https://youtu.be/123')).toBe('youtube');
    });

    it('should detect SoundCloud URLs', () => {
      expect(detector.detectPlatform('https://soundcloud.com/user/track')).toBe('soundcloud');
    });

    it('should detect Reddit URLs', () => {
      expect(detector.detectPlatform('https://reddit.com/r/test')).toBe('reddit');
    });

    it('should return null for unknown platforms', () => {
      expect(detector.detectPlatform('https://unknown-platform.com')).toBeNull();
    });

    it('should handle invalid URLs', () => {
      expect(detector.detectPlatform(null)).toBeNull();
      expect(detector.detectPlatform('')).toBeNull();
      expect(detector.detectPlatform('not-a-url')).toBeNull();
    });
  });

  describe('analyzeBambisleepContent', () => {
    it('should score bambisleep content positively', () => {
      const content = 'bambi sleep hypnosis for feminization training';
      const metadata = {
        title: 'Bambi Sleep - Sissy Training',
        description: 'Hypno conditioning for bimbos'
      };
      const url = 'https://example.com/bambi-content';

      const result = detector.analyzeBambisleepContent(content, metadata, url);

      expect(result.isBambiSleep).toBe(true);
      expect(result.confidence).toBeGreaterThan(15);
      expect(result.matches.length).toBeGreaterThan(0);
    });

    it('should score non-bambisleep content negatively', () => {
      const content = 'regular music content about cooking';
      const metadata = {
        title: 'Cooking Tutorial',
        description: 'How to make pasta'
      };
      const url = 'https://example.com/cooking';

      const result = detector.analyzeBambisleepContent(content, metadata, url);

      expect(result.isBambiSleep).toBe(false);
      expect(result.confidence).toBeLessThan(15);
    });

    it('should handle empty inputs', () => {
      const result = detector.analyzeBambisleepContent('', {}, '');

      expect(result.isBambiSleep).toBe(false);
      expect(result.confidence).toBe(0);
      expect(result.matches).toEqual([]);
    });
  });

  describe('detectContentTypes', () => {
    it('should detect audio content types', () => {
      const content = 'audio file with .mp3 format';
      const metadata = { title: 'Audio Track' };
      const url = 'https://example.com/audio.mp3';

      const types = detector.detectContentTypes(content, metadata, url);

      expect(types).toContain('audio');
    });

    it('should detect video content types', () => {
      const content = 'video content with visual elements';
      const metadata = { title: 'Video Training' };
      const url = 'https://example.com/video.mp4';

      const types = detector.detectContentTypes(content, metadata, url);

      expect(types).toContain('videos');
    });

    it('should detect multiple content types', () => {
      const content = 'interactive game with audio and video elements';
      const metadata = { title: 'Interactive Training Game' };
      const url = 'https://example.com/game.html';

      const types = detector.detectContentTypes(content, metadata, url);

      expect(types.length).toBeGreaterThan(1);
      expect(types).toContain('interactive');
    });
  });

  describe('containsBambisleepPatterns', () => {
    it('should detect positive patterns', () => {
      testData.contentDetectionSamples.positive.forEach(sample => {
        expect(detector.containsBambisleepPatterns(sample)).toBe(true);
      });
    });

    it('should reject negative patterns', () => {
      testData.contentDetectionSamples.negative.forEach(sample => {
        expect(detector.containsBambisleepPatterns(sample)).toBe(false);
      });
    });

    it('should be case insensitive', () => {
      expect(detector.containsBambisleepPatterns('BAMBI SLEEP')).toBe(true);
      expect(detector.containsBambisleepPatterns('BaMbI sLeEp')).toBe(true);
      expect(detector.containsBambisleepPatterns('bambisleep')).toBe(true);
    });

    it('should handle partial matches', () => {
      expect(detector.containsBambisleepPatterns('bimbo training content')).toBe(true);
      expect(detector.containsBambisleepPatterns('sissy transformation guide')).toBe(true);
      expect(detector.containsBambisleepPatterns('feminization hypnosis')).toBe(true);
    });
  });

  describe('getFileExtension', () => {
    it('should extract file extensions correctly', () => {
      expect(detector.getFileExtension('file.mp3')).toBe('.mp3');
      expect(detector.getFileExtension('https://example.com/audio.wav')).toBe('.wav');
      expect(detector.getFileExtension('document.pdf')).toBe('.pdf');
    });

    it('should handle URLs with query parameters', () => {
      expect(detector.getFileExtension('https://example.com/file.mp3?param=value')).toBe('.mp3');
    });

    it('should handle files without extensions', () => {
      expect(detector.getFileExtension('filename')).toBe('');
      expect(detector.getFileExtension('https://example.com/path')).toBe('');
    });

    it('should handle invalid inputs', () => {
      expect(detector.getFileExtension(null)).toBe('');
      expect(detector.getFileExtension('')).toBe('');
    });
  });

  describe('integration tests', () => {
    it('should process multiple content samples correctly', async () => {
      const samples = [
        {
          input: {
            url: 'https://soundcloud.com/bambi-track',
            content: 'bambi sleep hypnosis audio',
            metadata: { title: 'Bambi Sleep Audio' }
          },
          expectedBambi: true
        },
        {
          input: {
            url: 'https://youtube.com/cooking-video',
            content: 'how to cook pasta tutorial',
            metadata: { title: 'Cooking Tutorial' }
          },
          expectedBambi: false
        }
      ];

      for (const sample of samples) {
        const result = await detector.detectContent(sample.input);
        expect(result.isBambiSleep).toBe(sample.expectedBambi);
      }
    });

    it('should maintain consistent scoring', async () => {
      const input = {
        url: 'https://example.com/bambi-content',
        content: 'bambi sleep feminization hypnosis',
        metadata: { title: 'Bambi Sleep Training' }
      };

      // Run detection multiple times
      const results = [];
      for (let i = 0; i < 5; i++) {
        const result = await detector.detectContent(input);
        results.push(result.confidence);
      }

      // All results should be identical
      expect(results.every(score => score === results[0])).toBe(true);
    });
  });
});
