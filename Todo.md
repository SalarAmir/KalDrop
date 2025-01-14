- Extension (Automation + Scrapping)
    automation side
        selecting suggested ABD

    scrapping side
        images fix DONE
        description images (next)
        fix random ass prices (eh)
        fix shipping (eh)
    frontend
        popup with form and confirm button DONE
        login DONE
    
    scrapper (content)->popup -> background -> local DONE
    local -> lister DONE

    background -> server (zroori) ABDULLAH DONE


-Server
    -user apis GET SALAR DONE
    -product apis GET SALAR DONE
    -payment
        GET subscription by user id SALAR make api in an hour  
    -webhooks
        -transaction.completed ABD DONE
        -subscription.created ABD in an hour
        -subscription.updated ABD in an hour

-Database

-Dashboard
    -connect with server SALAR DONE
    -Subscription status SALAR using Get subscription
    -signup page 
    pages:
        pyaara krou SALAR
-paddle dashboard
    -trial period

- Payment (API)
- Security DONE

-

DB - product table
DB - user listings table
SERVER - Revamp apis according to new tables and auth

Extension - all api shit 
Dashboard - all api shit
Uploader option


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
Allow offers √
Shipping √


COMMUNICATION GUIDE:
content -> background:
    actions:
        extractProduct
        listProduct
background -> content:
    lister actions:
        clickElement
        navigateToPage
        fillValue


Ebay listing sequence:

https://www.ebay.com/sl/sell:
    List an item button

https://www.ebay.com/sl/prelist/suggest
    Item title box
    Search button

https://www.ebay.com/sl/prelist/identify
    1. Match items:
        Continue without match button
        Confirm Details popup
            - condition
            Continue to listing button
    2. Category Popup

https://www.ebay.com/lstng
    Item form
    Images
    List it Button
