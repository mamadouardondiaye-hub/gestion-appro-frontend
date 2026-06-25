// js/pages/loginPage.js
import { login, isLoggedIn } from "../services/userService.js";
import { showToast } from "../components/toast.js";
import { navigate } from "../router.js";

export function renderLoginPage() {
  if (isLoggedIn()) {
    navigate("categories");
    return;
  }

  const app = document.getElementById("app");
  
  app.innerHTML = `
    <div class="min-h-[80vh] flex items-center justify-center">
      <div class="w-full max-w-md rounded-3xl bg-white p-8 shadow-soft">
        <div class="text-center mb-8">
          <div class="mx-auto h-16 w-16 rounded-2xl bg-gradient-to-br from-indigo-600 to-cyan-500 flex items-center justify-center text-white text-2xl shadow-lg shadow-indigo-200">
            <i class="fa-solid fa-layer-group"></i>
          </div>
          <h2 class="mt-4 text-2xl font-black tracking-tight text-slate-950">
            Gestion Appro
          </h2>
          <p class="mt-1 text-sm text-slate-500">
            Connectez-vous à votre espace
          </p>
        </div>

        <form id="loginForm" class="space-y-4">
          <div>
            <label class="mb-2 block text-xs font-extrabold uppercase tracking-[0.14em] text-slate-500">
              Email
            </label>
            <input
              type="email"
              id="loginEmail"
              class="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
              placeholder="admin@gestion-appro.com"
              value="admin@gestion-appro.com"
              required
            />
          </div>

          <div>
            <label class="mb-2 block text-xs font-extrabold uppercase tracking-[0.14em] text-slate-500">
              Mot de passe
            </label>
            <input
              type="password"
              id="loginPassword"
              class="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
              placeholder="admin123"
              value="admin123"
              required
            />
            <p class="mt-1 hidden text-xs font-semibold text-rose-600" id="error_login"></p>
          </div>

          <button
            type="submit"
            class="w-full rounded-2xl bg-gradient-to-br from-indigo-600 to-indigo-700 px-4 py-3 text-sm font-extrabold text-white transition hover:shadow-lg hover:shadow-indigo-200"
          >
            <i class="fa-solid fa-arrow-right-to-bracket mr-2"></i>
            Se connecter
          </button>
        </form>

        <div class="mt-6 text-center text-xs text-slate-400 border-t border-slate-100 pt-4">
          <p>Admin : admin@gestion-appro.com / admin123</p>
          <p class="mt-1">Fournisseur : fournisseur1@email.com / fournisseur123</p>
        </div>
      </div>
    </div>
  `;

  document.getElementById("loginForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    
    const email = document.getElementById("loginEmail").value;
    const password = document.getElementById("loginPassword").value;
    const errorEl = document.getElementById("error_login");
    
    try {
      await login(email, password);
      showToast("Connexion réussie !", "success");
      navigate("categories");
    } catch (error) {
      errorEl.textContent = error.message;
      errorEl.classList.remove("hidden");
      showToast(error.message, "error");
    }
  });
}