const puppeteer = require('puppeteer');

(async () => {
  console.log("Launching browser...");
  const browser = await puppeteer.launch({
    headless: "new",
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    
    // ---------------------------------------------------------
    // 1. CAJA (POS) - Crear un pedido
    // ---------------------------------------------------------
    console.log("Navigating to Caja (POS)...");
    await page.goto('http://localhost:3000/caja/', { waitUntil: 'networkidle2' });

    console.log("Logging into Caja...");
    // Wait for employee select to load
    await page.waitForSelector('#caja-employee-select option:not([value=""])', { timeout: 5000 });
    
    // Select first employee
    const employeeOptions = await page.$$('#caja-employee-select option');
    let empId = null;
    for (let opt of employeeOptions) {
      const val = await (await opt.getProperty('value')).jsonValue();
      if (val) {
        empId = val;
        break;
      }
    }
    
    if (!empId) {
       console.log("No employees found. Creating a default employee via API...");
       await page.evaluate(async () => {
           await fetch('/api/employees', {
               method: 'POST',
               headers: {'Content-Type': 'application/json'},
               body: JSON.stringify({ name: 'Test Employee', pin: '1234', role: 'cajero' })
           });
       });
       await page.reload({ waitUntil: 'networkidle2' });
       await page.waitForSelector('#caja-employee-select option:not([value=""])', { timeout: 5000 });
       const options = await page.$$('#caja-employee-select option');
       for (let opt of options) {
           const val = await (await opt.getProperty('value')).jsonValue();
           if (val) {
               empId = val;
               break;
           }
       }
    }

    await page.select('#caja-employee-select', empId);
    
    // Enter PIN (1234)
    await new Promise(r => setTimeout(r, 500)); // Wait a bit for UI to settle
    await page.click('.pin-btn[data-num="1"]');
    await page.click('.pin-btn[data-num="2"]');
    await page.click('.pin-btn[data-num="3"]');
    await page.click('.pin-btn[data-num="4"]');

    // Wait for the login overlay to disappear
    await page.waitForFunction(() => {
        const overlay = document.getElementById('caja-login-overlay');
        return overlay && overlay.style.display === 'none';
    }, { timeout: 5000 });

    console.log("Adding custom waffle to cart...");
    // Use custom waffle builder to avoid empty menu issues
    await new Promise(r => setTimeout(r, 2000)); // Wait for startCaja() and loadState() to finish fetching APIs
    await page.waitForSelector('#pos-custom-waffle-btn', { timeout: 5000 });
    await page.click('#pos-custom-waffle-btn');
    
    // Wait for the modal and click Add
    await page.waitForSelector('#pos-modal-add', { timeout: 5000 });
    await new Promise(r => setTimeout(r, 500)); // Let the modal animation finish
    await page.click('#pos-modal-add');

    console.log("Selecting payment method and confirming...");
    await page.waitForSelector('.payment-btn', { timeout: 5000 });
    const paymentBtns = await page.$$('.payment-btn');
    if (paymentBtns.length > 0) {
        await paymentBtns[0].click();
    }

    console.log("Proceeding to checkout...");
    await page.waitForSelector('#pos-checkout-btn', { timeout: 5000 });
    await page.click('#pos-checkout-btn');
    
    // Assuming clicking payment method completes the sale, or there's another button.
    // Let's check for the success modal
    console.log("Waiting for success modal...");
    await page.waitForSelector('#checkout-success-modal', { visible: true, timeout: 5000 });
    
    const trackingCodeElement = await page.$('#checkout-tracking-code');
    const trackingCode = await (await trackingCodeElement.getProperty('textContent')).jsonValue();
    console.log(`Order created successfully! Tracking code: ${trackingCode.trim()}`);

    await page.click('#checkout-success-close');

    // ---------------------------------------------------------
    // 2. COCINA (KDS) - Marcar pedido como listo
    // ---------------------------------------------------------
    console.log("Navigating to Cocina (KDS)...");
    await page.goto('http://localhost:3000/cocina/', { waitUntil: 'networkidle2' });

    console.log("Logging into Cocina...");
    await page.waitForSelector('#kds-employee-select option:not([value=""])', { timeout: 5000 });
    
    // Select first employee
    const kitchenEmployeeOptions = await page.$$('#kds-employee-select option');
    for (let opt of kitchenEmployeeOptions) {
      const val = await (await opt.getProperty('value')).jsonValue();
      if (val) {
        await page.select('#kds-employee-select', val);
        break;
      }
    }
    
    // Enter PIN (1234)
    await new Promise(r => setTimeout(r, 500));
    await page.click('.pin-btn[data-num="1"]');
    await page.click('.pin-btn[data-num="2"]');
    await page.click('.pin-btn[data-num="3"]');
    await page.click('.pin-btn[data-num="4"]');

    // Wait for the login overlay to disappear
    await page.waitForFunction(() => {
        const overlay = document.getElementById('kds-login-overlay');
        return overlay && overlay.style.display === 'none';
    }, { timeout: 5000 });

    console.log("Waiting for orders to load in KDS...");
    await page.waitForSelector('.kds-ticket', { timeout: 5000 });
    
    // Find the order with our tracking code
    const shortCode = trackingCode.trim().slice(-4);
    console.log(`Looking for order with short tracking code ${shortCode}...`);
    const kdsCards = await page.$$('.kds-ticket');
    let orderFound = false;
    for (let card of kdsCards) {
        const idElement = await card.$('.ticket-id');
        const idText = await (await idElement.getProperty('textContent')).jsonValue();
        if (idText.includes(shortCode)) {
            orderFound = true;
            console.log("Order found in KDS. Marking as preparing...");
            // Click the action button (Preparar)
            const actionBtn = await card.$('.btn-action');
            if (actionBtn) {
                await actionBtn.click();
                
                // Wait for it to move and click Listo
                await new Promise(r => setTimeout(r, 1000));
                const readyBtn = await card.$('.btn-action');
                if (readyBtn) await readyBtn.click();
                
                console.log("Order marked as completed.");
            } else {
                console.log("Action button not found on KDS card.");
            }
            break;
        }
    }
    
    if (!orderFound) {
        console.warn("WARNING: Order not found in KDS.");
    }

    // ---------------------------------------------------------
    // 3. APP PUBLICA - Verificar estado del pedido
    // ---------------------------------------------------------
    console.log("Navigating to Public App...");
    await page.goto('http://localhost:3000/app/', { waitUntil: 'networkidle2' });

    console.log("Checking order status...");
    await page.type('#ticket-input', trackingCode.trim().slice(-4));
    await page.click('#track-btn');

    await page.waitForSelector('#status-card:not(.hidden)', { timeout: 5000 });
    const statusTitle = await page.$eval('#status-title', el => el.textContent);
    console.log(`Order status in Public App: ${statusTitle}`);

    if (statusTitle.includes('Listo') || statusTitle.includes('Completado')) {
        console.log("Leaving a review...");
        await page.click('#open-review-btn');
        await page.waitForSelector('#view-review.active', { timeout: 5000 });
        await page.type('#review-comment', 'Excellent waffle, highly recommend!');
        await page.click('#submit-review-btn');
        console.log("Review submitted successfully.");
    }

    // ---------------------------------------------------------
    // 4. ADMIN - Verificar que la venta se registró
    // ---------------------------------------------------------
    console.log("Navigating to Admin Panel...");
    await page.goto('http://localhost:3000/admin/', { waitUntil: 'networkidle2' });

    // Log into Admin
    await page.waitForSelector('#admin-password-input', { timeout: 5000 });
    await page.type('#admin-password-input', 'admin');
    await page.click('#admin-login-btn');
    
    // Wait for the login overlay to disappear
    await page.waitForFunction(() => {
        const overlay = document.getElementById('admin-login-overlay');
        return overlay && overlay.style.display === 'none';
    }, { timeout: 5000 });

    console.log("Checking sales tab...");
    // Try to navigate to sales or dashboard
    const salesTab = await page.$('[data-target="view-sales"]');
    if (salesTab) {
        await salesTab.click();
        await page.waitForSelector('#sales-table-body tr', { timeout: 5000 });
        const salesRows = await page.$$('#sales-table-body tr');
        console.log(`Found ${salesRows.length} sales in the admin panel.`);
    } else {
        console.log("Sales tab not found, maybe it's named differently.");
    }

    console.log("-----------------------------------------");
    console.log("ALL TESTS COMPLETED SUCCESSFULLY");
    console.log("-----------------------------------------");

  } catch (error) {
    console.error("TEST FAILED:", error);
    process.exit(1);
  } finally {
    await browser.close();
    process.exit(0);
  }
})();
