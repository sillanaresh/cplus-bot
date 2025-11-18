import fs from 'fs';
import path from 'path';

// Cache the system prompt to avoid re-reading files on every request
let cachedSystemPrompt: string | null = null;

/**
 * Load and combine the Connect+ Copilot documentation files into a system prompt.
 * This includes:
 * - Connect+ copilot.md: Core copilot behavior, API documentation, UI guidelines
 * - How to create a dataflow.md: Step-by-step dataflow creation process
 *
 * The files are read once and cached for performance.
 */
export function getSystemPrompt(blocksData?: any): string {
  // Load MD files once and cache
  if (!cachedSystemPrompt) {
    try {
      const copilotDocPath = path.join(process.cwd(), 'Connect+ copilot.md');
      const dataflowDocPath = path.join(process.cwd(), 'How to create a dataflow.md');

      const copilotDoc = fs.readFileSync(copilotDocPath, 'utf-8');
      const dataflowDoc = fs.readFileSync(dataflowDocPath, 'utf-8');

      // Combine both documents with a separator
      cachedSystemPrompt = `${copilotDoc}\n\n---\n\n# Dataflow Creation Guide\n\n${dataflowDoc}`;

      console.log('✅ System prompt loaded successfully from MD files');
    } catch (error) {
      console.error('❌ Error loading system prompt files:', error);
      throw new Error('Failed to load system prompt documentation');
    }
  }

  // Append blocks data if available
  const blocksInfo = blocksData
    ? `\n\n---\n\n## Available Blocks in Organization\n\n${JSON.stringify(blocksData, null, 2)}`
    : '';

  return cachedSystemPrompt + blocksInfo;
}

/**
 * Clear the cached system prompt (useful for testing or if MD files are updated)
 */
export function clearSystemPromptCache(): void {
  cachedSystemPrompt = null;
  console.log('🔄 System prompt cache cleared');
}
