console.log('Edit product script loaded');

document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('id');
    
    // Get product data
    console.log('Product ID:', productId);
    const {data:product} = (await chrome.runtime.sendMessage({
        action: 'getProduct',
        id:productId
    })).data;

    // console.log('Product:', resp);
    // const product = products.find(p => p.id === productId);
    
    if (!product) {
        console.error('Product not found');
        return;
    }

    // Populate form fields
    document.getElementById('title').value = product.title;
    document.getElementById('price').value = product.price;
    document.getElementById('originalPrice').value = product.originalPrice;
    document.getElementById('sellingPrice').value = product.sellingPrice;
    document.getElementById('url').value = product.url;
    document.getElementById('supplier').value = product.supplier;

    // Populate specifications
    const specificationsContainer = document.getElementById('specificationsContainer');
    Object.entries(product.specifications).forEach(([key, value]) => {
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
    product.variants.sizes.forEach(size => {
        const div = document.createElement('div');
        div.className = 'size-item';
        div.innerHTML = `
            <input type="text" value="${size.value}">
        `;
        sizesContainer.appendChild(div);
    });

    // Populate colors (without images for now)
    const colorsContainer = document.getElementById('colorsContainer');
    product.variants.colors.forEach(color => {
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
        window.location.href = 'manage.html';
    });

    // Form submit handler (you'll implement this part)
    const form = document.getElementById('editProductForm');
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        //all form fields:
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
                colors
            }
        };
        console.log('Updated product:', updatedProduct);

        const resp = await chrome.runtime.sendMessage({
            action: 'updateProduct',
            id: productId,
            product: updatedProduct
        });

        console.log('Form submitted');
    });
});