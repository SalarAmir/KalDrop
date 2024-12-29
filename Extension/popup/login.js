document.addEventListener('DOMContentLoaded', () => {
    const login = document.getElementById('loginBtn');
    
    login.addEventListener('click', () => {
      // Open dashboard login page in new tab
      console.log('Opening login page:', process.env.DASHBOARD_URL + '/login');
      chrome.tabs.create({
        url: process.env.DASHBOARD_URL + '/login'
      });
    });
  });