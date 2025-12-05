/**
 * EDHREC Synergy Tool
 * Get commander synergies and recommendations from EDHREC
 */

import { edhrec } from '../../integrations/edhrec.js';
import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';

/**
 * Create EDHREC synergy lookup tool for LangChain agent
 */
export function createEDHRECSynergyTool() {
  return new DynamicStructuredTool({
    name: 'get_edhrec_synergies',
    description: 'Get commander synergies and top cards from EDHREC. Returns highly synergistic cards for a specific commander, organized by category (creatures, instants, sorceries, artifacts, enchantments, etc.). Includes synergy scores and inclusion rates. Use this to find cards that work well with a specific commander.',
    schema: z.object({
      commanderName: z.string().describe('Name of the commander to get synergies for'),
      limit: z.number().optional().describe('Maximum number of top cards to return (default: 50)'),
    }),
    func: async ({ commanderName, limit = 50 }) => {
      try {
        // Get synergies organized by category
        const synergies = await edhrec.getCommanderSynergies(commanderName);
        
        // Get top cards overall
        const topCards = await edhrec.getTopCards(commanderName, limit);
        
        // Get themes
        const themes = await edhrec.getCommanderThemes(commanderName);

        if (!synergies || Object.keys(synergies).length === 0) {
          return JSON.stringify({
            success: false,
            message: `No EDHREC data found for "${commanderName}". The commander may be very new or the name may be incorrect.`,
          });
        }

        // Organize response
        const response = {
          success: true,
          commander: commanderName,
          topCards: topCards.slice(0, 20).map(card => ({
            name: card.name,
            synergy: card.synergy,
            inclusion: Math.round(card.inclusion * 100) + '%',
            section: card.section,
          })),
          themes: themes.map(t => t.name),
          categoryBreakdown: {},
        };

        // Add category breakdown (top 5 per category)
        for (const [category, cards] of Object.entries(synergies)) {
          if (cards && cards.length > 0) {
            response.categoryBreakdown[category] = cards.slice(0, 5).map(card => ({
              name: card.name,
              synergy: card.synergy,
              inclusion: Math.round(card.inclusion * 100) + '%',
            }));
          }
        }

        return JSON.stringify(response, null, 2);
      } catch (error) {
        return JSON.stringify({
          success: false,
          error: error.message,
          message: `Failed to fetch EDHREC data for "${commanderName}". This may be due to API issues or incorrect commander name.`,
        });
      }
    },
  });
}

export default createEDHRECSynergyTool;
