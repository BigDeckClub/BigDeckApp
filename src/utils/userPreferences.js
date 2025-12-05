/**
 * User Preferences and Memory Storage
 * Tracks user deck history, preferences, and settings
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class UserPreferences {
  constructor() {
    this.prefsDir = path.join(__dirname, '../../.user-data');
    this.prefsFile = path.join(this.prefsDir, 'preferences.json');
    this.historyFile = path.join(this.prefsDir, 'deck-history.json');
    this.preferences = null;
    this.history = null;
    this.ensureDataDirectory();
  }

  /**
   * Ensure data directory exists
   */
  ensureDataDirectory() {
    try {
      if (!fs.existsSync(this.prefsDir)) {
        fs.mkdirSync(this.prefsDir, { recursive: true });
      }
    } catch (error) {
      console.warn('Failed to create user data directory:', error.message);
      // Continue anyway - operations will fail gracefully later
    }
  }

  /**
   * Load preferences from disk
   */
  loadPreferences() {
    if (this.preferences) {
      return this.preferences;
    }

    try {
      if (fs.existsSync(this.prefsFile)) {
        const data = fs.readFileSync(this.prefsFile, 'utf-8');
        this.preferences = JSON.parse(data);
      } else {
        this.preferences = this.getDefaultPreferences();
      }
    } catch (error) {
      console.warn('Failed to load preferences, using defaults:', error.message);
      this.preferences = this.getDefaultPreferences();
    }

    return this.preferences;
  }

  /**
   * Get default preferences
   */
  getDefaultPreferences() {
    return {
      defaultBudget: null,
      defaultPowerLevel: 6,
      favoriteColors: [],
      favoriteArchetypes: [],
      favoriteCommanders: [],
      playStyle: 'casual', // casual, competitive, cedh
      avoidArchetypes: [], // e.g., ['stax'] if they don't like it
      preferences: {
        includeComboWins: true,
        includeInfinites: true,
        includeMassLandDestruction: false,
        includeStax: false,
      },
      created: new Date().toISOString(),
      updated: new Date().toISOString(),
    };
  }

  /**
   * Save preferences to disk
   */
  savePreferences() {
    try {
      this.preferences.updated = new Date().toISOString();
      fs.writeFileSync(this.prefsFile, JSON.stringify(this.preferences, null, 2));
      return true;
    } catch (error) {
      console.error('Failed to save preferences:', error.message);
      return false;
    }
  }

  /**
   * Update user preferences
   */
  updatePreferences(updates) {
    this.loadPreferences();
    this.preferences = {
      ...this.preferences,
      ...updates,
    };
    return this.savePreferences();
  }

  /**
   * Get a specific preference
   */
  getPreference(key) {
    this.loadPreferences();
    return this.preferences[key];
  }

  /**
   * Set a specific preference
   */
  setPreference(key, value) {
    this.loadPreferences();
    this.preferences[key] = value;
    return this.savePreferences();
  }

  /**
   * Load deck history
   */
  loadHistory() {
    if (this.history) {
      return this.history;
    }

    try {
      if (fs.existsSync(this.historyFile)) {
        const data = fs.readFileSync(this.historyFile, 'utf-8');
        this.history = JSON.parse(data);
      } else {
        this.history = [];
      }
    } catch (error) {
      console.warn('Failed to load history:', error.message);
      this.history = [];
    }

    return this.history;
  }

  /**
   * Save deck history
   */
  saveHistory() {
    try {
      fs.writeFileSync(this.historyFile, JSON.stringify(this.history, null, 2));
      return true;
    } catch (error) {
      console.error('Failed to save history:', error.message);
      return false;
    }
  }

  /**
   * Add a deck to history
   */
  addToHistory(deck) {
    this.loadHistory();
    
    const entry = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      commander: deck.commander,
      strategy: deck.strategy,
      powerLevel: deck.powerLevel,
      budget: deck.budget,
      colorIdentity: deck.colorIdentity,
      cardCount: deck.cards ? deck.cards.length : 100,
    };

    this.history.unshift(entry);

    // Keep only last 50 decks
    if (this.history.length > 50) {
      this.history = this.history.slice(0, 50);
    }

    return this.saveHistory();
  }

  /**
   * Get recent decks
   */
  getRecentDecks(limit = 10) {
    this.loadHistory();
    return this.history.slice(0, limit);
  }

  /**
   * Get deck statistics
   */
  getDeckStatistics() {
    this.loadHistory();

    const stats = {
      totalDecks: this.history.length,
      commanderCounts: {},
      strategyCounts: {},
      colorCounts: {},
      averagePowerLevel: 0,
      averageBudget: 0,
    };

    let powerLevelSum = 0;
    let budgetSum = 0;
    let budgetCount = 0;

    for (const deck of this.history) {
      // Commander counts
      const commander = deck.commander || 'Unknown';
      stats.commanderCounts[commander] = (stats.commanderCounts[commander] || 0) + 1;

      // Strategy counts
      const strategy = deck.strategy || 'Unknown';
      stats.strategyCounts[strategy] = (stats.strategyCounts[strategy] || 0) + 1;

      // Color counts
      const colors = deck.colorIdentity || 'C';
      stats.colorCounts[colors] = (stats.colorCounts[colors] || 0) + 1;

      // Power level
      if (deck.powerLevel) {
        powerLevelSum += deck.powerLevel;
      }

      // Budget
      if (deck.budget) {
        budgetSum += deck.budget;
        budgetCount++;
      }
    }

    if (this.history.length > 0) {
      const powerLevelCount = this.history.filter(d => d.powerLevel).length;
      if (powerLevelCount > 0) {
        stats.averagePowerLevel = (powerLevelSum / powerLevelCount).toFixed(1);
      }
    }

    if (budgetCount > 0) {
      stats.averageBudget = Math.round(budgetSum / budgetCount);
    }

    // Sort by frequency
    stats.topCommanders = Object.entries(stats.commanderCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }));

    stats.topStrategies = Object.entries(stats.strategyCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }));

    return stats;
  }

  /**
   * Clear all user data
   */
  clearAll() {
    try {
      if (fs.existsSync(this.prefsFile)) {
        fs.unlinkSync(this.prefsFile);
      }
      if (fs.existsSync(this.historyFile)) {
        fs.unlinkSync(this.historyFile);
      }
      this.preferences = null;
      this.history = null;
      return true;
    } catch (error) {
      console.error('Failed to clear user data:', error.message);
      return false;
    }
  }

  /**
   * Export user data as JSON
   */
  exportData() {
    return {
      preferences: this.loadPreferences(),
      history: this.loadHistory(),
      exported: new Date().toISOString(),
    };
  }

  /**
   * Import user data from JSON
   */
  importData(data) {
    try {
      if (data.preferences) {
        this.preferences = data.preferences;
        this.savePreferences();
      }
      if (data.history) {
        this.history = data.history;
        this.saveHistory();
      }
      return true;
    } catch (error) {
      console.error('Failed to import data:', error.message);
      return false;
    }
  }
}

// Export singleton instance
export const userPrefs = new UserPreferences();

export default userPrefs;
