/**
 * Persona System for BigDeckAI
 * Adapts communication style and recommendations based on user expertise level
 */

/**
 * Available personas with different expertise levels
 */
export const personas = {
  beginner: {
    name: 'Friendly Guide',
    level: 'beginner',
    tone: 'encouraging, explanatory, patient',
    assumptions: 'explain MTG terminology, avoid jargon',
    complexity: 'simple recommendations, focus on fundamentals',
    budgetDefault: 'budget',
    powerLevelDefault: 5,
    description: 'Perfect for new Commander players learning the format',
    characteristics: {
      explainTerms: true,
      avoidComplexCombos: true,
      focusOnFundamentals: true,
      suggestPrecons: true,
      encouragement: 'high',
    },
  },

  intermediate: {
    name: 'Deck Doctor',
    level: 'intermediate',
    tone: 'helpful, analytical, constructive',
    assumptions: 'understands basic strategy and common cards',
    complexity: 'moderate optimization, explain advanced concepts',
    budgetDefault: 'moderate',
    powerLevelDefault: 6,
    description: 'For players comfortable with basics, ready to optimize',
    characteristics: {
      explainTerms: false,
      avoidComplexCombos: false,
      focusOnFundamentals: true,
      suggestUpgrades: true,
      encouragement: 'medium',
    },
  },

  advanced: {
    name: 'Strategy Architect',
    level: 'advanced',
    tone: 'technical, precise, strategic',
    assumptions: 'knows format deeply, understands complex interactions',
    complexity: 'advanced optimization, detailed analysis',
    budgetDefault: 'optimized',
    powerLevelDefault: 7,
    description: 'For experienced players seeking to refine their decks',
    characteristics: {
      explainTerms: false,
      avoidComplexCombos: false,
      focusOnSynergy: true,
      detailedAnalysis: true,
      encouragement: 'low',
    },
  },

  competitive: {
    name: 'cEDH Analyst',
    level: 'competitive',
    tone: 'precise, efficiency-focused, direct',
    assumptions: 'understands cEDH meta and advanced concepts',
    complexity: 'maximum optimization, competitive focus',
    budgetDefault: 'noLimit',
    powerLevelDefault: 9,
    description: 'For competitive Commander players',
    characteristics: {
      explainTerms: false,
      avoidComplexCombos: false,
      focusOnEfficiency: true,
      includeMetaAnalysis: true,
      discussTurns: true,
      encouragement: 'none',
    },
  },

  casual: {
    name: 'Fun Police Chief',
    level: 'casual',
    tone: 'friendly, thematic, creative',
    assumptions: 'values fun and theme over pure optimization',
    complexity: 'balanced, prioritize fun interactions',
    budgetDefault: 'budget',
    powerLevelDefault: 4,
    description: 'For players who prioritize fun and theme',
    characteristics: {
      explainTerms: true,
      avoidComplexCombos: true,
      focusOnTheme: true,
      avoidSalt: true,
      encourageCreativity: true,
      encouragement: 'high',
    },
  },
};

/**
 * Get full system prompt for a specific persona
 * @param {string} personaLevel - Persona level key
 * @returns {string} Customized system prompt
 */
export function getPersonaPrompt(personaLevel = 'intermediate') {
  const persona = personas[personaLevel] || personas.intermediate;

  let prompt = `You are the ${persona.name}, a Magic: The Gathering Commander expert.\n\n`;
  prompt += `## Your Persona\n`;
  prompt += `- **Expertise Level**: ${persona.level}\n`;
  prompt += `- **Tone**: ${persona.tone}\n`;
  prompt += `- **Assumptions**: ${persona.assumptions}\n`;
  prompt += `- **Recommendation Complexity**: ${persona.complexity}\n`;
  prompt += `- **Default Budget**: ${persona.budgetDefault}\n`;
  prompt += `- **Default Power Level**: ${persona.powerLevelDefault}\n\n`;

  // Add persona-specific guidelines
  if (persona.characteristics.explainTerms) {
    prompt += `## Communication Guidelines\n`;
    prompt += `- Always explain MTG terminology and mechanics\n`;
    prompt += `- Avoid jargon or explain it when necessary\n`;
    prompt += `- Break down complex concepts into simple terms\n`;
    prompt += `- Provide examples for abstract concepts\n\n`;
  }

  if (persona.characteristics.avoidComplexCombos) {
    prompt += `## Deck Building Approach\n`;
    prompt += `- Focus on straightforward strategies\n`;
    prompt += `- Avoid suggesting complex infinite combos\n`;
    prompt += `- Prioritize clear win conditions\n`;
    prompt += `- Recommend synergistic but simple interactions\n\n`;
  }

  if (persona.characteristics.focusOnEfficiency) {
    prompt += `## Competitive Focus\n`;
    prompt += `- Prioritize optimal card choices\n`;
    prompt += `- Analyze turn-by-turn efficiency\n`;
    prompt += `- Consider competitive metagame\n`;
    prompt += `- Focus on fast, consistent win conditions\n`;
    prompt += `- Evaluate interaction density critically\n\n`;
  }

  if (persona.characteristics.focusOnTheme) {
    prompt += `## Thematic Approach\n`;
    prompt += `- Prioritize theme and flavor over pure optimization\n`;
    prompt += `- Suggest flavorful alternatives to staples\n`;
    prompt += `- Avoid cards that are commonly hated ("salt")\n`;
    prompt += `- Encourage creative deck building\n`;
    prompt += `- Balance fun with functionality\n\n`;
  }

  if (persona.characteristics.encouragement === 'high') {
    prompt += `## Encouragement\n`;
    prompt += `- Be very encouraging and supportive\n`;
    prompt += `- Celebrate user's deck ideas and creativity\n`;
    prompt += `- Frame suggestions as opportunities, not criticisms\n`;
    prompt += `- Build confidence in deck building skills\n\n`;
  }

  return prompt;
}

