const puppeteer = require('puppeteer');
const nodriver = require('nodriver'); // Assumed to work with Puppeteer v24.2.1

(async () => {
  try {
    // Launch Puppeteer with headless mode and recommended arguments.
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();

    // Use NODRIVER to remove basic automation signals (like navigator.webdriver).
    await nodriver(page);

    // Inject additional custom stealth measures into every new document.
    await page.evaluateOnNewDocument(() => {
      // Remove navigator.webdriver flag.
      Object.defineProperty(navigator, 'webdriver', {
        get: () => undefined,
      });
      
      // Fake navigator.plugins data.
      Object.defineProperty(navigator, 'plugins', {
        get: () => [1, 2, 3, 4, 5],
      });
      
      // Stub navigator.languages to mimic a real browser.
      Object.defineProperty(navigator, 'languages', {
        get: () => ['en-US', 'en'],
      });
      
      // Provide a minimal window.chrome object.
      window.chrome = { runtime: {} };
      
      // ----- Additional Stealth Measure: Canvas Fingerprint Spoofing -----
      const getContext = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function(type, ...args) {
        // You can intercept calls to the canvas context and manipulate outputs.
        const context = getContext.apply(this, [type, ...args]);
        if (type === '2d') {
          const originalGetImageData = context.getImageData.bind(context);
          context.getImageData = (...args) => {
            // Alter the image data slightly to spoof fingerprinting.
            const imageData = originalGetImageData(...args);
            for (let i = 0; i < imageData.data.length; i += 4) {
              // Introduce a minor jitter.
              imageData.data[i] = imageData.data[i] + 1 % 255;
            }
            return imageData;
          };
        }
        return context;
      };

      // You can inject further modifications (e.g., AudioContext, WebGL overrides)
      // as needed to better mimic a genuine user environment.
    });

    // Set a realistic user agent string.
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/113.0.0.0 Safari/537.36');

    // Define the target URL (Cloudflare-protected).
    const url = 'https://www.icarry.in/track-shipment?a=347720741487';

    // Navigate to the target page and wait until the network is idle.
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
    
    // Optionally wait a few extra seconds to let page assets finish loading.
    await page.waitForTimeout(5000);

    // Extract the full HTML content of the page.
    const content = await page.content();

    // Debug: Output fetched HTML content to help diagnose any challenge pages.
    console.log("----- Page HTML Content -----");
    console.log(content);
    console.log("----- End of HTML Content -----");

    // Define a helper to extract data via regular expressions.
    function extractContent(content, regex) {
      const match = content.match(regex);
      return match ? match[1].trim() : null;
    }

    // Extract details using regex (adjust these as needed for the target page's structure).
    const courierName = extractContent(content, /Courier Name\s*:\s*<\/td>\s*<td>(.*?)<\/td>/);
    const status = extractContent(content, /Status:\s*<\/b>\s*<span[^>]*>(.*?)<\/span>/);
    const destination = extractContent(content, /Destination:\s*<\/b>\s*<span[^>]*>(.*?)<\/span>/);
    const cleanStatus = status ? status.replace(/<[^>]+>/g, '') : status;

    // Log the final scraped data.
    console.log("Scraped Data:");
    console.log(" Courier Name:", courierName);
    console.log(" Status:", cleanStatus);
    console.log(" Destination:", destination);

    await browser.close();
  } catch (error) {
    console.error("Error occurred:", error);
    process.exit(1);
  }
})();
