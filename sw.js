// Global State & Data
const currencies = [
    { code: 'USD', name: 'US Dollar', flag: 'us' },
    { code: 'EUR', name: 'Euro', flag: 'eu' },
    { code: 'PKR', name: 'Pakistani Rupee', flag: 'pk' },
    { code: 'SAR', name: 'Saudi Riyal', flag: 'sa' },
    { code: 'AED', name: 'UAE Dirham', flag: 'ae' },
    { code: 'GBP', name: 'British Pound', flag: 'gb' },
    { code: 'CAD', name: 'Canadian Dollar', flag: 'ca' },
    { code: 'INR', name: 'Indian Rupee', flag: 'in' }
];

let selectedFrom = 'EUR';
let selectedTo = 'PKR';
let chartInstance = null;

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
    populateCurrencyLists();
    convertCurrency();
    fetchPreciousMetals();
    fetchCryptoRates();
    renderCurrencyChart();
    initUnitConverter();
    calculateEMI();
    calculateTax();
    loadNews();
    registerSW();
});

// Register Service Worker
function registerSW() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('./sw.js').catch(err => console.log('SW registration failed:', err));
    }
}

// Mobile Menu Toggle
function toggleMobileMenu() {
    const nav = document.getElementById('nav-menu');
    nav.classList.toggle('mobile-active');
}

// Theme Switcher
function toggleTheme() {
    const html = document.documentElement;
    const themeBtn = document.getElementById('theme-btn');
    if (html.getAttribute('data-theme') === 'dark') {
        html.setAttribute('data-theme', 'light');
        themeBtn.innerHTML = '<i class="fa-solid fa-sun"></i>';
    } else {
        html.setAttribute('data-theme', 'dark');
        themeBtn.innerHTML = '<i class="fa-solid fa-moon"></i>';
    }
}

// Scroll to Sections
function scrollToSection(id) {
    showAuthPage('home');
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
}

// View Controller (Pages / Auth)
function showAuthPage(viewName) {
    document.querySelectorAll('.page-view').forEach(v => v.classList.remove('active'));
    if (viewName === 'home') {
        document.getElementById('home-view').classList.add('active');
    } else {
        const target = document.getElementById(`${viewName}-view`);
        if (target) target.classList.add('active');
    }
}

// Dropdown Custom Handlers
function toggleDropdown(id) {
    document.querySelectorAll('.dropdown-menu').forEach(d => {
        if (d.id !== id) d.classList.remove('show');
    });
    document.getElementById(id).classList.toggle('show');
}

window.onclick = function(e) {
    if (!e.target.closest('.currency-select-wrapper')) {
        document.querySelectorAll('.dropdown-menu').forEach(d => d.classList.remove('show'));
    }
};

function populateCurrencyLists() {
    const fromList = document.getElementById('from-list');
    const toList = document.getElementById('to-list');
    if(!fromList || !toList) return;

    fromList.innerHTML = '';
    toList.innerHTML = '';

    currencies.forEach(c => {
        const itemFrom = `<div class="dropdown-item" onclick="selectCurrency('from', '${c.code}', '${c.flag}')">
            <img src="https://flagcdn.com/w40/${c.flag}.png" width="24">
            <span><strong>${c.code}</strong> - ${c.name}</span>
        </div>`;
        const itemTo = `<div class="dropdown-item" onclick="selectCurrency('to', '${c.code}', '${c.flag}')">
            <img src="https://flagcdn.com/w40/${c.flag}.png" width="24">
            <span><strong>${c.code}</strong> - ${c.name}</span>
        </div>`;
        fromList.insertAdjacentHTML('beforeend', itemFrom);
        toList.insertAdjacentHTML('beforeend', itemTo);
    });
}

function filterCurrencies(input, listId) {
    const filter = input.value.toUpperCase();
    const items = document.getElementById(listId).getElementsByClassName('dropdown-item');
    for (let i = 0; i < items.length; i++) {
        const txt = items[i].innerText || items[i].textContent;
        items[i].style.display = txt.toUpperCase().indexOf(filter) > -1 ? "" : "none";
    }
}

function selectCurrency(type, code, flag) {
    if (type === 'from') {
        selectedFrom = code;
        document.getElementById('from-code').innerText = code;
        document.getElementById('from-flag').src = `https://flagcdn.com/w40/${flag}.png`;
        document.getElementById('from-dropdown').classList.remove('show');
    } else {
        selectedTo = code;
        document.getElementById('to-code').innerText = code;
        document.getElementById('to-flag').src = `https://flagcdn.com/w40/${flag}.png`;
        document.getElementById('to-dropdown').classList.remove('show');
    }
}

function swapCurrencies() {
    const tempCode = selectedFrom;
    const tempFlag = document.getElementById('from-flag').src;
    
    selectedFrom = selectedTo;
    document.getElementById('from-code').innerText = selectedTo;
    document.getElementById('from-flag').src = document.getElementById('to-flag').src;

    selectedTo = tempCode;
    document.getElementById('to-code').innerText = tempCode;
    document.getElementById('to-flag').src = tempFlag;

    convertCurrency();
}

