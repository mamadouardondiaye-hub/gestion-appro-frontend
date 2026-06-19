// js/components/toast.js
export function showToast(message, type = "success") {
  const container = document.getElementById("toastContainer");
  if (!container) return;

  const toast = document.createElement("div");
  
  let bgColors = "bg-emerald-50 text-emerald-800 border-emerald-200";
  let icon = "fa-circle-check text-emerald-500";

  if (type === "error") {
    bgColors = "bg-rose-50 text-rose-800 border-rose-200";
    icon = "fa-circle-xmark text-rose-500";
  } else if (type === "info") {
    bgColors = "bg-indigo-50 text-indigo-800 border-indigo-200";
    icon = "fa-circle-info text-indigo-500";
  }

  toast.className = `flex items-center gap-3 rounded-2xl border p-4 shadow-xl transition-all duration-300 transform translate-y-2 opacity-0 pointer-events-auto max-w-sm ${bgColors}`;
  
  toast.innerHTML = `
    <i class="fa-solid ${icon} text-sm shrink-0"></i>
    <p class="text-sm font-semibold leading-tight">${message}</p>
  `;

  container.appendChild(toast);

  requestAnimationFrame(() => {
    toast.classList.remove("translate-y-2", "opacity-0");
  });

  setTimeout(() => {
    toast.classList.add("translate-y-2", "opacity-0");
    toast.addEventListener("transitionend", () => {
      toast.remove();
    });
  }, 4000);
}