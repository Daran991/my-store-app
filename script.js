 
        const WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbwlrzbHUppbmvnAZGOJXxDkrPCnE-ki1GAXKKAk5OqmtVNYhkFImBgGVdYLc24lG5szMg/exec'; 
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

// ... باقي الدوال (loadSettings, loadProducts, populateCategories, filterProducts, renderDisplayedProducts) تبقى كما هي ...


// دالة لإرسال الطلب (عبر GET)
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
