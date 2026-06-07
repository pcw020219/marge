const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });

  // Quotes page
  await page.goto('http://localhost:3000/quotes', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'C:/Users/Oroha(MMS)/AppData/Local/Temp/final_quotes.png' });
  console.log('Quotes page done');

  // Click first quote card
  const cards = await page.locator('.quote-card--clickable').all();
  console.log('Clickable cards:', cards.length);
  if (cards.length > 0) {
    await cards[0].click();
    await page.waitForTimeout(400);
    await page.screenshot({ path: 'C:/Users/Oroha(MMS)/AppData/Local/Temp/final_modal.png' });
    console.log('Modal done');

    // Click copy button
    await page.click('.quote-detail-actions .btn');
    await page.waitForTimeout(400);
    await page.screenshot({ path: 'C:/Users/Oroha(MMS)/AppData/Local/Temp/final_copied.png' });
    console.log('Copy feedback done');
    
    // Close modal with Escape
    await page.keyboard.press('Escape');
    await page.waitForTimeout(200);
  }

  // Dark mode toggle test
  await page.click('.theme-toggle');
  await page.waitForTimeout(400);
  await page.screenshot({ path: 'C:/Users/Oroha(MMS)/AppData/Local/Temp/final_dark_quotes.png' });
  console.log('Dark quotes done');

  await browser.close();
})();