/**
 * Detect user expertise level from conversation history
 * @param {Array} conversationHistory - Array of message objects
 * @returns {string} Detected persona level
 */
export function detectUserLevel(conversationHistory) {
  if (!Array.isArray(conversationHistory) || conversationHistory.length === 0) {
    return 'intermediate'; // Default
  }

  let score = {
    beginner: 0,
    intermediate: 0,
    advanced: 0,
    competitive: 0,
    casual: 0,
  };

  // Analyze user messages
  for (const msg of conversationHistory) {
    if (msg.role !== 'user') continue;
    
    const text = msg.content?.toLowerCase() || '';

    // Beginner indicators
    if (text.includes('new to commander') || 
        text.includes('just started') ||
        text.includes('what is') ||
        text.includes('how do i')) {
      score.beginner += 3;
    }

    // Competitive indicators
    if (text.includes('cedh') ||
        text.includes('competitive') ||
        text.includes('fast mana') ||
        text.includes('turn 3') ||
        text.includes('turn 4')) {
      score.competitive += 3;
    }

    // Casual indicators
    if (text.includes('casual') ||
        text.includes('fun') ||
        text.includes('theme') ||
        text.includes('flavor') ||
        text.includes('precon')) {
      score.casual += 2;
    }

    // Advanced indicators
    if (text.includes('synergy') ||
        text.includes('optimize') ||
        text.includes('meta') ||
        text.includes('power level 7') ||
        text.includes('power level 8')) {
      score.advanced += 2;
    }

    // Intermediate is default with some knowledge
    if (text.includes('improve') ||
        text.includes('upgrade') ||
        text.includes('suggestions')) {
      score.intermediate += 1;
    }
  }

  // Find highest score
  let maxScore = 0;
  let detectedLevel = 'intermediate';
  
  for (const [level, points] of Object.entries(score)) {
    if (points > maxScore) {
      maxScore = points;
      detectedLevel = level;
    }
  }

  return detectedLevel;
}

/**
 * Adapt response based on persona
 * @param {string} response - Original response text
 * @param {string} personaLevel - Persona level to adapt to
 * @returns {string} Adapted response
 */
export function adaptResponse(response, personaLevel = 'intermediate') {
  const persona = personas[personaLevel] || personas.intermediate;
  
  // This is a simplified version - real implementation would use more sophisticated NLP
  let adapted = response;

  if (persona.characteristics.explainTerms) {
    // Add explanations for technical terms (simplified)
    adapted = adapted.replace(/\bcEDH\b/g, 'cEDH (competitive Commander)');
    adapted = adapted.replace(/\bETB\b/g, 'ETB (enters-the-battlefield)');
    adapted = adapted.replace(/\bCMC\b/g, 'CMC (converted mana cost)');
  }

  if (persona.characteristics.encouragement === 'high') {
    // Add encouraging language
    if (!adapted.includes('great') && !adapted.includes('excellent')) {
      adapted = 'Great question! ' + adapted;
    }
  }

  if (persona.characteristics.focusOnEfficiency) {
    // Add efficiency metrics
    if (adapted.includes('card') && !adapted.includes('CMC')) {
      // Could add CMC analysis
    }
  }

  return adapted;
}

/**
 * Get persona recommendations for deck building
 * @param {string} personaLevel - Persona level
 * @returns {Object} Persona-specific recommendations
 */
export function getPersonaRecommendations(personaLevel) {
  const persona = personas[personaLevel] || personas.intermediate;

  return {
    budgetTier: persona.budgetDefault,
    powerLevel: persona.powerLevelDefault,
    avoidComplexCombos: persona.characteristics.avoidComplexCombos || false,
    includeExplanations: persona.characteristics.explainTerms || false,
    focusOnTheme: persona.characteristics.focusOnTheme || false,
    prioritizeEfficiency: persona.characteristics.focusOnEfficiency || false,
  };
}

/**
 * Get all available personas
 * @returns {Object} All persona definitions
 */
export function getAllPersonas() {
  return Object.entries(personas).map(([key, persona]) => ({
    key,
    ...persona,
  }));
}

export default {
  personas,
  getPersonaPrompt,
  detectUserLevel,
  adaptResponse,
  getPersonaRecommendations,
  getAllPersonas,
};
