 
        const WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbwlrzbHUppbmvnAZGOJXxDkrPCnE-ki1GAXKKAk5OqmtVNYhkFImBgGVdYLc24lG5szMg/exec'; 
        // *******************************************************************************************************

        let productsData = []; 

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
                    <input type="number" id="qty-${product.ID}" value="0" min="0">
                `;
                productListDiv.appendChild(productItem);
            });
        }

        
        async function submitOrder() {
            const customerName = document.getElementById('customer-name').value.trim();
            const notes = document.getElementById('notes').value.trim();
            const responseMessageDiv = document.getElementById('response-message');
            responseMessageDiv.textContent = '';
            responseMessageDiv.className = 'message'; 

            if (!customerName) {
                responseMessageDiv.textContent = 'الرجاء إدخال اسم المحل الخاص بك.';
                responseMessageDiv.classList.add('error');
                return;
            }

            const items = [];
            let totalAmount = 0;
            let hasItems = false; 

            productsData.forEach(product => {
                const quantityInput = document.getElementById(`qty-${product.ID}`);
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
            });

            if (!hasItems) {
                responseMessageDiv.textContent = 'الرجاء تحديد كمية لمنتج واحد على الأقل.';
                responseMessageDiv.classList.add('error');
                return;
            }

            const params = new URLSearchParams();
            params.append('action', 'submitOrder'); 
            params.append('customerName', customerName);
            params.append('notes', notes);
            params.append('totalAmount', totalAmount);
            params.append('items', JSON.stringify(items)); 

            try {
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
                    document.getElementById('customer-name').value = '';
                    document.getElementById('notes').value = '';
                    productsData.forEach(product => {
                        document.getElementById(`qty-${product.ID}`).value = '0';
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

        loadSettings();
        loadProducts();