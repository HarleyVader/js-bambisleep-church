// Add sample knowledge entries for demonstration
import KnowledgeStorage from './src/knowledge/storage.js';

const storage = new KnowledgeStorage();

async function addSampleKnowledge() {
  console.log('Adding sample knowledge entries...');
  
  const entries = [
    {
      content: 'Bambi Sleep is a series of guided meditation files designed to help with relaxation and personal transformation. The sessions use various techniques including visualization, breathing exercises, and positive affirmations.',
      metadata: {
        title: 'What is Bambi Sleep?',
        category: 'meditation'
      }
    },
    {
      content: 'Deep breathing is fundamental to effective meditation. Start with 4-7-8 breathing: inhale for 4 counts, hold for 7 counts, exhale for 8 counts. This activates the parasympathetic nervous system and promotes relaxation.',
      metadata: {
        title: 'Basic Breathing Techniques',
        category: 'techniques'
      }
    },
    {
      content: 'The Bambi Sleep community values respect, consent, and personal growth. All participants should feel safe to explore their journey at their own pace. Community guidelines emphasize kindness and mutual support.',
      metadata: {
        title: 'Community Guidelines',
        category: 'community'
      }
    },
    {
      content: 'Progressive muscle relaxation involves systematically tensing and relaxing different muscle groups. Start with your toes and work your way up to your head. This technique helps identify areas of tension and promotes overall relaxation.',
      metadata: {
        title: 'Progressive Muscle Relaxation',
        category: 'techniques'
      }
    },
    {
      content: 'For beginners, start with shorter sessions (10-15 minutes) and gradually increase duration. Create a comfortable, quiet environment free from distractions. Consistency is more important than session length.',
      metadata: {
        title: 'Getting Started Guide',
        category: 'general'
      }
    },
    {
      content: 'Recommended resources include meditation apps like Insight Timer, books on mindfulness by Jon Kabat-Zinn, and online communities for support and guidance. Always choose resources that align with your personal values and goals.',
      metadata: {
        title: 'Helpful Resources',
        category: 'resources'
      }
    }
  ];

  for (const entry of entries) {
    try {
      const result = await storage.addEntry(entry.content, entry.metadata);
      console.log(`✅ Added: ${entry.metadata.title} (ID: ${result.id})`);
    } catch (error) {
      console.error(`❌ Failed to add: ${entry.metadata.title}`, error);
    }
  }
  
  console.log('\n🎉 Sample knowledge entries added successfully!');
  console.log('Visit http://localhost:3000/knowledge to view the knowledge base');
}

addSampleKnowledge();
