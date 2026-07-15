// State Management
let state = {
    customers: [], // Array of { id, name, phone, balance, transactions: [] }
    selectedTxType: 'credit',
    shopName: 'My Kirana Store' // Default placeholder name
};

// Initialize App
window.addEventListener('DOMContentLoaded', () => {
    loadFromLocalStorage();
    renderDOM();
});

// Load & Save Helpers
function loadFromLocalStorage() {
    const saved = localStorage.getItem('digital_khata_state');
    if (saved) {
        state.customers = JSON.parse(saved);
    }
    
    // Retrieve custom shop name
    const savedShopName = localStorage.getItem('digital_khata_shop_name');
    if (savedShopName) {
        state.shopName = savedShopName;
    }
    
    // Put current shop name into header text box
    document.getElementById('shop-name-input').value = state.shopName;
}

function saveToLocalStorage() {
    localStorage.setItem('digital_khata_state', JSON.stringify(state.customers));
}

// Save Custom Shop Name Real-Time
function saveShopName() {
    const nameValue = document.getElementById('shop-name-input').value.trim();
    state.shopName = nameValue || 'My Kirana Store';
    localStorage.setItem('digital_khata_shop_name', state.shopName);
}

// Modal Toggle Utility
function toggleModal(modalId, show) {
    const modal = document.getElementById(modalId);
    if (show) {
        modal.classList.remove('hidden');
        modal.classList.add('flex');
    } else {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }
}

// Format Dates Cleanly (DD/MM/YYYY)
function formatDate(dateString) {
    if (!dateString) return '';
    const [year, month, day] = dateString.split('-');
    return `${day}/${month}/${year}`;
}

// Render DOM
function renderDOM() {
    const listElement = document.getElementById('customer-list');
    const totalElement = document.getElementById('total-outstanding');
    
    listElement.innerHTML = '';
    let totalOutstanding = 0;

    if (state.customers.length === 0) {
        listElement.innerHTML = `
            <div class="text-center py-12 px-4 bg-white rounded-2xl border border-dashed border-slate-200">
                <i class="fa-solid fa-users text-4xl text-slate-300 mb-3"></i>
                <p class="text-slate-500 font-medium">No customers added yet.</p>
                <p class="text-xs text-slate-400 mt-1">Tap "New Customer" to start tracking credit.</p>
            </div>
        `;
        totalElement.innerText = "₹0";
        return;
    }

    state.customers.forEach(cust => {
        const balance = cust.balance || 0;
        if (balance > 0) totalOutstanding += balance;

        // Build transaction history HTML snippet to display inside each customer card
        let historyHtml = '';
        if (cust.transactions && cust.transactions.length > 0) {
            // Sort to show latest transactions first
            const sortedTx = [...cust.transactions].sort((a, b) => b.id.localeCompare(a.id)).slice(0, 3);
            
            historyHtml = `
                <div class="mt-3 pt-3 border-t border-slate-100">
                    <p class="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1.5">Recent History</p>
                    <div class="space-y-1.5">
                        ${sortedTx.map(tx => `
                            <div class="flex justify-between text-xs text-slate-600">
                                <span class="truncate max-w-[180px]">
                                    <span class="text-slate-400 font-semibold">${formatDate(tx.date)}</span>: ${tx.note}
                                </span>
                                <span class="${tx.type === 'credit' ? 'text-rose-600 font-semibold' : 'text-emerald-600 font-semibold'}">
                                    ${tx.type === 'credit' ? '+' : '-'}₹${tx.amount}
                                </span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }

        const custCard = document.createElement('div');
        custCard.className = 'bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col gap-2';
        custCard.innerHTML = `
            <div class="flex justify-between items-start">
                <div>
                    <h3 class="font-bold text-slate-800">${cust.name}</h3>
                    <p class="text-xs text-slate-500 flex items-center gap-1">
                        <i class="fa-solid fa-phone text-[10px]"></i> ${cust.phone}
                    </p>
                </div>
                <div class="text-right">
                    <p class="text-xs text-slate-400 uppercase font-semibold text-[10px]">Balance</p>
                    <p class="text-lg font-black ${balance > 0 ? 'text-rose-600' : 'text-emerald-600'}">
                        ₹${Math.abs(balance)} ${balance >= 0 ? '<span class="text-xs font-normal text-rose-500">Due</span>' : '<span class="text-xs font-normal text-emerald-500">Advance</span>'}
                    </p>
                </div>
            </div>
            
            <!-- Render Dynamic Recent History -->
            ${historyHtml}
            
            <div class="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 mt-2">
                <button onclick="openTxModal('${cust.id}', '${cust.name}')" class="bg-slate-100 text-slate-700 py-2 rounded-lg text-xs font-bold hover:bg-slate-200 active:scale-95 transition flex items-center justify-center gap-1">
                    <i class="fa-solid fa-indian-rupee-sign"></i> Log Entry
                </button>
                <button onclick="sendReminder('${cust.id}')" class="bg-emerald-50 text-emerald-700 py-2 rounded-lg text-xs font-bold hover:bg-emerald-100 active:scale-95 transition flex items-center justify-center gap-1">
                    <i class="fa-brands fa-whatsapp text-sm"></i> Send Reminder
                </button>
            </div>
        `;
        listElement.appendChild(custCard);
    });

    totalElement.innerText = `₹${totalOutstanding}`;
}

