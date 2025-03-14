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
  
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  console.log('Active tab in pop:', tab);

  const optionsContainer = document.getElementById('optionsContainer');
  const listBtn = document.getElementById('listBtn');
  const advancedOptionsBtn = document.getElementById('advancedOptionsBtn');
  const dashboardBtn = document.getElementById('dashboardBtn');
  const status = document.getElementById('status');
  const productList = document.getElementById('productList');

  let currentProductData = null;

  if (tab.url.includes('aliexpress')) {
    console.log('Aliexpress tab detected');
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

      // Display the product list
      // productList.innerHTML = `<div>${response.data.name}</div>`; // Customize this as needed
    } else {
      status.textContent = 'Failed to extract product data.';
      status.className = 'status--error';
    }
  } else {
    status.textContent = 'This is not an AliExpress page.';
    status.className = 'status--error';
  }

  // Send product data to background script when Proceed with Listing is clicked
  listBtn.addEventListener('click', async () => {
    try {
      status.textContent = 'Sending data to background...';
      status.className = '';

      await chrome.runtime.sendMessage({
        action: 'listProduct',
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
    window.location.href = 'edit_product.html';
  });

  // Dashboard button
  dashboardBtn.addEventListener('click', () => {
    chrome.tabs.create({
      url: process.env.DASHBOARD_URL + '/login'
    });
  });
});