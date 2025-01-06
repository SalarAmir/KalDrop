import './auth.js';

document.addEventListener('DOMContentLoaded', async() => {
  // await auth.verifyAuth();

  console.log('new Popup loaded');
  const extractBtn = document.getElementById('extractBtn');
  const profitInfo = document.getElementById('profitInfo');
  const listBtn = document.getElementById('listBtn');
  const manageBtn = document.getElementById('manageBtn');
  const dashboardBtn = document.getElementById('dashboardBtn');
  const status = document.getElementById('status');
  let currentProductData = null;
  
  extractBtn.addEventListener('click', async () => {
    try {
      status.textContent = 'Extracting product data...';
      status.className = '';
      
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      console.log('Active tab in pop:', tab);
      const response = await chrome.tabs.sendMessage(tab.id, { action: 'extractProduct' });
      console.log("response from content:", response);
      if (response.success) {
        currentProductData = response.data;
        displayProfitInfo(currentProductData);
        listBtn.disabled = false;
        status.textContent = 'Product extracted successfully!';
        status.className = 'success';
      }
    } catch (error) {
      status.textContent = 'Error extracting product: ' + error.message;
      status.className = 'error';
    }
  });
  
  listBtn.addEventListener('click', async () => {
    try {
      status.textContent = 'Creating eBay listing...';
      status.className = '';
      
      //send message to background.js:
      const resp = await chrome.runtime.sendMessage({
        action: 'listProduct',
        productData: currentProductData
      });
      if(resp.success){
        status.textContent = 'Listing created successfully!';
        status.className = 'success';
      }
    } catch (error) {
      status.textContent = 'Error creating listing: ' + error.message;
      status.className = 'error';
    }
  });
  
  manageBtn.addEventListener('click', async () => {
    window.location.href = 'manage.html';
  });

  dashboardBtn.addEventListener('click', async () => {
    chrome.tabs.create({
      url: process.env.DASHBOARD_URL + '/login'
    });
  });
  
  function displayProfitInfo(data) {
    console.log('displayProfitInfo:', data);
    document.getElementById('costPrice').textContent = `$${data.price}`;
    document.getElementById('sellingPrice').textContent = `$${data.sellingPrice}`;
    document.getElementById('profit').textContent = `$${data.estimatedProfit}`;
    profitInfo.style.display = 'block';
  }
});