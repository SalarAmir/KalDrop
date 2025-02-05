console.log('Edit product script loaded');

document.addEventListener('DOMContentLoaded', async () => {
  // Retrieve product data from chrome.storage.local
  const { currentProductData } = await chrome.storage.local.get('currentProductData');

  if (!currentProductData) {
    console.error('Product data not found');
    return;
  }

  // Populate form fields
  document.getElementById('title').value = currentProductData.title;
  document.getElementById('price').value = currentProductData.price;
  document.getElementById('originalPrice').value = currentProductData.originalPrice;
  document.getElementById('sellingPrice').value = currentProductData.sellingPrice;
  document.getElementById('url').value = currentProductData.url;
  document.getElementById('supplier').value = currentProductData.supplier;

  // Populate specifications
  const specificationsContainer = document.getElementById('specificationsContainer');
  const addSpecificationBtn = document.getElementById('addSpecificationBtn');

  const renderSpecification = (key = '', value = '') => {
    const div = document.createElement('div');
    div.className = 'specification-item';
    div.innerHTML = `
      <input type="text" placeholder="Key" value="${key}">
      <input type="text" placeholder="Value" value="${value}">
      <button type="button" class="btn btn--danger removeSpecificationBtn">Remove</button>
    `;
    specificationsContainer.appendChild(div);
  };

  // Render existing specifications
  Object.entries(currentProductData.specifications || {}).forEach(([key, value]) => {
    renderSpecification(key, value);
  });

  // Add new specification
  addSpecificationBtn.addEventListener('click', () => {
    renderSpecification();
  });

  // Remove specification
  specificationsContainer.addEventListener('click', (e) => {
    if (e.target.classList.contains('removeSpecificationBtn')) {
      e.target.closest('.specification-item').remove();
    }
  });

  // Populate image URLs
  const imagesContainer = document.getElementById('imagesContainer');
  const addImageBtn = document.getElementById('addImageBtn');

  const renderImageUrl = (url = '') => {
    const div = document.createElement('div');
    div.className = 'image-item';
    div.innerHTML = `
      <input type="url" placeholder="Image URL" value="${url}">
      <button type="button" class="btn btn--danger removeImageBtn">Remove</button>
      ${url ? `<img src="${url}" alt="Preview" class="image-preview">` : ''}
    `;
    imagesContainer.appendChild(div);
  };

  // Render existing image URLs
  (currentProductData.images || []).forEach(url => {
    renderImageUrl(url);
  });

  // Add new image URL
  addImageBtn.addEventListener('click', () => {
    renderImageUrl();
  });

  // Remove image URL
  imagesContainer.addEventListener('click', (e) => {
    if (e.target.classList.contains('removeImageBtn')) {
      e.target.closest('.image-item').remove();
    }
  });

  // Show image preview on URL input
  imagesContainer.addEventListener('input', (e) => {
    if (e.target.tagName === 'INPUT' && e.target.type === 'url') {
      const img = e.target.closest('.image-item').querySelector('.image-preview');
      if (img) {
        img.src = e.target.value;
      } else {
        const newImg = document.createElement('img');
        newImg.src = e.target.value;
        newImg.alt = 'Preview';
        newImg.className = 'image-preview';
        e.target.closest('.image-item').appendChild(newImg);
      }
    }
  });

  // Back button handler
  const backBtn = document.getElementById('backBtn');
  backBtn.addEventListener('click', () => {
    window.location.href = 'popup.html';
  });

  // Function to collect form data
  const collectFormData = () => {
    const title = document.getElementById('title').value;
    const price = document.getElementById('price').value;
    const originalPrice = document.getElementById('originalPrice').value;
    const sellingPrice = document.getElementById('sellingPrice').value;
    const url = document.getElementById('url').value;
    const supplier = document.getElementById('supplier').value;

    // Collect specifications
    const specifications = {};
    const specificationItems = document.querySelectorAll('.specification-item');
    specificationItems.forEach(item => {
      const key = item.querySelector('input[type="text"]').value;
      const value = item.querySelectorAll('input[type="text"]')[1].value;
      if (key && value) {
        specifications[key] = value;
      }
    });

    // Collect image URLs
    const images = [];
    const imageItems = document.querySelectorAll('.image-item');
    imageItems.forEach(item => {
      const imageUrl = item.querySelector('input[type="url"]').value;
      if (imageUrl) {
        images.push(imageUrl);
      }
    });

    return {
      title,
      price,
      originalPrice,
      sellingPrice,
      url,
      supplier,
      specifications,
      images,
    };
  };

  // Save Changes handler
  const form = document.getElementById('editProductForm');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const updatedProduct = collectFormData();
    console.log('Updated product:', updatedProduct);

    // Save the updated product data back to chrome.storage.local
    await chrome.storage.local.set({ currentProductData: updatedProduct });

    // Optionally, send a message to the background script to update the product in storage
    const resp = await chrome.runtime.sendMessage({
      action: 'updateProduct',
      product: updatedProduct,
    });

    console.log('Form submitted:', resp);

    // Navigate back to the popup after saving
    window.location.href = 'popup.html';
  });

  // Save and List handler
  const saveAndListBtn = document.getElementById('saveAndListBtn');
  saveAndListBtn.addEventListener('click', async () => {
    const updatedProduct = collectFormData();
    console.log('Updated product:', updatedProduct);

    // Save the updated product data back to chrome.storage.local
    await chrome.storage.local.set({ currentProductData: updatedProduct });

    // Send a message to the background script to list the product
    const resp = await chrome.runtime.sendMessage({
      action: 'listProduct',
      productData: updatedProduct,
    });

    if (resp.success) {
      console.log('Product listed successfully:', resp);
      window.location.href = 'popup.html'; // Navigate back to the popup
    } else {
      console.error('Error listing product:', resp.error);
    }
  });
});