function quickConvert(from, to) {
    const fObj = currencies.find(c => c.code === from);
    const tObj = currencies.find(c => c.code === to);
    if(fObj && tObj) {
        selectCurrency('from', fObj.code, fObj.flag);
        selectCurrency('to', tObj.code, tObj.flag);
        scrollToSection('converter-sec');
        convertCurrency();
    }
}

// Live Exchange API Integration
async function convertCurrency() {
    const amount = parseFloat(document.getElementById('amount').value) || 1;
    const resultBox = document.getElementById('result');
    const resultText = document.getElementById('result-text');
    const rateUpdate = document.getElementById('rate-update');

    try {
        const res = await fetch(`https://open.er-api.com/v6/latest/${selectedFrom}`);
        const data = await res.json();

        if (data.result === "success") {
            const rate = data.rates[selectedTo];
            const total = (amount * rate).toFixed(2);

            resultText.innerText = `${amount} ${selectedFrom} = ${total} ${selectedTo}`;
            rateUpdate.innerText = `Exchange Rate: 1 ${selectedFrom} = ${rate.toFixed(4)} ${selectedTo}`;
            resultBox.style.display = 'block';
        } else {
            resultText.innerText = "Error fetching rates.";
        }
    } catch (e) {
        resultText.innerText = "Network Error. Please try again.";
        resultBox.style.display = 'block';
    }
}

// Metal & Precious Rates
async function fetchPreciousMetals() {
    const base = document.getElementById('metal-currency').value;
    try {
        const res = await fetch(`https://open.er-api.com/v6/latest/USD`);
        const data = await res.json();
        const baseRate = data.rates[base] || 1;

        // Approx standard base gold/silver prices in USD per Oz
        const goldOzUSD = 2350.00; 
        const silverOzUSD = 28.50;

        const goldGram = (goldOzUSD / 31.1035) * baseRate;
        const goldTola = goldGram * 11.6638;
        const silverTola = ((silverOzUSD / 31.1035) * baseRate) * 11.6638;

        document.getElementById('gold-tola-price').innerText = `${base} ${goldTola.toLocaleString('en-US', {maximumFractionDigits:0})}`;
        document.getElementById('gold-oz-sub').innerText = `Per Oz: ${base} ${(goldOzUSD * baseRate).toLocaleString('en-US', {maximumFractionDigits:0})}`;
        document.getElementById('gold-gram-price').innerText = `${base} ${goldGram.toFixed(2)}`;
        document.getElementById('gold-10g-price').innerText = `${base} ${(goldGram * 10).toFixed(2)}`;
        document.getElementById('silver-tola-price').innerText = `${base} ${silverTola.toFixed(2)}`;
    } catch (e) {
        document.getElementById('gold-tola-price').innerText = "Unable to load";
    }
}

// Crypto Tracker API
async function fetchCryptoRates() {
    const tbody = document.getElementById('crypto-table-body');
    try {
        const res = await fetch('https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=bitcoin,ethereum,binancecoin,solana,ripple&order=market_cap_desc');
        const data = await res.json();

        tbody.innerHTML = '';
        data.forEach(coin => {
            const row = `<tr>
                <td style="display:flex; align-items:center; gap:8px;">
                    <img src="${coin.image}" width="20">
                    <strong>${coin.name}</strong> (${coin.symbol.toUpperCase()})
                </td>
                <td>$${coin.current_price.toLocaleString()}</td>
                <td style="color:${coin.price_change_percentage_24h >= 0 ? '#10b981' : '#ef4444'}; font-weight:700;">
                    ${coin.price_change_percentage_24h.toFixed(2)}%
                </td>
                <td>$${coin.market_cap.toLocaleString()}</td>
            </tr>`;
            tbody.insertAdjacentHTML('beforeend', row);
        });
    } catch (e) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;">Crypto data update error.</td></tr>';
    }
}

// History Chart Renderer
function renderCurrencyChart() {
    const ctx = document.getElementById('rateHistoryChart');
    if (!ctx) return;

    if (chartInstance) chartInstance.destroy();

    const dummyData = [278, 278.5, 277.9, 278.2, 278.8, 279.1, 278.6];
    const labels = ['Day 1', 'Day 2', 'Day 3', 'Day 4', 'Day 5', 'Day 6', 'Day 7'];

    chartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Exchange Rate Trend',
                data: dummyData,
                borderColor: '#38bdf8',
                backgroundColor: 'rgba(56, 189, 248, 0.1)',
                fill: true,
                tension: 0.3
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } }
        }
    });
}

// Unit Converter Logic
const unitData = {
    length: { Meter: 1, Kilometer: 0.001, Mile: 0.000621371, Foot: 3.28084 },
    weight: { Kilogram: 1, Gram: 1000, Pound: 2.20462, Ounce: 35.274 },
    temp: { Celsius: 'C', Fahrenheit: 'F' },
    area: { 'Square Meter': 1, 'Square Feet': 10.7639, Acre: 0.000247105 }
};
let currentCategory = 'length';

