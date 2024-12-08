- Extension (Automation + Scrapping)
    automation side

    scrapping side

    frontend
        popup with form and confirm button
    
    
    scrapper (content)->popup -> background -> local
    local -> lister

    background -> server

- Database (Users)
- Payment (API)
- Login/Signup (Backend)
- Security 


Descriptions:
1. A person signs up for the chrome add-on for a monthly fee
2. He receives a name and password to connect to the plugin
3. Once he is connected, he can move between the existing fields such as definitions, FIXED ITEM SPECIFICS, etc.
4. The registrant enters AliExpress, he has a button that if he clicks the product goes up to eBay with the details from AliExpress, in addition he has the option to upload in an advanced way, where he clicks the button but before the product goes up he has the option to edit the title, pictures and description and then the product goes up More specifically for his choices
5. The registrant is on the page where a product is uploaded and it shows him that the product has been uploaded successfully, from here he can choose whether to manually edit the product regardless of our plugin



Ebay Classes:

Item Title:
div: .textbox textbox--large textbox--fluid se-textbox--input
input

Brand:
div: .fake-menu-button
write unbranded and then click enter

Type:

button: .fake-link
click

Description:
.se-rte__button-group-editor__html hidden

Pricing:
Format: listbox-button listbox-button--fluid listbox-button--form
- Click on Buy Now

Price:
div .textbox textbox--fluid se-textbox--input
- Access its input to change class

Require immediate payment when buyer uses Buy It Now??
Quantity??
Allow offers??
Shipping??