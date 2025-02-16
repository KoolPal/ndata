const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const url = 'https://www.icarry.in/track-shipment?a=347720741487';

// Add stealth plugin and use defaults (all tricks to bypass detection)
puppeteer.use(StealthPlugin());

(async () => {
  try {
    // Launch with headless mode
    const browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox'
      ]
    });
    
    const page = await browser.newPage();
    
    // Go to the target URL and wait until network is idle to reduce detection likelihood.
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
    
    // Get the full page content as HTML
    const content = await page.content();
    
    // Function to extract values using a regex pattern
    function extractContent(content, regex) {
      const match = content.match(regex);
      return match ? match[1] : null;
    }
    
    // Extract details using provided regex patterns with proper escapes
    const courierName = extractContent(content, /Courier Name\s*:<\/td>\s*<td>(.*?)<\/td>/);
    const status = extractContent(content, /Status:\s*<\/b>\s*<span[^>]*>(.*?)<\/span>/)?.replace(/<[^>]*>/g, '');
    const destination = extractContent(content, /Destination:\s*<\/b>\s*<span[^>]*>(.*?)<\/span>/);
    
    // Print out the scraped data to the console (GitHub Actions logs will show these statements)
    console.log("Scraped Data:");
    console.log(" Courier Name:", courierName);
    console.log(" Status:", status);
    console.log(" Destination:", destination);
    
    await browser.close();
  } catch (error) {
    console.error("Error occurred:", error);
    process.exit(1);
  }
})();