// Add Customer
function handleAddCustomer(e) {
    e.preventDefault();
    const name = document.getElementById('cust-name').value;
    const phone = document.getElementById('cust-phone').value.replace(/\D/g,''); // strip non-digits

    const newCust = {
        id: 'cust_' + Date.now(),
        name: name,
        phone: phone,
        balance: 0,
        transactions: []
    };

    state.customers.push(newCust);
    saveToLocalStorage();
    renderDOM();

    // Reset Form & Close
    e.target.reset();
    toggleModal('add-customer-modal', false);
}

// Transaction Handling
function openTxModal(custId, custName) {
    document.getElementById('tx-cust-id').value = custId;
    document.getElementById('tx-modal-subtitle').innerText = `Add entry for ${custName}`;
    
    // Auto-populate transaction date field with "Today's Date" in YYYY-MM-DD
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('tx-date').value = today;
    
    setTxType('credit'); // default to credit/udhaar
    toggleModal('add-transaction-modal', true);
}

function setTxType(type) {
    state.selectedTxType = type;
    document.getElementById('tx-type').value = type;
    const btnCredit = document.getElementById('btn-credit');
    const btnPayment = document.getElementById('btn-payment');

    if (type === 'credit') {
        btnCredit.className = "py-3 rounded-lg font-bold border-2 border-rose-500 text-rose-500 bg-rose-50 flex flex-col items-center justify-center gap-1";
        btnPayment.className = "py-3 rounded-lg font-bold border-2 border-slate-200 text-slate-400 hover:bg-slate-50 flex flex-col items-center justify-center gap-1";
    } else {
        btnCredit.className = "py-3 rounded-lg font-bold border-2 border-slate-200 text-slate-400 hover:bg-slate-50 flex flex-col items-center justify-center gap-1";
        btnPayment.className = "py-3 rounded-lg font-bold border-2 border-emerald-500 text-emerald-500 bg-emerald-50 flex flex-col items-center justify-center gap-1";
    }
}

function handleAddTransaction(e) {
    e.preventDefault();
    const custId = document.getElementById('tx-cust-id').value;
    const amount = parseFloat(document.getElementById('tx-amount').value);
    const note = document.getElementById('tx-note').value;
    const type = document.getElementById('tx-type').value;
    const selectedDate = document.getElementById('tx-date').value; 

    const customerIndex = state.customers.findIndex(c => c.id === custId);
    if (customerIndex === -1) return;

    const tx = {
        id: 'tx_' + Date.now(),
        amount: amount,
        note: note,
        type: type, // 'credit' (customer owes) or 'payment' (customer paid)
        date: selectedDate
    };

    // Calculate new balance
    if (type === 'credit') {
        state.customers[customerIndex].balance += amount;
    } else {
        state.customers[customerIndex].balance -= amount;
    }

    state.customers[customerIndex].transactions.push(tx);
    saveToLocalStorage();
    renderDOM();

    e.target.reset();
    toggleModal('add-transaction-modal', false);
}

// Send WhatsApp Detailed Reminder Deep Link
function sendReminder(custId) {
    const cust = state.customers.find(c => c.id === custId);
    if (!cust) return;

    // Pull custom shop name directly from saved state
    const activeShopName = state.shopName; 
    let message = `*Statement of Account* - *${activeShopName}*\n`;
    message += `Dear *${cust.name}*,\n\n`;

    if (cust.transactions && cust.transactions.length > 0) {
        message += `Here is a breakdown of your recent ledger transactions:\n`;
        message += `--------------------------------------\n`;
        
        // Loop through and print item description, date, price/type
        cust.transactions.forEach(tx => {
            const dateFormatted = formatDate(tx.date);
            const typeLabel = tx.type === 'credit' ? 'Due' : 'Paid';
            message += `📅 *${dateFormatted}*\n🛍️ Item: _${tx.note}_\n💵 Amount: ₹${tx.amount} (${typeLabel})\n\n`;
        });
        
        message += `--------------------------------------\n`;
    }

    if (cust.balance > 0) {
        message += `*Total Due Balance: ₹${cust.balance}*\n\n`;
        message += `Please settle this at your earliest convenience via cash or UPI. Thank you!`;
    } else if (cust.balance < 0) {
        message += `*Total Advance Balance: ₹${Math.abs(cust.balance)}*\n\n`;
        message += `Your account has advance credit. Thank you for shopping with us!`;
    } else {
        message += `*Total Due Balance: ₹0*\n\n`;
        message += `Your account ledger is completely clear! Thank you!`;
    }

    const whatsappUrl = `https://api.whatsapp.com/send?phone=${cust.phone}&text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
}

// Backup & Restore Utilities
function exportData() {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state.customers, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `digital_khata_backup_${new Date().toISOString().slice(0,10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
}

function importData(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const importedData = JSON.parse(e.target.result);
            if (Array.isArray(importedData)) {
                state.customers = importedData;
                saveToLocalStorage();
                renderDOM();
                alert('Backup restored successfully!');
            } else {
                alert('Invalid backup file format.');
            }
        } catch (err) {
            alert('Failed to read file. Make sure it is a valid JSON file.');
        }
    };
    reader.readAsText(file);
              }
          
