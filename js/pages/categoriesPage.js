// js/pages/categoriesPage.js
import { pageHeader } from "../components/pageHeader.js";
import { renderTable } from "../components/table.js";
import { openModal, openConfirm } from "../components/modal.js";
import { showToast } from "../components/toast.js";
import { escapeHtml } from "../utils/html.js";
import { validateForm } from "../utils/validators.js";
import {
  createCategorie,
  deleteCategorie,
  getCategories,
  updateCategorie,
} from "../services/categorieService.js";

function categorieFormBody(categorie) {
  return `
    <div>
      <label class="mb-2 block text-xs font-extrabold uppercase tracking-[0.14em] text-slate-500" for="categorieLibelle">Libellé *</label>
      <input class="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100" type="text" id="categorieLibelle" value="${escapeHtml(categorie?.libelle || "")}" placeholder="ex: Informatique" autocomplete="off" />
      <p class="mt-1 hidden text-xs font-semibold text-rose-600" id="error_libelle"></p>
    </div>
  `;
}

function openCategorieForm(categorie = null) {
  openModal({
    title: categorie ? "Modifier la catégorie" : "Nouvelle catégorie",
    icon: "fa-tag",
    body: categorieFormBody(categorie),
    confirmLabel: categorie ? "Enregistrer" : "Créer",
    onConfirm: async (modal) => {
      const libelle = modal.querySelector("#categorieLibelle").value;

      const rules = {
        libelle: { required: true, requiredMessage: "Le libellé de la catégorie est obligatoire." }
      };

      const errors = validateForm({ libelle }, rules);
      const errEl = modal.querySelector("#error_libelle");

      if (Object.keys(errors).length > 0) {
        if (errEl) {
          errEl.textContent = errors.libelle;
          errEl.classList.remove("hidden");
        }
        return false;
      }

      try {
        if (categorie) {
          await updateCategorie(categorie.id, { libelle });
          showToast("La catégorie a bien été renommée.");
        } else {
          await createCategorie({ libelle });
          showToast("Catégorie créée avec succès.");
        }
        await renderCategoriesPage();
        return true;
      } catch (error) {
        showToast(error.message, "error");
        return false;
      }
    }
  });
}

export async function renderCategoriesPage() {
  const app = document.getElementById("app");
  const categories = await getCategories();

  app.innerHTML = `
    <section>
      ${pageHeader({
        kicker: "Structure",
        title: "Catégories",
        subtitle: "Organiser et classifier vos produits pour affiner vos approvisionnements.",
        actionLabel: "Nouvelle catégorie",
        actionId: "addCategorieBtn",
        actionIcon: "fa-tag",
      })}

      <article class="mt-8">
        ${renderTable({
          rows: categories,
          emptyMessage: "Aucune catégorie enregistrée pour le moment.",
          columns: [
            { label: "Identifiant", key: "id" },
            { label: "Désignation / Libellé", render: (cat) => escapeHtml(cat.libelle) },
            {
              label: "Actions",
              render: (cat) => `
                <div class="flex items-center gap-2">
                  <button class="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-extrabold text-slate-600 transition hover:bg-slate-50" data-edit="${escapeHtml(cat.id)}">
                    <i class="fa-solid fa-pen"></i> Modifier
                  </button>
                  <button class="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 px-3 py-2 text-xs font-extrabold text-white transition hover:bg-rose-700" data-delete="${escapeHtml(cat.id)}">
                    <i class="fa-solid fa-trash"></i> Supprimer
                  </button>
                </div>
              `,
            },
          ],
        })}
      </article>
    </section>
  `;

  bindCategorieEvents(categories);
}

function bindCategorieEvents(categories) {
  document.getElementById("addCategorieBtn").addEventListener("click", () => openCategorieForm());

  document.querySelectorAll("[data-edit]").forEach((button) => {
    button.addEventListener("click", () => {
      const categorie = categories.find((item) => item.id === button.dataset.edit);
      if (categorie) openCategorieForm(categorie);
    });
  });

  document.querySelectorAll("[data-delete]").forEach((button) => {
    button.addEventListener("click", () => {
      const id = button.dataset.delete;

      openConfirm({
        message: "Voulez-vous supprimer cette catégorie ?",
        onConfirm: async () => {
          try {
            await deleteCategorie(id);
            showToast("Catégorie supprimée.");
            await renderCategoriesPage();
          } catch (error) {
            showToast(error.message, "error");
          }
        },
      });
    });
  });
}