import './auth.js';
import logo from '../assets/Vendra.png';

document.addEventListener('DOMContentLoaded', async () => {
  console.log('Popup loaded');

  const imgElement = document.createElement('img');
  imgElement.src = logo; 
  imgElement.alt = 'Logo';
  imgElement.width = 200;
  imgElement.width = 200;
  imgElement.style.display = 'block';
  imgElement.style.margin = '0 auto';

  // Append the image to a container in popup.html
  document.getElementById('header').appendChild(imgElement);
  
  const extractBtn = document.getElementById('extractBtn');

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  console.log('Active tab in pop:', tab);
  if (tab.url.includes('aliexpress')) {
    console.log('Aliexpress tab detected');
    extractBtn.disabled = false;
  }
  const optionsContainer = document.getElementById('optionsContainer');
  const listBtn = document.getElementById('listBtn');
  const advancedOptionsBtn = document.getElementById('advancedOptionsBtn');
  const dashboardBtn = document.getElementById('dashboardBtn');
  const status = document.getElementById('status');
  const priceInput = document.getElementById('price');

  let currentProductData = null;

  // Show options section when Extract Product is clicked
  extractBtn.addEventListener('click', async() => {
    status.textContent = 'Extracting product data...';
    status.className = '';
    
    const response = await chrome.tabs.sendMessage(tab.id, { action: 'extractProduct' });
    console.log('response from content:', response);
    if (response.success) {
      await chrome.storage.local.set({ currentProductData: response.data });

      optionsContainer.classList.remove('hidden');
      currentProductData = response.data;
      listBtn.disabled = false;
      advancedOptionsBtn.disabled = false;
      status.textContent = 'Product extracted successfully!';
      status.className = 'status--success';
    }
  });

  // Send price to background script when Proceed with Listing is clicked
  listBtn.addEventListener('click', async () => {
    if (!priceInput.value) {
      status.textContent = 'Price is required!';
      status.className = 'status--error';
      return;
    }

    try {
      status.textContent = 'Sending data to background...';
      status.className = '';

      await chrome.runtime.sendMessage({
        action: 'listProduct',
        price: priceInput.value,
        productData: currentProductData,
      });

      status.textContent = 'Listing created successfully!';
      status.className = 'status--success';
    } catch (error) {
      status.textContent = 'Error creating listing: ' + error.message;
      status.className = 'status--error';
    }
  });

  // Advanced Options button (placeholder for future functionality)
  advancedOptionsBtn.addEventListener('click', () => {
    // status.textContent = 'Advanced options will be added later.';
    // status.className = 'status--success';
    window.location.href = 'edit_product.html';

  });

  // Dashboard button
  dashboardBtn.addEventListener('click', () => {
    chrome.tabs.create({
      url: process.env.DASHBOARD_URL + '/login'
    });
  });
});