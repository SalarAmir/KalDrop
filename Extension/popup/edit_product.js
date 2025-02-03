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
  Object.entries(currentProductData.specifications).forEach(([key, value]) => {
    const div = document.createElement('div');
    div.className = 'specification-item';
    div.innerHTML = `
      <input type="text" value="${key}" readonly>
      <input type="text" value="${value}">
    `;
    specificationsContainer.appendChild(div);
  });

  // Populate sizes
  const sizesContainer = document.getElementById('sizesContainer');
  currentProductData.variants.sizes.forEach(size => {
    const div = document.createElement('div');
    div.className = 'size-item';
    div.innerHTML = `
      <input type="text" value="${size.value}">
    `;
    sizesContainer.appendChild(div);
  });

  // Populate colors (without images for now)
  const colorsContainer = document.getElementById('colorsContainer');
  currentProductData.variants.colors.forEach(color => {
    const div = document.createElement('div');
    div.className = 'color-item';
    div.innerHTML = `
      <input type="text" value="${color.value}">
    `;
    colorsContainer.appendChild(div);
  });

  // Back button handler
  const backBtn = document.getElementById('backBtn');
  backBtn.addEventListener('click', () => {
    window.location.href = 'popup.html'; // Navigate back to the popup
  });

  // Form submit handler
  const form = document.getElementById('editProductForm');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Collect updated form data
    const title = document.getElementById('title').value;
    const price = document.getElementById('price').value;
    const originalPrice = document.getElementById('originalPrice').value;
    const sellingPrice = document.getElementById('sellingPrice').value;
    const url = document.getElementById('url').value;
    const supplier = document.getElementById('supplier').value;

    const specifications = {};
    const specificationItems = document.querySelectorAll('.specification-item');
    specificationItems.forEach(item => {
      const key = item.children[0].value;
      const value = item.children[1].value;
      specifications[key] = value;
    });

    const sizes = [];
    const sizeItems = document.querySelectorAll('.size-item');
    sizeItems.forEach(item => {
      sizes.push({ value: item.children[0].value });
    });

    const colors = [];
    const colorItems = document.querySelectorAll('.color-item');
    colorItems.forEach(item => {
      colors.push({ value: item.children[0].value });
    });

    const updatedProduct = {
      title,
      price,
      originalPrice,
      sellingPrice,
      url,
      supplier,
      specifications,
      variants: {
        sizes,
        colors,
      },
    };

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
});