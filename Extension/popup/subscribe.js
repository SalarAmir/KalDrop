document.addEventListener('DOMContentLoaded', () => {
    const subscribe = document.getElementById('subscribeBtn');
    
    subscribe.addEventListener('click', () => {
      // Open dashboard login page in new tab
    //   console.log('Opening login page:', process.env.DASHBOARD_URL + '/billing');
      chrome.tabs.create({
        url: process.env.DASHBOARD_URL + '/billing'
      });
    });
  });