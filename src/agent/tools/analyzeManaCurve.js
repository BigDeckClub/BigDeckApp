/**
 * Mana Curve Analysis Tool
 * Analyze and optimize mana curves for Commander decks
 */

import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';

/**
 * Analyze a list of cards and calculate mana curve statistics
 */
function analyzeManaCurve(cards) {
  const curve = {};
  let totalCMC = 0;
  let nonLandCount = 0;

  for (const card of cards) {
    // Skip lands - check for Land in type line
    if (card.type && (
      card.type.toLowerCase().includes('land') ||
      card.type.toLowerCase().startsWith('basic land')
    )) {
      continue;
    }

    const cmc = card.cmc || 0;
    curve[cmc] = (curve[cmc] || 0) + 1;
    totalCMC += cmc;
    nonLandCount++;
  }

  const avgCMC = nonLandCount > 0 ? totalCMC / nonLandCount : 0;

  return {
    curve,
    avgCMC,
    nonLandCount,
    totalCards: cards.length,
  };
}

/**
 * Calculate ideal curve for a strategy
 */
function getIdealCurve(strategy, targetAvgCMC) {
  const strategies = {
    aggro: {
      avgCMC: 2.8,
      distribution: { 1: 0.15, 2: 0.25, 3: 0.25, 4: 0.20, 5: 0.10, 6: 0.05 },
    },
    midrange: {
      avgCMC: 3.5,
      distribution: { 1: 0.10, 2: 0.20, 3: 0.25, 4: 0.20, 5: 0.15, 6: 0.10 },
    },
    control: {
      avgCMC: 4.0,
      distribution: { 1: 0.10, 2: 0.15, 3: 0.20, 4: 0.20, 5: 0.15, 6: 0.20 },
    },
    combo: {
      avgCMC: 3.0,
      distribution: { 1: 0.15, 2: 0.25, 3: 0.25, 4: 0.15, 5: 0.10, 6: 0.10 },
    },
  };

  return strategies[strategy.toLowerCase()] || strategies.midrange;
}

/**
 * Generate recommendations based on curve analysis
 */
function generateRecommendations(analysis, strategy) {
  const recommendations = [];
  const ideal = getIdealCurve(strategy, analysis.avgCMC);

  // Check average CMC
  if (Math.abs(analysis.avgCMC - ideal.avgCMC) > 0.5) {
    if (analysis.avgCMC > ideal.avgCMC) {
      recommendations.push({
        priority: 'high',
        issue: 'Curve too high',
        suggestion: `Average CMC is ${analysis.avgCMC.toFixed(2)}, but ${strategy} decks typically run ${ideal.avgCMC.toFixed(1)}. Consider adding more low-cost cards.`,
      });
    } else {
      recommendations.push({
        priority: 'medium',
        issue: 'Curve possibly too low',
        suggestion: `Average CMC is ${analysis.avgCMC.toFixed(2)}. Consider if you have enough impactful high-cost cards for the late game.`,
      });
    }
  }

  // Check curve distribution
  const totalNonLand = analysis.nonLandCount;
  for (let cmc = 1; cmc <= 6; cmc++) {
    const actualPercent = (analysis.curve[cmc] || 0) / totalNonLand;
    const idealPercent = ideal.distribution[cmc] || 0;
    
    if (Math.abs(actualPercent - idealPercent) > 0.10) {
      if (actualPercent < idealPercent - 0.10) {
        recommendations.push({
          priority: 'medium',
          issue: `Too few ${cmc}-drops`,
          suggestion: `You have ${analysis.curve[cmc] || 0} cards at CMC ${cmc} (${Math.round(actualPercent * 100)}%), but ${strategy} decks typically run ${Math.round(idealPercent * 100)}%.`,
        });
      } else if (actualPercent > idealPercent + 0.10) {
        recommendations.push({
          priority: 'low',
          issue: `Many ${cmc}-drops`,
          suggestion: `You have ${analysis.curve[cmc]} cards at CMC ${cmc} (${Math.round(actualPercent * 100)}%). Consider if this concentration is intentional for your strategy.`,
        });
      }
    }
  }

  // Check for gaps
  const maxCMC = Math.max(...Object.keys(analysis.curve).map(Number));
  for (let cmc = 1; cmc <= Math.min(maxCMC, 6); cmc++) {
    if (!analysis.curve[cmc] || analysis.curve[cmc] === 0) {
      recommendations.push({
        priority: 'low',
        issue: `No ${cmc}-drops`,
        suggestion: `Consider adding some ${cmc}-cost cards for curve consistency.`,
      });
    }
  }

  return recommendations;
}

/**
 * Create mana curve analysis tool for LangChain agent
 */
export function createManaCurveAnalysisTool() {
  return new DynamicStructuredTool({
    name: 'analyze_mana_curve',
    description: 'Analyze the mana curve of a deck or list of cards. Returns curve distribution, average CMC, and recommendations for optimization based on the deck strategy. Use this to ensure a deck has a smooth, efficient mana curve appropriate for its archetype.',
    schema: z.object({
      cards: z.array(z.object({
        name: z.string(),
        cmc: z.number(),
        type: z.string(),
      })).describe('Array of cards with name, cmc (converted mana cost), and type'),
      strategy: z.enum(['aggro', 'midrange', 'control', 'combo', 'tribal', 'other'])
        .describe('Deck strategy/archetype'),
    }),
    func: async ({ cards, strategy }) => {
      try {
        const analysis = analyzeManaCurve(cards);
        const ideal = getIdealCurve(strategy, analysis.avgCMC);
        const recommendations = generateRecommendations(analysis, strategy);

        // Format curve for display
        const curveDisplay = {};
        for (let cmc = 0; cmc <= 10; cmc++) {
          const count = analysis.curve[cmc] || 0;
          if (count > 0 || cmc <= 7) {
            curveDisplay[`${cmc} CMC`] = {
              count,
              percentage: Math.round((count / analysis.nonLandCount) * 100) + '%',
            };
          }
        }

        return JSON.stringify({
          success: true,
          strategy,
          curve: curveDisplay,
          statistics: {
            averageCMC: analysis.avgCMC.toFixed(2),
            idealAverageCMC: ideal.avgCMC.toFixed(1),
            nonLandCards: analysis.nonLandCount,
            totalCards: analysis.totalCards,
          },
          recommendations: recommendations.sort((a, b) => {
            const priority = { high: 0, medium: 1, low: 2 };
            return priority[a.priority] - priority[b.priority];
          }),
          curveHealth: recommendations.filter(r => r.priority === 'high').length === 0 ? 'good' : 'needs improvement',
        }, null, 2);
      } catch (error) {
        return JSON.stringify({
          success: false,
          error: error.message,
          message: 'Failed to analyze mana curve. Ensure all cards have valid CMC values.',
        });
      }
    },
  });
}

export default createManaCurveAnalysisTool;
