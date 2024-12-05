
document.addEventListener('DOMContentLoaded', () => {
  console.log('Popup loaded');
  const extractBtn = document.getElementById('extractBtn');
  const listBtn = document.getElementById('listBtn');
  const profitInfo = document.getElementById('profitInfo');
  const status = document.getElementById('status');
  let currentProductData = null;

  extractBtn.addEventListener('click', async () => {
      try {
          status.textContent = 'Extracting product data...';
          status.className = '';

          // Send message to background script to handle extraction
          const response = await chrome.runtime.sendMessage({ 
              action: 'extractProduct' 
          });

          if (response.success) {
              currentProductData = response.data;
              displayProfitInfo(currentProductData);
              listBtn.disabled = false;
              status.textContent = 'Product extracted successfully!';
              status.className = 'success';
          } else {
              throw new Error(response.error);
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

          await chrome.runtime.sendMessage({
              action: 'createListing',
              productData: currentProductData
          });

          status.textContent = 'Listing created successfully!';
          status.className = 'success';
      } catch (error) {
          status.textContent = 'Error creating listing: ' + error.message;
          status.className = 'error';
      }
  });

  function displayProfitInfo(data) {
      document.getElementById('costPrice').textContent = `$${data.price}`;
      document.getElementById('sellingPrice').textContent = `$${data.sellingPrice}`;
      document.getElementById('profit').textContent = `$${data.estimatedProfit}`;
      profitInfo.style.display = 'block';
  }
});