function setUnitCategory(cat) {
    currentCategory = cat;
    const fromType = document.getElementById('unit-from-type');
    const toType = document.getElementById('unit-to-type');
    fromType.innerHTML = '';
    toType.innerHTML = '';

    Object.keys(unitData[cat]).forEach(u => {
        fromType.add(new Option(u, u));
        toType.add(new Option(u, u));
    });
    if (toType.options.length > 1) toType.selectedIndex = 1;
    calculateUnitConversion();
}

function initUnitConverter() {
    setUnitCategory('length');
}

function calculateUnitConversion() {
    const val = parseFloat(document.getElementById('unit-from-val').value) || 0;
    const from = document.getElementById('unit-from-type').value;
    const to = document.getElementById('unit-to-type').value;
    const out = document.getElementById('unit-to-val');

    if (currentCategory === 'temp') {
        if (from === 'Celsius' && to === 'Fahrenheit') out.value = ((val * 9/5) + 32).toFixed(2);
        else if (from === 'Fahrenheit' && to === 'Celsius') out.value = ((val - 32) * 5/9).toFixed(2);
        else out.value = val;
    } else {
        const base = val / unitData[currentCategory][from];
        out.value = (base * unitData[currentCategory][to]).toFixed(4);
    }
}

// EMI Calculator Logic
function calculateEMI() {
    const p = parseFloat(document.getElementById('emi-amount').value) || 0;
    const r = (parseFloat(document.getElementById('emi-rate').value) || 0) / 12 / 100;
    const n = (parseFloat(document.getElementById('emi-tenure').value) || 0) * 12;

    if (p > 0 && r > 0 && n > 0) {
        const emi = (p * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
        const totalPay = emi * n;
        const interest = totalPay - p;

        document.getElementById('emi-monthly').innerText = Math.round(emi).toLocaleString();
        document.getElementById('emi-total-interest').innerText = Math.round(interest).toLocaleString();
        document.getElementById('emi-total-pay').innerText = Math.round(totalPay).toLocaleString();
    }
}

// Income Tax Calculator Logic
function calculateTax() {
    const inc = parseFloat(document.getElementById('tax-income').value) || 0;
    const rule = document.getElementById('tax-rule').value;

    let monthlyTax = 0;
    if (rule === 'PKR') {
        const annual = inc * 12;
        if (annual > 600000) {
            monthlyTax = (annual - 600000) * 0.05 / 12;
        }
    } else {
        monthlyTax = inc * 0.10;
    }

    const takeHome = inc - monthlyTax;
    document.getElementById('tax-monthly').innerText = Math.round(monthlyTax).toLocaleString();
    document.getElementById('tax-annual').innerText = Math.round(monthlyTax * 12).toLocaleString();
    document.getElementById('tax-takehome').innerText = Math.round(takeHome).toLocaleString();
}

// AI Assistant Chat Logic
function sendAiMessage() {
    const input = document.getElementById('chat-input');
    const msg = input.value.trim();
    if (!msg) return;

    const box = document.getElementById('chat-box');
    box.insertAdjacentHTML('beforeend', `<div class="chat-msg msg-user">${msg}</div>`);
    input.value = '';

    setTimeout(() => {
        let reply = "I can help with live currency trends, conversion rates, gold prices, and tax rules. Please select a conversion tool from above for real-time rates!";
        if (msg.toLowerCase().includes('usd')) reply = "USD rates are dynamically synced via central exchange APIs. Use the converter above to see live updates.";
        box.insertAdjacentHTML('beforeend', `<div class="chat-msg msg-ai">${reply}</div>`);
        box.scrollTop = box.scrollHeight;
    }, 600);
}

// Load News Items
function loadNews() {
    const container = document.getElementById('news-container');
    if(!container) return;
    container.innerHTML = `
        <div class="seo-card" style="text-align:left;">
            <span style="font-size:12px; color:var(--accent-color);">Forex Market</span>
            <h4 style="margin:6px 0;">Central Banks Maintain Interest Rate Stance</h4>
            <p style="font-size:13px; color:var(--text-secondary);">Global currency markets show steady movements amidst shifting inflation indicators.</p>
        </div>
        <div class="seo-card" style="text-align:left;">
            <span style="font-size:12px; color:var(--gold-color);">Commodities</span>
            <h4 style="margin:6px 0;">Gold Surges Near Record Heights</h4>
            <p style="font-size:13px; color:var(--text-secondary);">Safe-haven demand pushes bullion rates higher in Asian trading sessions.</p>
        </div>
    `;
}

// Auth Handlers
function handleLogin(e) { e.preventDefault(); alert('Login successful!'); showAuthPage('home'); }
function handleSignup(e) { e.preventDefault(); alert('Registration successful!'); showAuthPage('login'); }
function handleLogout(e) { e.preventDefault(); alert('Logged out successfully.'); showAuthPage('home'); }
function sendEmail(e) { e.preventDefault(); alert('Message sent successfully!'); }
