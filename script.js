document.addEventListener("DOMContentLoaded", function() {
    const cartDialog = document.querySelector("#cart-dialog");
    const cartItemsElement = document.querySelector("#cart-items");
    const cartTotalElement = document.querySelector("#cart-total");
    const cartCountElement = document.querySelector("#cart-count");
    const cartWhatsappButton = document.querySelector("#cart-whatsapp");
    const buyerNameInput = document.querySelector("#buyer-name");
    const orderStatus = document.querySelector("#order-status");
    const menuGrid = document.querySelector(".menu-grid");
    const menuCategoryTabs = [...document.querySelectorAll(".menu-tab")];
    const deliveryAddressField = document.querySelector("#delivery-address-field");
    const deliveryAddressInput = document.querySelector("#delivery-address");
    const orderNoteInput = document.querySelector("#order-note");
    const navbar = document.querySelector(".navbar");
    const root = document.documentElement;
    const menuImages = new Map(
        [...document.querySelectorAll(".menu-card")].map(card => [
            card.querySelector(".menu-title").textContent.trim(),
            card.querySelector("img").getAttribute("src")
        ])
    );
    const currency = new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        maximumFractionDigits: 0
    });

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const canReveal = !reduceMotion && "IntersectionObserver" in window;

    /* ==================== EFEK INTRO (SPLASH) ==================== */
    function runIntro() {
        root.classList.toggle("motion", !reduceMotion);

        let seen = false;
        try { seen = sessionStorage.getItem("masDadoIntro") === "1"; } catch { /* abaikan */ }

        if (reduceMotion) {
            root.classList.add("is-ready");
            return;
        }

        if (seen) {
            requestAnimationFrame(() => root.classList.add("is-ready"));
            return;
        }

        const logoSrc = document.querySelector(".menu-brand-title img")?.getAttribute("src") || "";
        const splash = document.createElement("div");
        splash.className = "splash";
        splash.setAttribute("aria-hidden", "true");
        splash.innerHTML = `
            <div class="splash-inner">
                ${logoSrc ? `<img class="splash-logo" src="${logoSrc}" alt="">` : ""}
                <div class="splash-name">Nasgor &amp; Seafood</div>
                <div class="splash-tag">Dahar Pedo Ala Resto</div>
                <div class="splash-bar"></div>
            </div>`;
        document.body.append(splash);
        document.body.classList.add("is-loading");

        const finish = () => {
            splash.classList.add("is-leaving");
            root.classList.add("is-ready");
            document.body.classList.remove("is-loading");
            try { sessionStorage.setItem("masDadoIntro", "1"); } catch { /* abaikan */ }
            setTimeout(() => splash.remove(), 1000);
        };

        setTimeout(finish, 1700);
        splash.addEventListener("click", finish, { once: true });
    }

    runIntro();

    /* ==================== NAVBAR ==================== */
    function updateNavbar() {
        navbar.classList.toggle("is-scrolled", window.scrollY > 40);
    }
    window.addEventListener("scroll", updateNavbar, { passive: true });
    updateNavbar();

    const navLinks = [...document.querySelectorAll(".nav-links a")];
    if ("IntersectionObserver" in window) {
        const spy = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                if (!entry.isIntersecting) return;
                navLinks.forEach(link =>
                    link.classList.toggle("is-current", link.getAttribute("href") === `#${entry.target.id}`)
                );
            });
        }, { rootMargin: "-45% 0px -50% 0px" });
        navLinks.forEach(link => {
            const target = document.querySelector(link.getAttribute("href"));
            if (target) spy.observe(target);
        });
    }

    /* ==================== EFEK MUNCUL SAAT SCROLL ==================== */
    let revealObserver = null;

    if (canReveal) {
        revealObserver = new IntersectionObserver(entries => {
            let order = 0;
            entries.forEach(entry => {
                if (!entry.isIntersecting) return;
                entry.target.style.setProperty("--d", `${Math.min(order, 6) * 0.07}s`);
                entry.target.classList.add("in");
                revealObserver.unobserve(entry.target);
                order += 1;
            });
        }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });

        document.querySelectorAll(
            ".feature-card, .menu-card, .menu-category-title, .testimonial-card, .section-title, .footer-box"
        ).forEach(element => {
            element.classList.add("reveal");
            revealObserver.observe(element);
        });
    }

    /* ==================== KERANJANG ==================== */
    let cart;
    try {
        cart = new Map(JSON.parse(localStorage.getItem("masDadoCart") || "[]"));
    } catch {
        cart = new Map();
    }

    function saveCart() {
        try {
            localStorage.setItem("masDadoCart", JSON.stringify([...cart]));
        } catch {
            // Keranjang tetap bisa dipakai selama halaman terbuka.
        }
    }

    function updateMenuView() {
        const activeCategory = menuCategoryTabs.find(tab => tab.classList.contains("is-active")).dataset.menuCategory;
        const cards = [...menuGrid.querySelectorAll(".menu-card")];

        cards.forEach(card => {
            const isMie = card.classList.contains("is-mie");
            const isSayur = card.classList.contains("is-sayur");
            const isKwetiaw = card.classList.contains("is-kwetiaw");
            const category = isMie ? "mie" : isSayur ? "sayur" : isKwetiaw ? "kwetiaw" : "nasi";
            const wasHidden = card.hidden;
            card.hidden = category !== activeCategory;

            if (revealObserver && wasHidden && !card.hidden) {
                card.classList.remove("in");
                revealObserver.observe(card);
            }
        });

        const headingGroups = [
            [".promo-heading", ".menu-card.is-promo", "nasi"],
            [".budget-heading", ".menu-card.is-budget", "nasi"],
            [".regular-heading", ".menu-card.is-regular", "nasi"],
            [".mie-heading", ".menu-card.is-mie", "mie"],
            [".capcay-promo-heading", ".menu-card.is-sayur-promo", "sayur"],
            [".capcay-regular-heading", ".menu-card.is-sayur-regular", "sayur"],
            [".kwetiaw-promo-heading", ".menu-card.is-kwetiaw-promo", "kwetiaw"],
            [".kwetiaw-regular-heading", ".menu-card.is-kwetiaw-regular", "kwetiaw"]
        ];

        headingGroups.forEach(([headingSelector, cardSelector, category]) => {
            const heading = menuGrid.querySelector(headingSelector);
            const wasHidden = heading.hidden;
            const hasVisibleCard = [...menuGrid.querySelectorAll(cardSelector)].some(card => !card.hidden);
            heading.hidden = !hasVisibleCard || category !== activeCategory;

            if (revealObserver && wasHidden && !heading.hidden) {
                heading.classList.remove("in");
                revealObserver.observe(heading);
            }
        });

    }

    menuCategoryTabs.forEach(tab => {
        tab.addEventListener("click", () => {
            menuCategoryTabs.forEach(categoryTab => {
                const isActive = categoryTab === tab;
                categoryTab.classList.toggle("is-active", isActive);
                categoryTab.setAttribute("aria-pressed", String(isActive));
            });
            updateMenuView();
            tab.scrollIntoView({
                behavior: reduceMotion ? "auto" : "smooth",
                block: "start"
            });
        });
    });

    function createQuantityButton(icon, action, name, label) {
        const button = document.createElement("button");
        button.className = "quantity-button";
        button.type = "button";
        button.dataset.cartAction = action;
        button.dataset.itemName = name;
        button.setAttribute("aria-label", label);
        button.innerHTML = `<i class="fas ${icon}" aria-hidden="true"></i>`;
        return button;
    }

    function renderCart() {
        cartItemsElement.replaceChildren();
        let total = 0;
        let itemCount = 0;

        if (cart.size === 0) {
            const emptyMessage = document.createElement("p");
            emptyMessage.className = "cart-empty";
            emptyMessage.textContent = "Belum ada pesanan. Pilih menu lalu tekan Pesan.";
            cartItemsElement.append(emptyMessage);
        }

        cart.forEach((item, name) => {
            const row = document.createElement("article");
            row.className = "cart-item";

            const image = document.createElement("img");
            image.className = "cart-item-image";
            image.src = item.image || menuImages.get(name) || "";
            image.alt = `Foto ${name}`;
            image.loading = "lazy";

            const details = document.createElement("div");
            details.className = "cart-item-details";
            const title = document.createElement("strong");
            title.textContent = name;
            const lineTotal = document.createElement("span");
            lineTotal.textContent = currency.format(item.price * item.quantity);
            details.append(title, lineTotal);

            const controls = document.createElement("div");
            controls.className = "quantity-controls";
            controls.append(
                createQuantityButton("fa-minus", "decrease", name, `Kurangi ${name}`)
            );
            const quantity = document.createElement("span");
            quantity.className = "quantity-value";
            quantity.textContent = item.quantity;
            controls.append(quantity);
            controls.append(
                createQuantityButton("fa-plus", "increase", name, `Tambah ${name}`),
                createQuantityButton("fa-trash", "remove", name, `Hapus ${name}`)
            );

            row.append(image, details, controls);
            cartItemsElement.append(row);
            total += item.price * item.quantity;
            itemCount += item.quantity;
        });

        cartTotalElement.textContent = currency.format(total);
        cartCountElement.textContent = itemCount;
        cartWhatsappButton.disabled = itemCount === 0;
        saveCart();
    }

    /* ==================== NOTIFIKASI (TOAST) ==================== */
    const toast = document.createElement("div");
    toast.className = "toast";
    toast.setAttribute("role", "status");
    toast.setAttribute("aria-live", "polite");
    toast.innerHTML = `<i class="fas fa-circle-check" aria-hidden="true"></i><span></span><button type="button">Lihat pesanan</button>`;
    document.body.append(toast);

    const toastText = toast.querySelector("span");
    let toastTimer;

    toast.querySelector("button").addEventListener("click", () => {
        toast.classList.remove("is-show");
        openCart();
    });

    function showToast(name) {
        toastText.textContent = `${name} ditambahkan ke pesanan`;
        toast.classList.add("is-show");
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => toast.classList.remove("is-show"), 2600);
    }

    function bumpCartCount() {
        cartCountElement.classList.remove("is-bump");
        void cartCountElement.offsetWidth;
        cartCountElement.classList.add("is-bump");
    }

    function openWhatsAppOrder(paymentMethod, buyerName, orderType, deliveryAddress, orderNote, items = [...cart]) {
        if (items.length === 0) return;

        const total = items.reduce((sum, [, item]) => sum + item.price * item.quantity, 0);
        const orderLines = items.map(([name, item]) =>
            `- ${name} x${item.quantity}: ${currency.format(item.price * item.quantity)}`
        );
        const message = [
            "Halo Nasgor & Seafood, saya ingin memesan:",
            `Nama pembeli: ${buyerName}`,
            `Jenis pesanan: ${orderType}`,
            ...(orderType === "Pesan antar" ? [`Alamat pengantaran: ${deliveryAddress}`] : []),
            ...(orderNote ? [`Catatan: ${orderNote}`] : []),
            ...orderLines,
            `Total: ${currency.format(total)}`,
            `Metode pembayaran: ${paymentMethod}`
        ].join("\n");
        const whatsappUrl = `https://wa.me/6282112421018?text=${encodeURIComponent(message)}`;

        window.open(whatsappUrl, "_blank", "noopener,noreferrer");
    }

    document.querySelectorAll(".btn-pesan").forEach(button => {
        const card = button.closest(".menu-card");
        const name = card.querySelector(".menu-title").textContent.trim();
        const price = Number(card.querySelector(".price").textContent.replace(/\D/g, ""));
        const image = card.querySelector("img").getAttribute("src");
        button.classList.add("btn-cart-add");
        button.innerHTML = '<i class="fas fa-cart-plus" aria-hidden="true"></i> Pesan';
        button.setAttribute("aria-label", `Tambahkan ${name} ke pesanan`);

        button.addEventListener("click", () => {
            const item = cart.get(name) || { price, quantity: 0, image };
            item.image = item.image || image;
            item.quantity += 1;
            cart.set(name, item);
            orderStatus.textContent = "";
            renderCart();
            bumpCartCount();
            showToast(name);
        });
    });

    cartItemsElement.addEventListener("click", event => {
        const button = event.target.closest("button[data-cart-action]");
        if (!button) return;

        const name = button.dataset.itemName;
        const item = cart.get(name);
        if (!item) return;

        if (button.dataset.cartAction === "increase") item.quantity += 1;
        if (button.dataset.cartAction === "decrease") item.quantity -= 1;
        if (button.dataset.cartAction === "remove" || item.quantity <= 0) {
            cart.delete(name);
        } else {
            cart.set(name, item);
        }

        renderCart();
    });

    function openCart() {
        orderStatus.textContent = "";
        cartDialog.showModal();
    }

    document.querySelector("#cart-open").addEventListener("click", openCart);
    document.querySelector("#cart-close").addEventListener("click", () => cartDialog.close());
    cartDialog.addEventListener("click", event => {
        if (event.target === cartDialog) cartDialog.close();
    });

    function updateDeliveryAddressVisibility() {
        const isDelivery = document.querySelector('input[name="order-type"]:checked').value === "Pesan antar";
        deliveryAddressField.hidden = !isDelivery;
        deliveryAddressInput.required = isDelivery;
        if (!isDelivery) deliveryAddressInput.value = "";
    }

    document.querySelectorAll('input[name="order-type"]').forEach(input => {
        input.addEventListener("change", updateDeliveryAddressVisibility);
    });
    updateDeliveryAddressVisibility();

    cartWhatsappButton.addEventListener("click", () => {
        if (cart.size === 0) return;

        const buyerName = buyerNameInput.value.trim();
        if (!buyerName) {
            orderStatus.textContent = "Masukkan nama pembeli terlebih dahulu.";
            buyerNameInput.focus();
            return;
        }

        const orderType = document.querySelector('input[name="order-type"]:checked').value;
        const deliveryAddress = deliveryAddressInput.value.trim();
        if (orderType === "Pesan antar" && !deliveryAddress) {
            orderStatus.textContent = "Masukkan alamat pengantaran terlebih dahulu.";
            deliveryAddressInput.focus();
            return;
        }

        const paymentMethod = document.querySelector('input[name="payment-method"]:checked').value;
        openWhatsAppOrder(paymentMethod, buyerName, orderType, deliveryAddress, orderNoteInput.value.trim());
        orderStatus.textContent = "Ringkasan pesanan dibuka di WhatsApp. Kirim pesannya untuk mengonfirmasi pesanan.";
    });

    updateMenuView();
    renderCart();
});