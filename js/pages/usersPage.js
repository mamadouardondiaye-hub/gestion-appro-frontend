// js/pages/usersPage.js
import { pageHeader } from "../components/pageHeader.js";
import { renderTable } from "../components/table.js";
import { openModal, openConfirm } from "../components/modal.js";
import { showToast } from "../components/toast.js";
import { escapeHtml } from "../utils/html.js";
import { validateForm } from "../utils/validators.js";
import { 
  getUsers, 
  createUser, 
  updateUser, 
  deleteUser,
  isAdmin 
} from "../services/userService.js";
import { navigate } from "../router.js";

// js/pages/usersPage.js - Modifier la fonction userFormBody
function userFormBody(user = null) {
  return `
    <div class="space-y-4">
      <div>
        <label class="mb-2 block text-xs font-extrabold uppercase tracking-[0.14em] text-slate-500">
          Email *
        </label>
        <input
          type="email"
          id="userEmail"
          class="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-800 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
          value="${escapeHtml(user?.email || "")}"
          placeholder="fournisseur@email.com"
          required
        />
        <p class="mt-1 hidden text-xs font-semibold text-rose-600" id="error_email"></p>
      </div>

      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="mb-2 block text-xs font-extrabold uppercase tracking-[0.14em] text-slate-500">
            Nom *
          </label>
          <input
            type="text"
            id="userNom"
            class="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-800 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
            value="${escapeHtml(user?.nom || "")}"
            placeholder="Diop"
          />
          <p class="mt-1 hidden text-xs font-semibold text-rose-600" id="error_nom"></p>
        </div>
        <div>
          <label class="mb-2 block text-xs font-extrabold uppercase tracking-[0.14em] text-slate-500">
            Prénom *
          </label>
          <input
            type="text"
            id="userPrenom"
            class="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-800 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
            value="${escapeHtml(user?.prenom || "")}"
            placeholder="Aliou"
          />
          <p class="mt-1 hidden text-xs font-semibold text-rose-600" id="error_prenom"></p>
        </div>
      </div>

      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="mb-2 block text-xs font-extrabold uppercase tracking-[0.14em] text-slate-500">
            Téléphone *
          </label>
          <input
            type="tel"
            id="userTelephone"
            class="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-800 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
            value="${escapeHtml(user?.telephone || "")}"
            placeholder="771234567"
          />
          <p class="mt-1 hidden text-xs font-semibold text-rose-600" id="error_telephone"></p>
        </div>
        <div>
          <label class="mb-2 block text-xs font-extrabold uppercase tracking-[0.14em] text-slate-500">
            Rôle *
          </label>
          <select
            id="userRole"
            class="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-800 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
          >
            <option value="fournisseur" ${user?.role === "fournisseur" ? "selected" : ""}>
              Fournisseur
            </option>
            <option value="admin" ${user?.role === "admin" ? "selected" : ""}>
              Administrateur
            </option>
          </select>
          <p class="mt-1 hidden text-xs font-semibold text-rose-600" id="error_role"></p>
        </div>
      </div>

      <div>
        <label class="mb-2 block text-xs font-extrabold uppercase tracking-[0.14em] text-slate-500">
          Adresse
        </label>
        <input
          type="text"
          id="userAdresse"
          class="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-800 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
          value="${escapeHtml(user?.adresse || "")}"
          placeholder="Dakar, Sénégal"
        />
      </div>

      ${!user ? `
        <div>
          <label class="mb-2 block text-xs font-extrabold uppercase tracking-[0.14em] text-slate-500">
            Mot de passe *
          </label>
          <input
            type="password"
            id="userPassword"
            class="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-800 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
            placeholder="•••••••• (min 6 caractères)"
          />
          <p class="mt-1 hidden text-xs font-semibold text-rose-600" id="error_password"></p>
          <p class="mt-1 text-xs text-slate-400">Minimum 6 caractères</p>
        </div>
      ` : ""}
    </div>
  `;
}

