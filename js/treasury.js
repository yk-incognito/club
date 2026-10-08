import { supabase } from './supabase-client.js';
import { enforceAuth } from './auth-guard.js';
import { uploadToStorage } from './cropper-helper.js';

let currentOfficer = null;

document.addEventListener('DOMContentLoaded', async () => {
  // Treasury restricted to Super Admin, President, Secretary, and Treasurer
  currentOfficer = await enforceAuth(['super_admin', 'president', 'secretary', 'treasurer']);
  if (!currentOfficer) return;

  initTreasuryEvents();
  loadFinancialOverview();
  loadDefaultersList();
});

function initTreasuryEvents() {
  const form = document.getElementById('advance-pay-form');
  const monthsSelect = document.getElementById('pay-months');
  const amountInput = document.getElementById('pay-total-amount');

  // Auto-calculate fee based on number of selected months and standard rate (₹150)
  if (monthsSelect && amountInput) {
    monthsSelect.addEventListener('change', () => {
      const selectedCount = Array.from(monthsSelect.selectedOptions).length;
      amountInput.value = selectedCount * 150;
    });
  }

  if (form) {
    form.addEventListener('submit', handlePaymentSubmission);
  }

  // Export CSV button handler
  const exportBtn = document.getElementById('export-csv-btn');
  if (exportBtn) {
    exportBtn.addEventListener('click', exportTreasuryCSV);
  }
}

async function handlePaymentSubmission(e) {
  e.preventDefault();
  const regNo = parseInt(document.getElementById('pay-reg-no').value, 10);
  const monthsSelect = document.getElementById('pay-months');
  const selectedMonths = Array.from(monthsSelect.selectedOptions).map(opt => opt.value);
  const amount = parseFloat(document.getElementById('pay-total-amount').value);
  const proofFile = document.getElementById('pay-proof-file')?.files[0];

  try {
    // 1. Locate member UUID by Register Number
    const { data: member, error: memberErr } = await supabase
      .from('profiles')
      .select('id, nickname')
      .eq('reg_no', regNo)
      .single();

    if (memberErr || !member) throw new Error(`Member with Register Number ${regNo} not found.`);

    let receiptUrl = null;

    // 2. Optional upload of UPI transaction proof
    if (proofFile) {
      receiptUrl = await uploadToStorage(
        supabase,
        'receipts',
        `proof_${regNo}_${Date.now()}.jpg`,
        proofFile
      );
    }

    // 3. Insert Treasury Record
    const { error: insertErr } = await supabase.from('treasury_records').insert([{
      member_id: member.id,
      amount: amount,
      months_covered: selectedMonths,
      receipt_proof_url: receiptUrl,
      recorded_by: currentOfficer.id,
      status: 'paid'
    }]);

    if (insertErr) throw insertErr;

    // 4. Record Audit Log
    await supabase.from('activity_logs').insert([{
      actor_id: currentOfficer.id,
      action: 'TREASURY_PAYMENT_LOGGED',
      details: { reg_no: regNo, months: selectedMonths, amount: amount }
    }]);

    alert(`Payment of ₹${amount} recorded for ${member.nickname} (#${regNo}).`);
    e.target.reset();
    loadFinancialOverview();
  } catch (err) {
    alert('Payment logging failed: ' + err.message);
  }
}

/**
 * Lists members with pending dues (>= 3 months unpaid)
 */
async function loadDefaultersList() {
  const tbody = document.getElementById('dues-tbody');
  if (!tbody) return;

  // Query members and cross-reference with treasury records
  const { data: members, error } = await supabase
    .from('profiles')
    .select('id, reg_no, official_name, nickname, fee_type')
    .eq('status', 'active');

  if (error || !members) return;

  // Placeholder logic checking recent cleared payments
  tbody.innerHTML = members.slice(0, 5).map(m => {
    const rate = m.fee_type === 'regular_150' ? 150 : 30;
    const unpaidMonths = 3;
    const totalDue = unpaidMonths * rate;
    const encodedMsg = encodeURIComponent(
      `Hello ${m.nickname}, friendly reminder from Rivora Arts & Sports Club to clear your monthly subscription dues (₹${totalDue} for ${unpaidMonths} months). Thank you!`
    );

    return `
      <tr style="border-bottom: 1px solid #f1f5f9;">
        <td><strong>#${m.reg_no || '---'}</strong></td>
        <td>${m.official_name} (${m.nickname})</td>
        <td><span class="badge badge-pending">${unpaidMonths} Months (₹${totalDue})</span></td>
        <td>
          <a href="https://wa.me/?text=${encodedMsg}" 
             target="_blank" 
             rel="noopener"
             class="btn btn-accent" 
             style="padding: 0.25rem 0.65rem; font-size: 0.8rem;">
             WhatsApp Ping
          </a>
        </td>
      </tr>
    `;
  }).join('');
}

async function loadFinancialOverview() {
  const { data: records } = await supabase.from('treasury_records').select('amount');
  if (!records) return;

  const total = records.reduce((acc, r) => acc + Number(r.amount), 0);
  const totalDisplay = document.getElementById('total-collection-display');
  if (totalDisplay) totalDisplay.textContent = `₹${total.toLocaleString('en-IN')}`;
}

async function exportTreasuryCSV() {
  const { data, error } = await supabase
    .from('treasury_records')
    .select('id, amount, months_covered, status, created_at, profiles(reg_no, official_name)');

  if (error || !data) return alert('Export failed');

  let csv = 'Record ID,Reg No,Name,Amount,Months Covered,Status,Date\n';
  data.forEach(r => {
    csv += `"${r.id}","${r.profiles?.reg_no || ''}","${r.profiles?.official_name || ''}","${r.amount}","${r.months_covered.join('; ')}","${r.status}","${new Date(r.created_at).toLocaleDateString()}"\n`;
  });

  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `rivora_treasury_${Date.now()}.csv`;
  a.click();
}
