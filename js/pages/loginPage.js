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
              required
            />
            <p class="mt-1 hidden text-xs font-semibold text-rose-600" id="error_email"></p>
          </div>

          <div>
            <label class="mb-2 block text-xs font-extrabold uppercase tracking-[0.14em] text-slate-500">
              Mot de passe
            </label>
            <input
              type="password"
              id="loginPassword"
              class="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
              placeholder="••••••••"
              required
            />
            <p class="mt-1 hidden text-xs font-semibold text-rose-600" id="error_password"></p>
          </div>

          <p class="hidden text-xs font-semibold text-rose-600 text-center" id="error_login"></p>

          <button
            type="submit"
            id="loginBtn"
            class="w-full rounded-2xl bg-gradient-to-br from-indigo-600 to-indigo-700 px-4 py-3 text-sm font-extrabold text-white transition hover:shadow-lg hover:shadow-indigo-200"
          >
            <i class="fa-solid fa-arrow-right-to-bracket mr-2"></i>
            Se connecter
          </button>
        </form>
      </div>
    </div>
  `;

  document.getElementById("loginForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    
    const email = document.getElementById("loginEmail").value.trim();
    const password = document.getElementById("loginPassword").value.trim();
    const errorEmail = document.getElementById("error_email");
    const errorPassword = document.getElementById("error_password");
    const errorLogin = document.getElementById("error_login");
    const loginBtn = document.getElementById("loginBtn");
    
    // Réinitialiser les erreurs
    errorEmail.classList.add("hidden");
    errorPassword.classList.add("hidden");
    errorLogin.classList.add("hidden");
    
    // Validation des champs
    let hasError = false;
    
    if (!email) {
      errorEmail.textContent = "L'email est obligatoire.";
      errorEmail.classList.remove("hidden");
      hasError = true;
    } else if (!email.includes("@") || !email.includes(".")) {
      errorEmail.textContent = "Veuillez entrer un email valide.";
      errorEmail.classList.remove("hidden");
      hasError = true;
    }
    
    if (!password) {
      errorPassword.textContent = "Le mot de passe est obligatoire.";
      errorPassword.classList.remove("hidden");
      hasError = true;
    } else if (password.length < 6) {
      errorPassword.textContent = "Le mot de passe doit contenir au moins 6 caractères.";
      errorPassword.classList.remove("hidden");
      hasError = true;
    }
    
    if (hasError) return;
    
    // Désactiver le bouton pendant la connexion
    loginBtn.disabled = true;
    loginBtn.textContent = "Connexion...";
    
    try {
      await login(email, password);
      showToast("Connexion réussie !", "success");
      navigate("categories");
    } catch (error) {
      errorLogin.textContent = error.message;
      errorLogin.classList.remove("hidden");
    } finally {
      loginBtn.disabled = false;
      loginBtn.innerHTML = `<i class="fa-solid fa-arrow-right-to-bracket mr-2"></i> Se connecter`;
    }
  });
}