// js/pages/usersPage.js - Modifier la fonction openUserForm
function openUserForm(user = null) {
  openModal({
    title: user ? "Modifier l'utilisateur" : "Nouvel utilisateur",
    icon: "fa-user",
    body: userFormBody(user),
    confirmLabel: user ? "Enregistrer" : "Créer",
    onConfirm: async (modal) => {
      const email = modal.querySelector("#userEmail").value.trim();
      const nom = modal.querySelector("#userNom").value.trim();
      const prenom = modal.querySelector("#userPrenom").value.trim();
      const telephone = modal.querySelector("#userTelephone").value.trim();
      const role = modal.querySelector("#userRole").value;
      const adresse = modal.querySelector("#userAdresse").value.trim();
      const password = modal.querySelector("#userPassword")?.value || "";

      // Réinitialiser les erreurs
      modal.querySelectorAll("[id^='error_']").forEach(el => {
        el.classList.add("hidden");
        el.textContent = "";
      });

      let hasError = false;

      // Validation Email
      if (!email) {
        const errEl = modal.querySelector("#error_email");
        if (errEl) { errEl.textContent = "L'email est obligatoire."; errEl.classList.remove("hidden"); }
        hasError = true;
      } else if (!email.includes("@") || !email.includes(".")) {
        const errEl = modal.querySelector("#error_email");
        if (errEl) { errEl.textContent = "Veuillez entrer un email valide."; errEl.classList.remove("hidden"); }
        hasError = true;
      }

      // Validation Nom
      if (!nom) {
        const errEl = modal.querySelector("#error_nom");
        if (errEl) { errEl.textContent = "Le nom est obligatoire."; errEl.classList.remove("hidden"); }
        hasError = true;
      }

      // Validation Prénom
      if (!prenom) {
        const errEl = modal.querySelector("#error_prenom");
        if (errEl) { errEl.textContent = "Le prénom est obligatoire."; errEl.classList.remove("hidden"); }
        hasError = true;
      }

      // Validation Téléphone
      if (!telephone) {
        const errEl = modal.querySelector("#error_telephone");
        if (errEl) { errEl.textContent = "Le téléphone est obligatoire."; errEl.classList.remove("hidden"); }
        hasError = true;
      } else if (!/^[0-9]{9,}$/.test(telephone.replace(/\s/g, ''))) {
        const errEl = modal.querySelector("#error_telephone");
        if (errEl) { errEl.textContent = "Veuillez entrer un numéro valide (au moins 9 chiffres)."; errEl.classList.remove("hidden"); }
        hasError = true;
      }

      // Validation Rôle
      if (!role) {
        const errEl = modal.querySelector("#error_role");
        if (errEl) { errEl.textContent = "Veuillez sélectionner un rôle."; errEl.classList.remove("hidden"); }
        hasError = true;
      }

      // Validation Mot de passe (uniquement pour la création)
      if (!user && password.length < 6) {
        const errEl = modal.querySelector("#error_password");
        if (errEl) { errEl.textContent = "Le mot de passe doit contenir au moins 6 caractères."; errEl.classList.remove("hidden"); }
        hasError = true;
      }

      if (hasError) return false;

      try {
        const userData = { email, nom, prenom, telephone, role, adresse };
        
        if (!user) {
          userData.password = password;
          await createUser(userData);
          showToast("Utilisateur créé avec succès.");
        } else {
          await updateUser(user.id, userData);
          showToast("Utilisateur modifié avec succès.");
        }
        
        await renderUsersPage();
        return true;
      } catch (error) {
        // Afficher l'erreur dans un toast sans le toast derrière
        const errorMsg = error.message || "Une erreur est survenue.";
        alert(errorMsg); // Utiliser alert comme fallback
        // Ou utilisez showToast si vous voulez garder les toasts
        // showToast(errorMsg, "error");
        return false;
      }
    }
  });
}

export async function renderUsersPage() {
  if (!isAdmin()) {
    showToast("Accès refusé. Vous devez être administrateur.", "error");
    navigate("categories");
    return;
  }

  const app = document.getElementById("app");
  const users = await getUsers();

  app.innerHTML = `
    <section>
      ${pageHeader({
        kicker: "Administration",
        title: "Utilisateurs",
        subtitle: "Gérer les administrateurs et fournisseurs de la plateforme.",
        actionLabel: "Nouvel utilisateur",
        actionId: "addUserBtn",
        actionIcon: "fa-user-plus"
      })}

      <article class="mt-8">
        ${renderTable({
          rows: users,
          emptyMessage: "Aucun utilisateur enregistré.",
          columns: [
            { label: "Email", render: (u) => escapeHtml(u.email) },
            { label: "Nom", render: (u) => escapeHtml(`${u.nom} ${u.prenom}`) },
            { label: "Téléphone", render: (u) => escapeHtml(u.telephone) },
            { 
              label: "Rôle", 
              render: (u) => {
                const isAdmin = u.role === "admin";
                const badgeClass = isAdmin 
                  ? "bg-indigo-50 text-indigo-700 ring-indigo-600/10" 
                  : "bg-amber-50 text-amber-700 ring-amber-600/10";
                return `<span class="inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-bold ring-1 ring-inset ${badgeClass}">
                  ${u.role === "admin" ? "Admin" : "Fournisseur"}
                </span>`;
              }
            },
            {
              label: "Actions",
              render: (u) => `
                <div class="flex items-center gap-2">
                  <button class="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-extrabold text-slate-600 transition hover:bg-slate-50" data-edit="${escapeHtml(u.id)}">
                    <i class="fa-solid fa-pen"></i> Modifier
                  </button>
                  ${u.role !== "admin" ? `
                    <button class="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 px-3 py-2 text-xs font-extrabold text-white transition hover:bg-rose-700" data-delete="${escapeHtml(u.id)}">
                      <i class="fa-solid fa-trash"></i> Supprimer
                    </button>
                  ` : `
                    <span class="text-xs text-slate-400">(Admin protégé)</span>
                  `}
                </div>
              `
            }
          ]
        })}
      </article>
    </section>
  `;

  document.getElementById("addUserBtn").addEventListener("click", () => openUserForm());

  document.querySelectorAll("[data-edit]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const user = users.find(u => u.id === btn.dataset.edit);
      if (user) openUserForm(user);
    });
  });

  document.querySelectorAll("[data-delete]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.delete;
      openConfirm({
        message: "Voulez-vous supprimer cet utilisateur ?",
        onConfirm: async () => {
          try {
            await deleteUser(id);
            showToast("Utilisateur supprimé.");
            await renderUsersPage();
          } catch (error) {
            showToast(error.message, "error");
          }
        }
      });
    });
  });
}