// State Management
let state = {
    customers: [], // Array of { id, name, phone, balance, transactions: [] }
    selectedTxType: 'credit'
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
}

function saveToLocalStorage() {
    localStorage.setItem('digital_khata_state', JSON.stringify(state.customers));
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

        const custCard = document.createElement('div');
        custCard.className = 'bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col gap-3';
        custCard.innerHTML = `
            <div class="flex justify-between items-start">
                <div>
                    <h3 class="font-bold text-slate-800">${cust.name}</h3>
                    <p class="text-xs text-slate-500 flex items-center gap-1">
                        <i class="fa-solid fa-phone text-[10px]"></i> ${cust.phone}
                    </p>
                </div>
                <div class="text-right">
                    <p class="text-xs text-slate-400 uppercase font-semibold">Balance</p>
                    <p class="text-lg font-black ${balance > 0 ? 'text-rose-600' : 'text-emerald-600'}">
                        ₹${Math.abs(balance)} ${balance >= 0 ? '<span class="text-xs font-normal text-rose-500">Due</span>' : '<span class="text-xs font-normal text-emerald-500">Advance</span>'}
                    </p>
                </div>
            </div>
            
            <div class="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
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
    const note = document.getElementById('tx-note').value || 'No details';
    const type = document.getElementById('tx-type').value;

    const customerIndex = state.customers.findIndex(c => c.id === custId);
    if (customerIndex === -1) return;

    const tx = {
        id: 'tx_' + Date.now(),
        amount: amount,
        note: note,
        type: type, // 'credit' (customer owes) or 'payment' (customer paid)
        date: new Date().toLocaleDateString()
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

// Send WhatsApp Reminder Deep Link
function sendReminder(custId) {
    const cust = state.customers.find(c => c.id === custId);
    if (!cust) return;

    const storeName = "Our Kirana Store"; // Customize as needed
    let message = "";

    if (cust.balance > 0) {
        message = `Dear ${cust.name},\nYour outstanding balance at *${storeName}* is *₹${cust.balance}*. Please settle this at your earliest convenience. You can pay digitally via UPI. Thank you!`;
    } else if (cust.balance < 0) {
        message = `Dear ${cust.name},\nYour account has an advance balance of *₹${Math.abs(cust.balance)}* at *${storeName}*. Thank you!`;
    } else {
        message = `Dear ${cust.name},\nYour account balance with *${storeName}* is completely clear (₹0). Thank you for shopping with us!`;
    }

    const whatsappUrl = `https://api.whatsapp.com/send?phone=${cust.phone}&text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
}

// Backup & Restore Utilities (Allows shopkeepers to move data safely)
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
  
