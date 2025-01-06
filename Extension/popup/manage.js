import './auth.js';
document.addEventListener('DOMContentLoaded', async () => {
    console.log('Manage prod page loaded');
    const {extractedProducts} = await chrome.storage.local.get('extractedProducts');
    console.log('extractedproducts:', extractedProducts);
    
    const productsBody = document.getElementById('productsTableBody');
    extractedProducts.forEach((prod, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${prod.title}</td>
            <td>${prod.price}</td>
            <td>
                <div class="btn-group">
                        <button class="btn btn--small btn--list" data-id="${index}">List</button>
                        <button class="btn btn--small btn--delete" data-id="${index}">Delete</button>
                        <button class="btn btn--small btn--save" data-id="${index}">Save</button>
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

    const saveBtns = document.querySelectorAll('.btn--save');
    saveBtns.forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const index = e.target.getAttribute('data-id');
            console.log('Save clicked:', index);
            chrome.runtime.sendMessage({
                action: 'saveProduct',
                index:parseInt(index)
            });
        });
    });

    const listBtns = document.querySelectorAll('.btn--list');
    listBtns.forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const index = e.target.getAttribute('data-id');
            console.log('List clicked:', index);
            chrome.runtime.sendMessage({
                action: 'listProduct',
                index:parseInt(index)
            });
        });
    });
});