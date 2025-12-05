/**
 * Meta Analysis Tool
 * Get meta data from MTGGoldfish and Untapped.gg
 */

import { mtggoldfish } from '../../integrations/mtggoldfish.js';
import { untapped } from '../../integrations/untapped.js';
import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';

/**
 * Create meta analysis tool for LangChain agent
 */
export function createMetaAnalysisTool() {
  return new DynamicStructuredTool({
    name: 'get_meta_analysis',
    description: 'Get Commander meta analysis including top commanders, win rates, popular archetypes, and power level distribution. Use this to understand the current competitive landscape, identify strong commanders, and make meta-aware deck building decisions.',
    schema: z.object({
      analysisType: z.enum(['commanders', 'archetypes', 'cards', 'colors', 'combos', 'all'])
        .describe('Type of meta analysis to perform'),
      commander: z.string().optional().describe('Specific commander to analyze (optional)'),
    }),
    func: async ({ analysisType, commander }) => {
      try {
        const results = {};

        // Get commander-specific data if provided
        if (commander) {
          const [winrate, edhrecData] = await Promise.all([
            untapped.getCommanderWinrate(commander),
            // Could also get EDHREC popularity here
          ]);
          
          results.commanderStats = {
            name: commander,
            winrate: Math.round(winrate.winrate * 100) + '%',
            playrate: Math.round(winrate.playrate * 100) + '%',
            powerLevel: winrate.powerLevel.toFixed(1),
            gamesTracked: winrate.gamesTracked,
          };
        }

        // Get requested analysis
        switch (analysisType) {
          case 'commanders':
          case 'all':
            const [commanderMeta, untappedMeta] = await Promise.all([
              mtggoldfish.getCommanderMeta(),
              untapped.getCommanderMeta(),
            ]);
            
            results.topCommanders = untappedMeta.topDecks.map(deck => ({
              commander: deck.commander,
              winrate: Math.round(deck.winrate * 100) + '%',
              playrate: Math.round(deck.playrate * 100) + '%',
              powerLevel: deck.powerLevel.toFixed(1),
            }));
            
            if (analysisType !== 'all') break;
            // Fall through for 'all'

          case 'archetypes':
            const archetypes = await mtggoldfish.getPopularArchetypes();
            results.popularArchetypes = archetypes.map(arch => ({
              name: arch.name,
              popularity: Math.round(arch.popularity * 100) + '%',
              description: arch.description,
            }));
            
            if (analysisType !== 'all') break;
            // Fall through for 'all'

          case 'cards':
            const metaCards = await untapped.getMetaCards();
            results.topMetaCards = metaCards.slice(0, 15).map(card => ({
              name: card.name,
              inclusion: Math.round(card.inclusion * 100) + '%',
              winrateBoost: '+' + Math.round(card.winrateContribution * 100) + '%',
            }));
            
            if (analysisType !== 'all') break;
            // Fall through for 'all'

          case 'colors':
            const [colorPop, colorWR] = await Promise.all([
              mtggoldfish.getColorPopularity(),
              untapped.getColorWinrates(),
            ]);
            
            results.colorStats = colorWR.map(stat => ({
              colors: stat.colors,
              winrate: Math.round(stat.winrate * 100) + '%',
              playrate: Math.round(stat.playrate * 100) + '%',
            }));
            
            if (analysisType !== 'all') break;
            // Fall through for 'all'

          case 'combos':
            const combos = await untapped.getPopularCombos();
            results.popularCombos = combos.map(combo => ({
              name: combo.name,
              winrate: Math.round(combo.winrate * 100) + '%',
              popularity: Math.round(combo.popularity * 100) + '%',
              colors: combo.colors.join(''),
            }));
            break;
        }

        // Add power level distribution for comprehensive analysis
        if (analysisType === 'all' || analysisType === 'commanders') {
          const powerDist = await untapped.getPowerLevelDistribution();
          results.powerLevelDistribution = powerDist.levels.map(level => ({
            level: level.level,
            percentage: Math.round(level.percentage * 100) + '%',
            description: level.description,
          }));
        }

        return JSON.stringify({
          success: true,
          analysisType,
          timestamp: new Date().toISOString(),
          ...results,
          note: 'Meta data combines information from MTGGoldfish and Untapped.gg. Stats are approximate and update regularly.',
        }, null, 2);
      } catch (error) {
        return JSON.stringify({
          success: false,
          error: error.message,
          message: 'Failed to fetch meta analysis data. API may be unavailable.',
        });
      }
    },
  });
}

export default createMetaAnalysisTool;
