/**
 * Vercel Speed Insights Initialization
 * This script initializes Vercel Speed Insights for the website
 */

// Import and initialize Speed Insights from CDN
import { injectSpeedInsights } from 'https://cdn.jsdelivr.net/npm/@vercel/speed-insights@2/+esm';

// Initialize Speed Insights
injectSpeedInsights({
  debug: false
});
