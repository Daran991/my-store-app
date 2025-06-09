 
        const WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbwlrzbHUppbmvnAZGOJXxDkrPCnE-ki1GAXKKAk5OqmtVNYhkFImBgGVdYLc24lG5szMg/exec'; 
        // *******************************************************************************************************

const loggedInUser = localStorage.getItem('loggedInUser');
let currentUserData = null;

if (!loggedInUser) {
   
    window.location.href = 'login.html'; 
} else {
    currentUserData = JSON.parse(loggedInUser);
   
    document.getElementById('display-username').textContent = currentUserData.username;
    document.getElementById('display-shopname').textContent = currentUserData.shopName;
    
    document.getElementById('customer-name').value = currentUserData.shopName;

    
    document.getElementById('logout-button').addEventListener('click', () => {
        localStorage.removeItem('loggedInUser'); 
        window.location.href = 'login.html';
    });
}




let allProducts = []; 
let displayedProducts = []; 

//*******


 async function loadSettings() {
            try {
                const response = await fetch(`${WEB_APP_URL}?action=getSettings`);
                const settings = await response.json();
                if (settings.SiteTitle) {
                    document.getElementById('page-title').textContent = settings.SiteTitle;
                    document.title = settings.SiteTitle; // تحديث عنوان تبويب المتصفح
                }
                if (settings.WelcomeMessage) {
                    document.getElementById('welcome-message').textContent = settings.WelcomeMessage;
                }
           
                 if (settings.ContactPhone) {
                     const contactDiv = document.createElement('div');
                     contactDiv.innerHTML = `<p>للتواصل: ${settings.ContactPhone}</p>`;
                     document.querySelector('.container').appendChild(contactDiv);
                 }
            } catch (error) {
                console.error("خطأ في تحميل الإعدادات:", error);
            }
        }

      
        async function loadProducts() {
            try {
                const response = await fetch(`${WEB_APP_URL}?action=getProducts`);
                if (!response.ok) {
                    throw new Error('فشل تحميل المنتجات: ' + response.statusText);
                }
                productsData = await response.json();
                renderProducts();
            } catch (error) {
                console.error("خطأ في تحميل المنتجات:", error);
                document.getElementById('product-list').innerHTML = '<p class="error">فشل تحميل المنتجات. الرجاء المحاولة لاحقاً.</p>';
            }
        }

       
        function renderProducts() {
            const productListDiv = document.getElementById('product-list');
            productListDiv.innerHTML = '';

            if (productsData.length === 0) {
                productListDiv.innerHTML = '<p>لا توجد منتجات متاحة حالياً.</p>';
                return;
            }

            productsData.forEach(product => {
                const productItem = document.createElement('div');
                productItem.className = 'product-item';
                productItem.innerHTML = `
                    <h3>${product.Name}</h3>
                    ${product.Description ? `<p>${product.Description}</p>` : ''}
                    <p class="price">السعر: ${product.Price} شيكل</p>
                    ${product.ImageUrl ? `<img src="${product.ImageUrl}" alt="${product.Name}">` : ''}
                    <label for="qty-${product.ID}">الكمية:</label>
                    <input type="number" id="qty-${product.ID}" value="0" min="0"> `;
                productListDiv.appendChild(productItem);
            });
        }

      
async function submitOrder() {
    // نستخدم currentUserData بدلاً من حقل customer-name القابل للتعديل
    // هذا يضمن أن اسم المحل ومعرفه يأتي من الحساب المسجل وليس من حقل نصي.
    const shopName = currentUserData.shopName; 
    const customerId = currentUserData.customerId; 
    const username = currentUserData.username; // اسم المستخدم الذي أرسل الطلب

    const notes = document.getElementById('notes').value.trim();
    const responseMessageDiv = document.getElementById('response-message');
    responseMessageDiv.textContent = '';
    responseMessageDiv.className = 'message'; 

    // لا نحتاج للتحقق من customerName هنا لأنه يأتي من localStorage
    // ولكن نتحقق من وجود بيانات المستخدم
    if (!currentUserData) {
        responseMessageDiv.textContent = 'خطأ: بيانات المستخدم غير متوفرة. الرجاء تسجيل الدخول.';
        responseMessageDiv.classList.add('error');
        setTimeout(() => { window.location.href = 'login.html'; }, 2000); // إعادة توجيه بعد ثانيتين
        return;
    }

    const items = [];
    let totalAmount = 0;
    let hasItems = false; 

    allProducts.forEach(product => { 
        const quantityInput = document.getElementById(`qty-${product.ID}`);
        if (quantityInput) { 
            const quantity = parseInt(quantityInput.value);
            if (quantity > 0) {
                items.push({
                    productId: product.ID,
                    productName: product.Name,
                    quantity: quantity,
                    priceAtOrder: product.Price
                });
                totalAmount += quantity * product.Price;
                hasItems = true;
            }
        }
    });

    if (!hasItems) {
        responseMessageDiv.textContent = 'الرجاء تحديد كمية لمنتج واحد على الأقل.';
        responseMessageDiv.classList.add('error');
        return;
    }

    const params = new URLSearchParams();
    params.append('action', 'submitOrder'); 
    params.append('customerName', shopName); // اسم المحل من بيانات المستخدم
    params.append('notes', notes);
    params.append('totalAmount', totalAmount);
    params.append('items', JSON.stringify(items)); 
    params.append('submittedByUsername', username); // *** جديد: اسم المستخدم المرسل ***
    params.append('submittedByCustomerId', customerId); // *** جديد: معرف العميل المرسل ***

    try {
        const response = await fetch(`<span class="math-inline">\{WEB\_APP\_URL\}?</span>{params.toString()}`, {
            method: 'GET' 
        });

        if (!response.ok) {
            throw new Error('فشل إرسال الطلب: ' + response.statusText);
        }

        const result = await response.json();
        if (result.success) {
            responseMessageDiv.textContent = 'تم إرسال طلبك بنجاح! رقم الطلب: ' + result.orderId;
            responseMessageDiv.classList.add('success');
            // إعادة تعيين النموذج
            document.getElementById('notes').value = '';
            allProducts.forEach(product => {
                const quantityInput = document.getElementById(`qty-${product.ID}`);
                if (quantityInput) {
                    quantityInput.value = '0';
                }
            });
        } else {
            responseMessageDiv.textContent = 'حدث خطأ: ' + result.message;
            responseMessageDiv.classList.add('error');
        }
    } catch (error) {
        console.error("خطأ في إرسال الطلب:", error);
        responseMessageDiv.textContent = 'حدث خطأ في الاتصال بالخادم. الرجاء المحاولة لاحقاً.';
        responseMessageDiv.classList.add('error');
    }
}

// يجب أن يتم استدعاء هذه الدوال فقط بعد التحقق من تسجيل الدخول
if (currentUserData) { // فقط إذا كان المستخدم مسجلاً
    loadSettings();
    loadProducts(); 
}
