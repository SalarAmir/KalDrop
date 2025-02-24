import './auth.js';

/*
document.addEventListener('DOMContentLoaded', async () => {
  // await auth.verifyAuth();
  // const { data: extractedProducts } = (await chrome.runtime.sendMessage({ action: 'getAllProducts' })).data;

  console.log('new Popup loaded');
  const extractBtn = document.getElementById('extractBtn');
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  console.log('Active tab in pop:', tab);
  if (tab.url.includes('aliexpress.com')) {
    extractBtn.disabled = false;
  }

  const profitInfo = document.getElementById('profitInfo');
  const listBtn = document.getElementById('listBtn');
  const advancedOptionsBtn = document.getElementById('advancedOptionsBtn');
  const dashboardBtn = document.getElementById('dashboardBtn');
  const status = document.getElementById('status');

  const optionsDiv = document.getElementById('optionsContainer')


  let currentProductData = null;
  const showOptions = () =>{
    console.log("yo")
    optionsDiv.classList.remove('hidden')
  }
  extractBtn.addEventListener('click', async () => {
    showOptions()



    try {
      status.textContent = 'Extracting product data...';
      status.className = '';

      const response = await chrome.tabs.sendMessage(tab.id, { action: 'extractProduct' });
      console.log("response from content:", response);
      if (response.success) {
        


        currentProductData = response.data;
        displayProfitInfo(currentProductData);
        // listBtn.disabled = false;
        // advancedOptionsBtn.disabled = false;
        listBtn.classList.remove('hidden'); // Show the "List on eBay" button
        advancedOptionsBtn.classList.remove('hidden'); // Show the "Advanced Options" button
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

      const resp = await chrome.runtime.sendMessage({
        action: 'listProduct',
        productData: currentProductData
      });
      if (resp.success) {
        status.textContent = 'Listing created successfully!';
        status.className = 'success';
      }
    } catch (error) {
      status.textContent = 'Error creating listing: ' + error.message;
      status.className = 'error';
    }
  });

  advancedOptionsBtn.addEventListener('click', async () => {
    await chrome.storage.local.set({ currentProductData });
    window.location.href = 'edit_product.html';
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
*/
import logo from '../assets/Vendra.png'; // Webpack processes this file




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
  if (tab.url.includes('aliexpress.com/item')) {
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