// js/router.js
import { showToast } from "./components/toast.js";
import { renderCategoriesPage } from "./pages/categoriesPage.js";
import { renderProduitsPage } from "./pages/produitsPage.js";
import { renderLoginPage } from "./pages/loginPage.js";
import { renderUsersPage } from "./pages/usersPage.js";
import { isLoggedIn, getCurrentUser } from "./services/userService.js";
import { renderSidebar, initSidebarEvents } from "./components/sidebar.js";
import { renderNavbar } from "./components/navbar.js";

const routes = {
  login: renderLoginPage,
  categories: renderCategoriesPage,
  produits: renderProduitsPage,
  users: renderUsersPage,
};

const titles = {
  login: "Connexion",
  categories: "Catégories",
  produits: "Produits",
  users: "Utilisateurs",
};

function mountLayout() {
  const sidebarRoot = document.getElementById("sidebarRoot");
  const navbarRoot = document.getElementById("navbarRoot");
  const mainWrapper = sidebarRoot.nextElementSibling;

  sidebarRoot.innerHTML = renderSidebar();
  navbarRoot.innerHTML = renderNavbar();
  mainWrapper.classList.add("lg:pl-72");
  initSidebarEvents();

  document.querySelectorAll("[data-page]").forEach((button) => {
    button.addEventListener("click", async () => {
      await navigate(button.dataset.page);
    });
  });
}

function unmountLayout() {
  const sidebarRoot = document.getElementById("sidebarRoot");
  const navbarRoot = document.getElementById("navbarRoot");
  const mainWrapper = sidebarRoot.nextElementSibling;

  sidebarRoot.innerHTML = "";
  navbarRoot.innerHTML = "";
  mainWrapper.classList.remove("lg:pl-72");
}

export async function navigate(page = "categories", addToHistory = true) {
  const app = document.getElementById("app");

  // Pages publiques (pas besoin d'être connecté)
  const publicPages = ["login"];
  const isPublic = publicPages.includes(page);

  // Si la page est protégée et l'utilisateur n'est pas connecté
  if (!isPublic && !isLoggedIn()) {
    page = "login";
  }

  // 🔥 Vérifier les droits d'accès
  // Les fournisseurs ne peuvent pas accéder aux catégories et aux utilisateurs
  const user = getCurrentUser();
  if (user && user.role === "fournisseur") {
    if (page === "categories" || page === "users") {
      showToast("Accès refusé. Vous n'avez pas les droits pour accéder à cette page.", "error");
      page = "produits";
    }
  }

  // Vérifier si la page existe, sinon rediriger vers categories
  const targetPage = routes[page] ? page : "categories";
  const route = routes[targetPage];

  // Gérer l'affichage du layout (sidebar + navbar)
  // La page de login n'a pas de layout
  if (targetPage === "login") {
    unmountLayout();
  } else {
    // Si la sidebar n'existe pas encore, on monte le layout
    if (!document.getElementById("sidebar")) {
      mountLayout();
    }
  }

  // Mettre à jour l'URL dans la barre d'adresse
  if (addToHistory) {
    const newUrl = `${window.location.pathname}?page=${targetPage}`;
    window.history.pushState({ page: targetPage }, "", newUrl);
  }

  // Mettre à jour l'état actif de la sidebar
  document.querySelectorAll("[data-page]").forEach((button) => {
    const isActive = button.dataset.page === targetPage;
    button.classList.toggle("bg-slate-950", isActive);
    button.classList.toggle("text-white", isActive);
    button.classList.toggle("shadow-lg", isActive);
    button.classList.toggle("shadow-slate-200", isActive);
    button.classList.toggle("text-slate-600", !isActive);
    button.classList.toggle("hover:bg-slate-100", !isActive);
    button.classList.toggle("hover:text-slate-950", !isActive);
  });

  // Mettre à jour le titre dans la navbar
  const navbarTitle = document.getElementById("navbarTitle");
  if (navbarTitle) {
    navbarTitle.textContent = titles[targetPage] || titles.categories;
  }

  // Afficher le loader pendant le chargement
  app.innerHTML = `
    <div class="grid min-h-[50vh] place-items-center rounded-[2rem] border border-slate-200 bg-white p-10 text-center shadow-sm">
      <div>
        <div class="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-indigo-600"></div>
        <p class="mt-4 text-sm font-bold text-slate-500">Chargement...</p>
      </div>
    </div>
  `;

  // Exécuter la fonction de la page
  try {
    await route();
  } catch (error) {
    console.error("Router error:", error);
    app.innerHTML = `
      <section class="rounded-[2rem] border border-rose-200 bg-white p-8 shadow-sm">
        <div class="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-100 text-rose-600">
          <i class="fa-solid fa-triangle-exclamation"></i>
        </div>
        <h1 class="text-2xl font-black tracking-tight text-slate-950">Erreur de chargement</h1>
        <p class="mt-2 text-sm leading-6 text-rose-600">${error.message}</p>
      </section>
    `;
    showToast(error.message, "error");
  }
}

// Gestion des boutons "Précédent" / "Suivant" du navigateur
window.addEventListener("popstate", (event) => {
  const page = event.state?.page || "categories";
  navigate(page, false);
});