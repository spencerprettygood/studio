import { chromium, FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  // Set up test environment
  const baseURL = config.projects[0]?.use?.baseURL || 'http://localhost:3000';
  
  try {
    // Wait for the app to be ready
    await page.goto(`${baseURL}/api/health`, { waitUntil: 'networkidle' });
    const healthResponse = await page.textContent('pre');
    
    if (healthResponse) {
      const health = JSON.parse(healthResponse);
      if (health.status !== 'healthy' && health.status !== 'degraded') {
        throw new Error(`App not ready: ${health.status}`);
      }
    }
    
    console.log('✅ Application is ready for E2E testing');
  } catch (error) {
    console.error('❌ Application health check failed:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

export default globalSetup;