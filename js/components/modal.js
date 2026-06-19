// js/components/modal.js
import { escapeHtml } from "../utils/html.js";

function closeModal() {
  document.getElementById("modalRoot").innerHTML = "";
}

export function openModal({ title, icon = "fa-circle-info", body, confirmLabel = "Confirmer", cancelLabel = "Annuler", onConfirm }) {
  const root = document.getElementById("modalRoot");

  root.innerHTML = `
    <div id="modalBackdrop" class="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm">
      <div class="w-full max-w-lg rounded-[2rem] bg-white p-7 shadow-soft">
        <div class="mb-5 flex items-center gap-3">
          <div class="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
            <i class="fa-solid ${escapeHtml(icon)}"></i>
          </div>
          <h2 class="text-xl font-black tracking-tight text-slate-950">${escapeHtml(title)}</h2>
        </div>
        <div id="modalBody">${body}</div>
        <div class="mt-7 flex justify-end gap-3">
          <button id="modalCancelBtn" class="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-extrabold text-slate-600 transition hover:bg-slate-50">${escapeHtml(cancelLabel)}</button>
          <button id="modalConfirmBtn" class="rounded-2xl bg-indigo-600 px-4 py-2.5 text-sm font-extrabold text-white transition hover:bg-indigo-700">${escapeHtml(confirmLabel)}</button>
        </div>
      </div>
    </div>
  `;

  const backdrop = document.getElementById("modalBackdrop");
  const confirmBtn = document.getElementById("modalConfirmBtn");
  const cancelBtn = document.getElementById("modalCancelBtn");

  backdrop.addEventListener("click", (e) => { if (e.target === backdrop) closeModal(); });
  cancelBtn.addEventListener("click", closeModal);

  confirmBtn.addEventListener("click", async () => {
    confirmBtn.disabled = true;
    const original = confirmBtn.textContent;
    confirmBtn.textContent = "Patientez...";
    try {
      const success = await onConfirm(root);
      if (success !== false) closeModal();
    } finally {
      confirmBtn.disabled = false;
      confirmBtn.textContent = original;
    }
  });
}

export function openConfirm({ title = "Confirmation", message, confirmLabel = "Confirmer", onConfirm }) {
  openModal({
    title,
    icon: "fa-triangle-exclamation",
    body: `<p class="text-sm leading-6 text-slate-600">${escapeHtml(message)}</p>`,
    confirmLabel,
    onConfirm: async () => {
      await onConfirm();
      return true;
    }
  });
}