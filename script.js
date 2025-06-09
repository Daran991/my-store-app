 
        const WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbx1-IelSsYxZMZDQuJWGcBVwVUS23n5mdtjGtR5yRhWofNav7qdfu1zSU6v8yJLIouh3g/exec'; 
        // *******************************************************************************************************

const loggedInUser = localStorage.getItem('loggedInUser');
let currentUserData = null;

if (!loggedInUser) {
    // إذا لم يكن المستخدم مسجلاً، أعد توجيهه إلى صفحة تسجيل الدخول
    window.location.href = 'login.html'; 
} else {
    currentUserData = JSON.parse(loggedInUser);
    // تحديث رسالة الترحيب باسم المستخدم واسم المحل
    document.getElementById('display-username').textContent = currentUserData.username;
    document.getElementById('display-shopname').textContent = currentUserData.shopName;
    // ملء حقل اسم المحل في نموذج الطلب
    document.getElementById('customer-name').value = currentUserData.shopName;

    // منطق زر تسجيل الخروج
    document.getElementById('logout-button').addEventListener('click', () => {
        localStorage.removeItem('loggedInUser'); // حذف بيانات الجلسة
        window.location.href = 'login.html'; // إعادة توجيه إلى صفحة تسجيل الدخول
    });
}

// *** نهاية منطق التحقق من تسجيل الدخول ***

let allProducts = []; 
let displayedProducts = []; 

async function loadSettings() {
    try {
        const response = await fetch(`${WEB_APP_URL}?action=getSettings`);
        const settings = await response.json();
        if (settings.SiteTitle) {
            document.getElementById('page-title').textContent = settings.SiteTitle;
            document.title = settings.SiteTitle; 
        }
        if (settings.WelcomeMessage) {
            document.getElementById('welcome-message').textContent = settings.WelcomeMessage;
        }
        // هذا الجزء كان موجوداً في HTML ولكنه غير مستخدم حالياً في هذا الكود
        // if (settings.ContactPhone) {
        //     const contactDiv = document.createElement('div');
        //     contactDiv.innerHTML = `<p>للتواصل: ${settings.ContactPhone}</p>`;
        //     document.querySelector('.container').appendChild(contactDiv);
        // }
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
        allProducts = await response.json(); // تخزين جميع المنتجات هنا
        populateCategories(); // ملء قائمة الفئات
        filterProducts(); // عرض جميع المنتجات في البداية (أو تطبيق أي تصفية افتراضية)
    } catch (error) {
        console.error("خطأ في تحميل المنتجات:", error);
        document.getElementById('product-list').innerHTML = '<p class="error">فشل تحميل المنتجات. الرجاء المحاولة لاحقاً.</p>';
    }
}

// دالة جديدة لملء قائمة الفئات
function populateCategories() {
    const categoryFilter = document.getElementById('category-filter');
    const categories = new Set(); // لاستخراج الفئات الفريدة

    allProducts.forEach(product => {
        if (product.Category) { // تأكد أن عمود Category موجود في الشيت
            categories.add(product.Category);
        }
    });

    categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category;
        option.textContent = category;
        categoryFilter.appendChild(option);
    });
}

// دالة جديدة لتصفية وعرض المنتجات
function filterProducts() {
    const searchInput = document.getElementById('search-input').value.toLowerCase();
    const categoryFilter = document.getElementById('category-filter').value;

    displayedProducts = allProducts.filter(product => {
        const matchesSearch = product.Name.toLowerCase().includes(searchInput) || 
                              (product.Description && product.Description.toLowerCase().includes(searchInput));
        const matchesCategory = categoryFilter === '' || product.Category === categoryFilter;
        return matchesSearch && matchesCategory;
    });

    renderDisplayedProducts(); // دالة جديدة لعرض المنتجات المفلترة
}

// دالة لعرض المنتجات التي تم تحديدها للعرض
function renderDisplayedProducts() {
    const productListDiv = document.getElementById('product-list');
    productListDiv.innerHTML = ''; 

    if (displayedProducts.length === 0) {
        productListDiv.innerHTML = '<p>لا توجد منتجات مطابقة لعملية البحث أو التصفية.</p>';
        return;
    }

    displayedProducts.forEach(product => {
        const productItem = document.createElement('div');
        productItem.className = 'product-item';
        productItem.innerHTML = `
            <h3>${product.Name}</h3> 
            ${product.Description ? `<p>${product.Description}</p>` : ''}
            <p class="price">السعر: ${product.Price} شيكل</p>
            ${product.ImageUrl ? `<img src="${product.ImageUrl}" alt="${product.Name}">` : ''}
            <label for="qty-${product.ID}">الكمية:</label>
            <input type="number" id="qty-${product.ID}" value="0" min="0">
        `;
        productListDiv.appendChild(productItem);
    });
}

// دالة لإرسال الطلب (عبر GET)
async function submitOrder() {
    const shopName = currentUserData.shopName; 
    const customerId = currentUserData.customerId; 
    const username = currentUserData.username; 

    const notes = document.getElementById('notes').value.trim();
    const responseMessageDiv = document.getElementById('response-message');
    responseMessageDiv.textContent = '';
    responseMessageDiv.className = 'message'; 

    if (!currentUserData) {
        responseMessageDiv.textContent = 'خطأ: بيانات المستخدم غير متوفرة. الرجاء تسجيل الدخول.';
        responseMessageDiv.classList.add('error');
        setTimeout(() => { window.location.href = 'login.html'; }, 2000); 
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
    params.append('customerName', shopName); 
    params.append('notes', notes);
    params.append('totalAmount', totalAmount);
    params.append('items', JSON.stringify(items)); 
    params.append('submittedByUsername', username); 
    params.append('submittedByCustomerId', customerId); 

    try {
        // ***** التصحيح هنا: سطر fetch بدون علامات HTML/Markdown *****
        const response = await fetch(`${WEB_APP_URL}?${params.toString()}`, {
            method: 'GET' 
        });

        if (!response.ok) {
            throw new Error('فشل إرسال الطلب: ' + response.statusText);
        }

        const result = await response.json();
        if (result.success) {
            responseMessageDiv.textContent = 'تم إرسال طلبك بنجاح! رقم الطلب: ' + result.orderId;
            responseMessageDiv.classList.add('success');
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
if (currentUserData) { 
    loadSettings();
    loadProducts(); 
}
