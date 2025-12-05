/**
 * Agent Tools Export
 * Exports all tools for the DeckBuilderAgent
 */

export { createSearchInventoryTool } from './searchInventory.js';
export { createGetCardInfoTool } from './getCardInfo.js';
export { createValidateDeckTool } from './validateDeck.js';
export { createEDHRECSynergyTool } from './getEDHRECSynergies.js';
export { createMetaAnalysisTool } from './getMetaAnalysis.js';
export { createManaCurveAnalysisTool } from './analyzeManaCurve.js';

/**
 * Get all agent tools
 * @returns {Array} Array of LangChain tools
 */
export async function getAllTools() {
  // Import dynamically to avoid circular dependencies
  const { createSearchInventoryTool } = await import('./searchInventory.js');
  const { createGetCardInfoTool } = await import('./getCardInfo.js');
  const { createValidateDeckTool } = await import('./validateDeck.js');
  const { createEDHRECSynergyTool } = await import('./getEDHRECSynergies.js');
  const { createMetaAnalysisTool } = await import('./getMetaAnalysis.js');
  const { createManaCurveAnalysisTool } = await import('./analyzeManaCurve.js');

  return [
    createSearchInventoryTool(),
    createGetCardInfoTool(),
    createValidateDeckTool(),
    createEDHRECSynergyTool(),
    createMetaAnalysisTool(),
    createManaCurveAnalysisTool(),
  ];
}

export default getAllTools;
