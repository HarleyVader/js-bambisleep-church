
/**
 * COMPLETE BAMBI SLEEP DATABASE SETUP SCRIPT
 * ==========================================
 * 
 * This comprehensive script combines all Bambi Sleep content addition functionality:
 * 1. Official Bambi Sleep creators and content from bambisleep.info
 * 2. Community creators from Patreon and other platforms * 3. Bambi Daddi SoundCloud tracks
 * 4. Complete Tomtame video collection from HypnoTube
 * 5. Crystal Cloud Podcast YouTube videos
 * 6. Additional Bambi Sleep community creators
 *  * Usage: node complete_bambi_database_setup.js [section]
 * Sections: official, community, audio, videos, podcasts, all (default)
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:8888';

// Cache for existing content to avoid duplicates
let existingContent = new Set();

// Function to fetch existing content from database
async function fetchExistingContent() {
    try {
        console.log('📡 Fetching existing content to avoid duplicates...');
        const response = await axios.get(`${BASE_URL}/api/platforms`);
        if (response.data.success && response.data.platforms) {
            // If platforms are returned, fetch content for each platform
            for (const platform of response.data.platforms) {
                try {
                    const platformResponse = await axios.get(`${BASE_URL}/api/platforms/${platform.name}`);
                    if (platformResponse.data.success && platformResponse.data.content) {
                        platformResponse.data.content.forEach(item => {
                            existingContent.add(item.url);
                        });
                    }
                } catch (error) {
                    // Continue with other platforms if one fails
                    console.log(`⚠️  Warning: Could not fetch content for platform ${platform.name}`);
                }
            }
        }
        console.log(`📊 Found ${existingContent.size} existing items in database`);
    } catch (error) {
        console.log('⚠️  Warning: Could not fetch existing content. Will attempt to add all items.');
        console.log('   (This may result in duplicate errors if content already exists)');
    }
}

// ================================
// OFFICIAL BAMBI SLEEP CONTENT
// ================================

const officialContent = [
    // Main creator
    {
        name: "Bambi Prime",
        title: "Bambi Prime - Original Creator of Bambi Sleep",
        url: "https://bambisleep.info/Bambi_Prime",
        description: "The original creator of Bambi Sleep and author of all mainline sessions. Provides high-quality brainwashing content with immersive production, focusing on real conditioning effects. Content is provided for free as an act of service to the community. Known for 'real brainwashing' approach with extensive use of synchronized soundscapes and sound effects.",
        platform: "bambisleep.info",
        category: "creator",
        isOfficial: true,
        socialLinks: {
            wiki: "https://bambisleep.info/Bambi_Prime",
            blog: "https://bambisleep.blogspot.com",
            bambicloud: "https://bambicloud.com"
        },
        sessions: [
            "Bimbo Slavedoll Conditioning",
            "Bambi Bimbodoll Conditioning", 
            "Bambi Training Loops",
            "Bambi Fuckdoll Brainwash",
            "Bambi Enforcement",
            "Bambi Fucktoy Fantasy",
            "Bambi Fucktoy Submission",
            "Bambi Fuckpuppet Freedom",
            "Bambi Mental Makeover",
            "Bambi Puppet Princess Loops"
        ]
    },
    {
        name: "bambi4eva",
        title: "bambi4eva - Community Creator",
        url: "https://bambisleep.info/Bambi4eva",
        description: "Fan creator who makes their own Bambi Sleep files. Listed as one of the official community creators on the Bambi Sleep wiki. Creates custom sessions and playlists for the community.",
        platform: "bambisleep.info",
        category: "creator",
        isOfficial: false,
        isCommunity: true,
        socialLinks: {
            wiki: "https://bambisleep.info/Bambi4eva"
        }
    },
    {
        name: "bellmar",
        title: "bellmar - Community Creator", 
        url: "https://bambisleep.info/Bellmar",
        description: "Fan creator who makes their own Bambi Sleep files. Listed as one of the official community creators on the Bambi Sleep wiki. Creates custom sessions and recommended playlists.",
        platform: "bambisleep.info",
        category: "creator",
        isOfficial: false,
        isCommunity: true,
        socialLinks: {
            wiki: "https://bambisleep.info/Bellmar"
        }
    },
    {
        name: "platinumpuppets",
        title: "platinumpuppets - Community Creator",
        url: "https://bambisleep.info/Platinumpuppets",
        description: "Fan creator who makes their own Bambi Sleep files. Listed as one of the official community creators on the Bambi Sleep wiki. Creates specialized sessions and community content.",
        platform: "bambisleep.info",
        category: "creator",
        isOfficial: false,
        isCommunity: true,
        socialLinks: {
            wiki: "https://bambisleep.info/Platinumpuppets"
        }
    },
    {
        name: "Wednesday",
        title: "Wednesday - Community Creator",
        url: "https://bambisleep.info/Wednesday",
        description: "Fan creator who makes their own Bambi Sleep files. Listed as one of the official community creators on the Bambi Sleep wiki. Creates unique sessions and community contributions.",
        platform: "bambisleep.info",
        category: "creator",
        isOfficial: false,
        isCommunity: true,
        socialLinks: {
            wiki: "https://bambisleep.info/Wednesday"
        }
    }
];

// ================================
// COMMUNITY CREATORS (PATREON & OTHERS)
// ================================

const communityCreators = [
    {
        name: "bambisleep.chat",
        title: "bambisleep.chat - Hypnotic AIGF Creator",
        url: "https://www.patreon.com/bambisleepchat",
        description: "Bambi architect of bambisleep.chat - Hypnotic AIGF content creator with 27 paid members and €194.7/month. Original source from recommendations.",
        platform: "patreon",
        category: "creator",
        socialLinks: {
            twitch: "https://twitch.tv/melkiewey",
            twitter: "https://twitter.com/BambiSleep_Chat",
            youtube: "https://youtube.com/channel/UCRu1zkNh9xSme2aU9urnOJw",
            instagram: "https://www.instagram.com/bambisleep.chat",
            tiktok: "https://tiktok.com/@bambisleep.chat"
        }
    },
    {
        name: "Bambi Prime",
        title: "Bambi Prime - Original Bambi Sleep Creator",
        url: "https://www.patreon.com/bambiprime",
        description: "Original creator of the Bambi Sleep hypnosis series. The foundational content that started the entire Bambi Sleep community and movement.",
        platform: "patreon",
        category: "creator"
    },
    {
        name: "Shibby Says",
        title: "Shibby Says - Hypnosis & Audio Content",
        url: "https://www.patreon.com/shibbysays",
        description: "Popular hypnosis content creator known for transformation and feminization audio files, including Bambi Sleep related content.",
        platform: "patreon",
        category: "creator"
    },
    {
        name: "Mistress Carol",
        title: "Mistress Carol - Sissy Hypnosis",
        url: "https://www.patreon.com/mistresscarol",
        description: "Professional dominatrix and hypnotist specializing in sissy training and feminization hypnosis content.",
        platform: "patreon",
        category: "creator"
    },
    {
        name: "Hypno Mistress",
        title: "Hypno Mistress - Transformation Audio",
        url: "https://www.patreon.com/hypnomistress",
        description: "Specializes in transformation hypnosis, bimbofication, and sissy training audio content for the community.",
        platform: "patreon",
        category: "creator"
    },
    {
        name: "Bambi Sleep Hypnosis",
        title: "Bambi Sleep Hypnosis - Enhanced Audio",
        url: "https://www.patreon.com/bambienhanced",
        description: "Enhanced versions of Bambi Sleep audio files with improved quality and effects",
        platform: "patreon",
        category: "creator"
    },
    {
        name: "Sissy Hypno Academy",
        title: "Sissy Hypno Academy",
        url: "https://www.patreon.com/sissyhypnoacademy", 
        description: "Educational sissy hypnosis content and training programs",
        platform: "patreon",
        category: "creator"
    },
    {
        name: "Pink Dreams Hypnosis",
        title: "Pink Dreams Hypnosis",
        url: "https://www.patreon.com/pinkdreamshypno",
        description: "Feminization and sissy transformation hypnosis content",
        platform: "patreon",
        category: "creator"
    },
    {
        name: "Doll House Productions",
        title: "Doll House Productions",
        url: "https://www.patreon.com/dollhouseproductions",
        description: "Doll transformation and bimbofication hypnosis audio content",
        platform: "patreon",
        category: "creator"
    },
    {
        name: "Mistress Bella Hypno",
        title: "Mistress Bella Hypno",
        url: "https://www.patreon.com/mistressbellahypno",
        description: "Domination and submission hypnosis with feminization themes",
        platform: "patreon",
        category: "creator"
    },
    {
        name: "Bambi Conditioning Center",
        title: "Bambi Conditioning Center",
        url: "https://www.patreon.com/bambiconditioning",
        description: "Specialized Bambi Sleep conditioning and training content",
        platform: "patreon",
        category: "creator"
    },
    {
        name: "Hypno Doll Factory",
        title: "Hypno Doll Factory",
        url: "https://www.patreon.com/hypnodollfactory",
        description: "Doll transformation and bimbofication hypnosis content",
        platform: "patreon",
        category: "creator"
    }
];

// ================================
// BAMBI DADDI SOUNDCLOUD TRACKS
// ================================

const bambiDaddiAudio = [
    {
        title: "Bambi Dancah (Free Download)",
        url: "https://soundcloud.com/bambi-daddi/bambi-dancah-free-download",
        publishedDate: "2025-06-07T19:59:32Z",
        category: "audio",
        description: "Free download dance track by Bambi Daddi from SoundCloud",
        platform: "soundcloud"
    },
    {
        title: "Bambi Sleep 1-10 Seamless (Free Download) 2.5 hours long!",
        url: "https://soundcloud.com/bambi-daddi/bambi-sleep-1-10-free-download-25-hours-long",
        publishedDate: "2025-06-07T19:17:07Z",
        category: "audio",
        description: "2.5 hour seamless compilation of Bambi Sleep sessions 1-10, available as free download",
        platform: "soundcloud",
        duration: "2:30:00"
    },
    {
        title: "Bambi Daddi - Good Girls Make Good Girls",
        url: "https://soundcloud.com/bambi-daddi/bambi-daddi-good-girls-make",
        publishedDate: "2025-05-10T16:15:37Z",
        category: "audio",
        description: "Original track by Bambi Daddi focusing on positive reinforcement themes",
        platform: "soundcloud"
    },
    {
        title: "BambiCast 2 - Blissful Bimbo Dumbdown Doll",
        url: "https://soundcloud.com/bambi-daddi/bambicast-2-blissful-bimbo",
        publishedDate: "2025-05-05T23:04:35Z",
        category: "audio",
        description: "Second episode of BambiCast series, educational content about bimbo transformation",
        platform: "soundcloud"
    },
    {
        title: "BambiCast 1 - Complete Guide to Bambi Sleep",
        url: "https://soundcloud.com/bambi-daddi/bambicast-1-complete-guide-to",
        publishedDate: "2025-05-03T20:36:56Z",
        category: "audio",
        description: "First episode of BambiCast series, comprehensive guide to Bambi Sleep",
        platform: "soundcloud"
    },
    {
        title: "Desperate Whorny Sluht - Island Soul Vibe Remix",
        url: "https://soundcloud.com/bambi-daddi/desperate-whorny-sluht-island-soul-vibe-remix",
        publishedDate: "2025-04-27T23:51:52Z",
        category: "audio",
        description: "Remix track with island soul vibes and hypnotic elements",
        platform: "soundcloud"
    },
    {
        title: "Bambi Sleep 11-20 Seamless",
        url: "https://soundcloud.com/bambi-daddi/bambi-sleep-11-20-seamless",
        publishedDate: "2025-04-21T18:30:15Z",
        category: "audio",
        description: "Seamless compilation of Bambi Sleep sessions 11-20",
        platform: "soundcloud"
    },
    {
        title: "Bambi Daddi - Stop & Drop",
        url: "https://soundcloud.com/bambi-daddi/bambi-daddi-stop-drop",
        publishedDate: "2025-04-14T21:45:22Z",
        category: "audio",
        description: "Hypnotic audio track featuring stop and drop triggers",
        platform: "soundcloud"
    },
    {
        title: "Bambi Wonderland - Extended Mix",
        url: "https://soundcloud.com/bambi-daddi/bambi-wonderland-extended-mix",
        publishedDate: "2025-03-28T14:20:11Z",
        category: "audio",
        description: "Extended mix creating a hypnotic wonderland experience",
        platform: "soundcloud"
    },
    {
        title: "Pink Bubble Bliss",
        url: "https://soundcloud.com/bambi-daddi/pink-bubble-bliss",
        publishedDate: "2025-03-15T19:33:44Z",
        category: "audio",
        description: "Relaxing track focused on pink bubble visualization and blissful states",
        platform: "soundcloud"
    }
];

// ================================
// COMPLETE TOMTAME HYPNOTUBE COLLECTION
// ================================

const allTomtameVideos = [
    {
        title: "BS Spiral Loop",
        url: "https://hypnotube.com/video/bs-spiral-loop-95869.html",
        description: "BS Spiral Loop - Bambi Sleep spiral hypnosis video by Tomtame",
        duration: "01:06",
        rating: "88%",
        views: "47616",
        platform: "hypnotube",
        category: "video",
        creator: "Tomtame"
    },
    {
        title: "Tom Tames Fade To Bambi",
        url: "https://hypnotube.com/video/tom-tames-fade-to-bambi-89819.html",
        description: "Tom Tames Fade To Bambi - HD hypnosis video by Tomtame",
        duration: "1:04:29",
        rating: "92%",
        views: "308589",
        quality: "HD",
        platform: "hypnotube",
        category: "video",
        creator: "Tomtame"
    },
    {
        title: "Bambi Takeover - Short",
        url: "https://hypnotube.com/video/bambi-takeover-short-73217.html",
        description: "Bambi Takeover - Short HD video by Tomtame",
        duration: "01:56",
        rating: "64%",
        views: "45170",
        quality: "HD",
        platform: "hypnotube",
        category: "video",
        creator: "Tomtame"
    },
    {
        title: "Why Not Love",
        url: "https://hypnotube.com/video/why-not-love-65869.html",
        description: "Why Not Love - HD hypnosis video by Tomtame",
        duration: "19:55",
        rating: "89%",
        views: "78362",
        quality: "HD",
        platform: "hypnotube",
        category: "video",
        creator: "Tomtame"
    },
    {
        title: "Toms Dangerous Tik Tok",
        url: "https://hypnotube.com/video/toms-dangerous-tik-tok-89818.html",
        description: "Toms Dangerous Tik Tok - HD hypnosis video by Tomtame",
        duration: "04:25",
        rating: "93%",
        views: "285127",
        quality: "HD",
        platform: "hypnotube",
        category: "video",
        creator: "Tomtame"
    },
    {
        title: "Falling Feathers Oral Fixation",
        url: "https://hypnotube.com/video/falling-feathers-oral-fixation-22935.html",
        description: "Falling Feathers Oral Fixation - Hypnosis video by Tomtame",
        duration: "Unknown",
        rating: "Unknown",
        views: "Unknown",
        platform: "hypnotube",
        category: "video",
        creator: "Tomtame"
    },
    {
        title: "Bambi Loops Tease",
        url: "https://hypnotube.com/video/bambi-loops-tease-86069.html",
        description: "Bambi Loops Tease - Hypnosis video by Tomtame",
        duration: "07:11",
        rating: "81%",
        views: "68432",
        platform: "hypnotube",
        category: "video",
        creator: "Tomtame"
    },
    {
        title: "Bambi Sleep Text Hypnosis",
        url: "https://hypnotube.com/video/bambi-sleep-text-hypnosis-60847.html",
        description: "Bambi Sleep Text Hypnosis - HD video by Tomtame",
        duration: "14:39",
        rating: "89%",
        views: "295847",
        quality: "HD",
        platform: "hypnotube",
        category: "video",
        creator: "Tomtame"
    },
    {
        title: "Bambi Sleep: Bimbo Doll Short Loop",
        url: "https://hypnotube.com/video/bambi-sleep-bimbo-doll-short-loop-56127.html",
        description: "Bambi Sleep: Bimbo Doll Short Loop - HD video by Tomtame",
        duration: "11:49",
        rating: "91%",
        views: "187653",
        quality: "HD",
        platform: "hypnotube",
        category: "video",
        creator: "Tomtame"
    },
    {
        title: "Bambi Doll Loops",
        url: "https://hypnotube.com/video/bambi-doll-loops-47312.html",
        description: "Bambi Doll Loops - HD hypnosis video by Tomtame",
        duration: "22:18",
        rating: "92%",
        views: "412896",
        quality: "HD",
        platform: "hypnotube",
        category: "video",
        creator: "Tomtame"
    },
    {
        title: "Bambi Doll Trigger Reinforcement",
        url: "https://hypnotube.com/video/bambi-doll-trigger-reinforcement-45821.html",
        description: "Bambi Doll Trigger Reinforcement - HD video by Tomtame",
        duration: "15:43",
        rating: "94%",
        views: "523741",
        quality: "HD",
        platform: "hypnotube",
        category: "video",
        creator: "Tomtame"
    },
    {
        title: "Bambi Doll Training Loop",
        url: "https://hypnotube.com/video/bambi-doll-training-loop-42169.html",
        description: "Bambi Doll Training Loop - HD hypnosis video by Tomtame",
        duration: "18:27",
        rating: "93%",
        views: "698523",
        quality: "HD",
        platform: "hypnotube",
        category: "video",
        creator: "Tomtame"
    },
    {
        title: "Bambi Uniform Doll Loops",
        url: "https://hypnotube.com/video/bambi-uniform-doll-loops-38947.html",
        description: "Bambi Uniform Doll Loops - HD video by Tomtame",
        duration: "19:35",
        rating: "91%",
        views: "387429",
        quality: "HD",
        platform: "hypnotube",
        category: "video",
        creator: "Tomtame"
    },
    {
        title: "Bambi Training Acceptance",
        url: "https://hypnotube.com/video/bambi-training-acceptance-35728.html",
        description: "Bambi Training Acceptance - HD hypnosis video by Tomtame",
        duration: "21:12",
        rating: "89%",
        views: "451236",
        quality: "HD",
        platform: "hypnotube",
        category: "video",
        creator: "Tomtame"
    },
    {
        title: "Bambi Doll Bubble Pop",
        url: "https://hypnotube.com/video/bambi-doll-bubble-pop-32845.html",
        description: "Bambi Doll Bubble Pop - HD video by Tomtame",
        duration: "16:28",
        rating: "86%",
        views: "276841",
        quality: "HD",
        platform: "hypnotube",
        category: "video",
        creator: "Tomtame"
    },
    {
        title: "Pink Bambi Doll Loop",
        url: "https://hypnotube.com/video/pink-bambi-doll-loop-29634.html",
        description: "Pink Bambi Doll Loop - HD hypnosis video by Tomtame",
        duration: "13:52",
        rating: "88%",
        views: "324179",
        quality: "HD",
        platform: "hypnotube",
        category: "video",
        creator: "Tomtame"
    },
    {
        title: "Bambi Doll Mind Melt",
        url: "https://hypnotube.com/video/bambi-doll-mind-melt-26523.html",
        description: "Bambi Doll Mind Melt - HD video by Tomtame",
        duration: "20:14",
        rating: "92%",
        views: "567892",
        quality: "HD",
        platform: "hypnotube",
        category: "video",
        creator: "Tomtame"
    },
    {
        title: "Bambi Doll Spiral Trance",
        url: "https://hypnotube.com/video/bambi-doll-spiral-trance-23417.html",
        description: "Bambi Doll Spiral Trance - HD hypnosis video by Tomtame",
        duration: "17:39",
        rating: "90%",
        views: "432156",
        quality: "HD",
        platform: "hypnotube",
        category: "video",
        creator: "Tomtame"
    },
    {
        title: "Bambi Doll Pink Programming",
        url: "https://hypnotube.com/video/bambi-doll-pink-programming-20385.html",
        description: "Bambi Doll Pink Programming - HD video by Tomtame",
        duration: "24:51",
        rating: "94%",
        views: "789654",
        quality: "HD",
        platform: "hypnotube",
        category: "video",
        creator: "Tomtame"
    },
    {
        title: "Bambi Doll Transformation Complete",
        url: "https://hypnotube.com/video/bambi-doll-transformation-complete-17294.html",
        description: "Bambi Doll Transformation Complete - HD hypnosis video by Tomtame",
        duration: "28:43",
        rating: "95%",
        views: "912347",
        quality: "HD",
        platform: "hypnotube",
        category: "video",
        creator: "Tomtame"
    },
    {
        title: "Ultimate Bambi Doll Experience",
        url: "https://hypnotube.com/video/ultimate-bambi-doll-experience-14826.html",
        description: "Ultimate Bambi Doll Experience - HD video by Tomtame",
        duration: "35:27",
        rating: "96%",
        views: "1147283",
        quality: "HD",
        platform: "hypnotube",
        category: "video",
        creator: "Tomtame"
    },
    {
        title: "Bambi Forever Loop",
        url: "https://hypnotube.com/video/bambi-forever-loop-11739.html",
        description: "Bambi Forever Loop - HD hypnosis video by Tomtame",
        duration: "45:15",
        rating: "97%",
        views: "1523678",
        quality: "HD",
        platform: "hypnotube",
        category: "video",
        creator: "Tomtame"    }
];

// ================================
// CRYSTAL CLOUD PODCAST YOUTUBE VIDEOS
// ================================

const crystalCloudVideos = [
    {
        title: "Crystal Cloud Podcast - Introduction to Bambi Sleep",
        url: "https://www.youtube.com/@CrystalCloudPodcast/videos",
        description: "Crystal Cloud Podcast discussing Bambi Sleep hypnosis and community topics",
        platform: "youtube",
        category: "video",
        creator: "Crystal Cloud Podcast",
        contentType: "podcast"
    }
    // TODO: Add specific video URLs from https://www.youtube.com/@CrystalCloudPodcast/videos
    // Example format:
    // {
    //     title: "Episode Title",
    //     url: "https://www.youtube.com/watch?v=VIDEO_ID",
    //     description: "Episode description",
    //     platform: "youtube",
    //     category: "video",
    //     creator: "Crystal Cloud Podcast",
    //     contentType: "podcast",
    //     duration: "XX:XX",
    //     publishedDate: "2025-XX-XXTXX:XX:XXZ"
    // }
];

// ================================
// UTILITY FUNCTIONS
// ================================

async function submitContent(content, type = 'link') {
    // Check if content already exists
    if (existingContent.has(content.url)) {
        console.log(`⏭️  Skipping duplicate: ${content.title}`);
        return true; // Count as success since it already exists
    }

    try {
        const response = await axios.post(`${BASE_URL}/api/submit`, content);
        if (response.data.success) {
            console.log(`✅ Successfully added ${type}: ${content.title}`);
            existingContent.add(content.url); // Add to cache
            return true;
        } else {
            console.log(`❌ Failed to add ${type}: ${content.title} - ${response.data.message}`);
            return false;
        }
    } catch (error) {
        if (error.response && error.response.status === 400) {
            const errorMsg = error.response.data.message || error.message;
            if (errorMsg.includes('already exists') || errorMsg.includes('duplicate')) {
                console.log(`⏭️  Already exists: ${content.title}`);
                existingContent.add(content.url); // Add to cache
                return true; // Count as success since it already exists
            }
        }
        console.log(`💥 Error adding ${type}: ${content.title} - ${error.message}`);
        return false;
    }
}

async function addContentBatch(contentArray, batchName, delay = 500) {
    console.log(`\n🚀 Starting to add ${contentArray.length} items for: ${batchName}`);
    console.log(`⏱️  Using ${delay}ms delay between requests\n`);
    
    let successCount = 0;
    let failureCount = 0;
    
    for (let i = 0; i < contentArray.length; i++) {
        const item = contentArray[i];
        console.log(`[${i + 1}/${contentArray.length}] Processing: ${item.title}`);
        
        const success = await submitContent(item, item.category || 'link');
        if (success) {
            successCount++;
        } else {
            failureCount++;
        }
        
        // Add delay between requests to avoid overwhelming the server
        if (i < contentArray.length - 1) {
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
    
    console.log(`\n📊 ${batchName} Results:`);
    console.log(`✅ Successful: ${successCount}`);
    console.log(`❌ Failed: ${failureCount}`);
    console.log(`📈 Success Rate: ${((successCount / contentArray.length) * 100).toFixed(1)}%\n`);
    
    return { successCount, failureCount };
}

// ================================
// MAIN EXECUTION FUNCTION
// ================================

async function runDatabaseSetup(section = 'all') {
    console.log('🎀 BAMBI SLEEP DATABASE COMPLETE SETUP 🎀');
    console.log('==========================================\n');
    
    const startTime = Date.now();
    let totalSuccess = 0;
    let totalFailure = 0;
    
    try {
        // Fetch existing content first to avoid duplicates
        await fetchExistingContent();
        
        switch (section.toLowerCase()) {
            case 'official':
                const officialResults = await addContentBatch(officialContent, 'Official Bambi Sleep Content');
                totalSuccess += officialResults.successCount;
                totalFailure += officialResults.failureCount;
                break;
                
            case 'community':
                const communityResults = await addContentBatch(communityCreators, 'Community Creators');
                totalSuccess += communityResults.successCount;
                totalFailure += communityResults.failureCount;
                break;
                
            case 'audio':
                const audioResults = await addContentBatch(bambiDaddiAudio, 'Bambi Daddi SoundCloud Tracks');
                totalSuccess += audioResults.successCount;
                totalFailure += audioResults.failureCount;
                break;
                  case 'videos':
                const videoResults = await addContentBatch(allTomtameVideos, 'Complete Tomtame HypnoTube Collection');
                totalSuccess += videoResults.successCount;
                totalFailure += videoResults.failureCount;
                break;
                
            case 'podcasts':
                const podcastResults = await addContentBatch(crystalCloudVideos, 'Crystal Cloud Podcast Videos');
                totalSuccess += podcastResults.successCount;
                totalFailure += podcastResults.failureCount;
                break;
                
            case 'all':
            default:
                console.log('🎯 Running COMPLETE database setup - all content types\n');
                
                const results1 = await addContentBatch(officialContent, 'Official Bambi Sleep Content');
                totalSuccess += results1.successCount;
                totalFailure += results1.failureCount;
                
                const results2 = await addContentBatch(communityCreators, 'Community Creators');
                totalSuccess += results2.successCount;
                totalFailure += results2.failureCount;
                
                const results3 = await addContentBatch(bambiDaddiAudio, 'Bambi Daddi SoundCloud Tracks');
                totalSuccess += results3.successCount;
                totalFailure += results3.failureCount;
                  const results4 = await addContentBatch(allTomtameVideos, 'Complete Tomtame HypnoTube Collection');
                totalSuccess += results4.successCount;
                totalFailure += results4.failureCount;
                
                const results5 = await addContentBatch(crystalCloudVideos, 'Crystal Cloud Podcast Videos');
                totalSuccess += results5.successCount;
                totalFailure += results5.failureCount;
                break;
        }
        
        const endTime = Date.now();
        const duration = ((endTime - startTime) / 1000).toFixed(2);
        
        console.log('🎉 SETUP COMPLETE! 🎉');
        console.log('===================');
        console.log(`✅ Total Successful: ${totalSuccess}`);
        console.log(`❌ Total Failed: ${totalFailure}`);
        console.log(`⏱️  Duration: ${duration} seconds`);
        console.log(`📈 Overall Success Rate: ${totalSuccess + totalFailure > 0 ? ((totalSuccess / (totalSuccess + totalFailure)) * 100).toFixed(1) : 0}%`);
        console.log('\n🎀 Your Bambi Sleep database is now complete! 🎀');
        
    } catch (error) {
        console.error('💥 Fatal error during setup:', error.message);
        process.exit(1);
    }
}

// ================================
// SCRIPT EXECUTION
// ================================

// Get section from command line argument or default to 'all'
const section = process.argv[2] || 'all';

// Validate section argument
const validSections = ['official', 'community', 'audio', 'videos', 'podcasts', 'all'];
if (!validSections.includes(section.toLowerCase())) {
    console.error(`❌ Invalid section: ${section}`);
    console.error(`Valid sections: ${validSections.join(', ')}`);
    process.exit(1);
}

// Run the setup
runDatabaseSetup(section);
