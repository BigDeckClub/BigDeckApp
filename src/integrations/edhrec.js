/**
 * EDHREC API Integration
 * For commander synergy data and recommendations
 * Documentation: https://edhrec.com/api/docs
 */

import { config } from './config.js';

class EDHRECAPI {
  constructor() {
    this.baseUrl = 'https://json.edhrec.com/pages';
    this.commandersUrl = 'https://json.edhrec.com/commanders';
    this.rateLimit = 1000; // 1 second between requests to be respectful
    this.lastRequestTime = 0;
    this.cache = new Map();
    this.cacheTimeout = 1000 * 60 * 60; // 1 hour cache
  }

  /**
   * Rate limiting: Wait if needed before making request
   */
  async waitForRateLimit() {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    
    if (timeSinceLastRequest < this.rateLimit) {
      await new Promise(resolve => 
        setTimeout(resolve, this.rateLimit - timeSinceLastRequest)
      );
    }
    
    this.lastRequestTime = Date.now();
  }

  /**
   * Get from cache if available and not expired
   */
  getFromCache(key) {
    const cached = this.cache.get(key);
    if (cached && (Date.now() - cached.timestamp) < this.cacheTimeout) {
      return cached.data;
    }
    return null;
  }

  /**
   * Store in cache
   */
  setCache(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  /**
   * Make a request to EDHREC API
   * @param {string} url - Full URL to fetch
   * @returns {Promise<Object>} API response
   */
  async request(url) {
    // Check cache first
    const cached = this.getFromCache(url);
    if (cached) {
      return cached;
    }

    await this.waitForRateLimit();

    try {
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`EDHREC API error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      this.setCache(url, data);
      return data;
    } catch (error) {
      console.error('EDHREC API request failed:', error.message);
      throw error;
    }
  }

  /**
   * Normalize commander name to URL-safe format
   * @param {string} name - Commander name
   * @returns {string} URL-safe name
   */
  normalizeCommanderName(name) {
    return name
      .toLowerCase()
      .replace(/[,'']/g, '')
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '');
  }

  /**
   * Get commander page data with synergies and recommendations
   * @param {string} commanderName - Commander name
   * @returns {Promise<Object>} Commander data with synergies
   */
  async getCommanderData(commanderName) {
    const normalized = this.normalizeCommanderName(commanderName);
    const url = `${this.commandersUrl}/${normalized}.json`;
    
    try {
      return await this.request(url);
    } catch (error) {
      console.warn(`Could not fetch EDHREC data for ${commanderName}:`, error.message);
      return null;
    }
  }

  /**
   * Get top cards for a commander
   * @param {string} commanderName - Commander name
   * @param {number} limit - Max number of cards to return
   * @returns {Promise<Array>} Top cards with synergy scores
   */
  async getTopCards(commanderName, limit = 50) {
    const data = await this.getCommanderData(commanderName);
    
    if (!data || !data.container || !data.container.json_dict) {
      return [];
    }

    const cards = [];
    const cardLists = data.container.json_dict.cardlists || [];

    // Extract cards from all sections
    for (const section of cardLists) {
      if (section.cardviews) {
        for (const card of section.cardviews) {
          cards.push({
            name: card.name,
            url: card.url,
            salt: card.salt,
            label: card.label,
            synergy: card.synergy_score,
            inclusion: card.inclusion,
            section: section.header,
          });
        }
      }
    }

    // Sort by synergy score and limit
    return cards
      .sort((a, b) => (b.synergy || 0) - (a.synergy || 0))
      .slice(0, limit);
  }

  /**
   * Get commander synergies by category
   * @param {string} commanderName - Commander name
   * @returns {Promise<Object>} Synergies organized by category
   */
  async getCommanderSynergies(commanderName) {
    const data = await this.getCommanderData(commanderName);
    
    if (!data || !data.container || !data.container.json_dict) {
      return {};
    }

    const synergies = {};
    const cardLists = data.container.json_dict.cardlists || [];

    for (const section of cardLists) {
      if (section.cardviews && section.header) {
        synergies[section.header] = section.cardviews.map(card => ({
          name: card.name,
          synergy: card.synergy_score,
          inclusion: card.inclusion,
          salt: card.salt,
        }));
      }
    }

    return synergies;
  }

  /**
   * Get themes for a commander
   * @param {string} commanderName - Commander name
   * @returns {Promise<Array>} Popular themes/strategies
   */
  async getCommanderThemes(commanderName) {
    const data = await this.getCommanderData(commanderName);
    
    if (!data || !data.container || !data.container.json_dict) {
      return [];
    }

    const themes = data.container.json_dict.themes || [];
    return themes.map(theme => ({
      name: theme.name,
      url: theme.url,
    }));
  }

  /**
   * Search for commanders by filters
   * @param {Object} filters - Search filters (colors, tribe, theme)
   * @returns {Promise<Array>} Matching commanders
   */
  async searchCommanders(filters = {}) {
    // Note: This would require scraping or a different API endpoint
    // For now, return empty array as EDHREC doesn't have a direct search API
    console.warn('Commander search not fully implemented - EDHREC API limitation');
    return [];
  }

  /**
   * Get color identity data
   * @param {string} colorIdentity - Color identity (e.g., 'WUBRG', 'UB')
   * @returns {Promise<Object>} Color-specific recommendations
   */
  async getColorIdentityData(colorIdentity) {
    // Map color codes to EDHREC urls
    const colorMap = {
      'W': 'white',
      'U': 'blue',
      'B': 'black',
      'R': 'red',
      'G': 'green',
    };

    if (colorIdentity.length === 1) {
      const color = colorMap[colorIdentity];
      if (color) {
        const url = `${this.baseUrl}/${color}.json`;
        return await this.request(url);
      }
    }

    // For multi-color, we'd need different logic
    return null;
  }

  /**
   * Get average deck for a commander
   * @param {string} commanderName - Commander name
   * @returns {Promise<Array>} Average decklist
   */
  async getAverageDeck(commanderName) {
    const data = await this.getCommanderData(commanderName);
    
    if (!data || !data.container || !data.container.json_dict) {
      return [];
    }

    const cards = [];
    const cardLists = data.container.json_dict.cardlists || [];

    for (const section of cardLists) {
      if (section.cardviews) {
        for (const card of section.cardviews) {
          if (card.inclusion > 0.1) { // Include cards in >10% of decks
            cards.push({
              name: card.name,
              inclusion: card.inclusion,
              synergy: card.synergy_score,
              section: section.header,
            });
          }
        }
      }
    }

    return cards;
  }

  /**
   * Get tribal recommendations
   * @param {string} tribe - Creature type (e.g., 'dragons', 'elves')
   * @returns {Promise<Object>} Tribal recommendations
   */
  async getTribalData(tribe) {
    const normalized = tribe.toLowerCase().replace(/\s+/g, '-');
    const url = `${this.baseUrl}/tribes/${normalized}.json`;
    
    try {
      return await this.request(url);
    } catch (error) {
      console.warn(`Could not fetch tribal data for ${tribe}:`, error.message);
      return null;
    }
  }
}

// Export singleton instance
export const edhrec = new EDHRECAPI();

export default edhrec;
