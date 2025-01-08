import './auth.js';
document.addEventListener('DOMContentLoaded', async () => {
    console.log('Manage prod page loaded');
    // const {extractedProducts} = await chrome.storage.local.get('extractedProducts');
    const {data:extractedProducts} = (await chrome.runtime.sendMessage({action: 'getAllProducts'})).data;
    console.log('extractedproducts:', extractedProducts);
    
    const productsBody = document.getElementById('productsTableBody');
    extractedProducts.forEach((prod) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${prod.title}</td>
            <td>${prod.price}</td>
            <td>
                <div class="btn-group">
                        <button class="btn btn--small btn--list" data-id="${prod.id}">List</button>
                        <button class="btn btn--small btn--delete" data-id="${prod.id}">Delete</button>
                        <button class="btn btn--small btn--edit" data-id="${prod.id}">Edit</button>
                </div>
            </td>
        `;
        productsBody.appendChild(row);
    });
    const backBtn = document.getElementById('backBtn');
    backBtn.addEventListener('click', () => {
        console.log('back clicked');
        window.location.href = 'popup.html';
    });

    const editBtns = document.querySelectorAll('.btn--edit');
    editBtns.forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const id = e.target.getAttribute('data-id');
            window.location.href = `edit_product.html?id=${id}`;
        });
    });

    const listBtns = document.querySelectorAll('.btn--list');
    listBtns.forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const id = e.target.getAttribute('data-id');
            console.log('List clicked:', id);
            chrome.runtime.sendMessage({
                action: 'listProduct',
                id
            });
        });
    });
});