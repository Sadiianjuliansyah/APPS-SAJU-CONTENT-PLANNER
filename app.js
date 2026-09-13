"use strict";

// Judul dan deskripsi setiap halaman.
const pageConfig = {
  dashboard: {
    title: "Dashboard",
    description:
      "Dari ide pertama sampai konten terbit, atur semuanya di sini.",
  },
  contents: {
    title: "Semua Konten",
    description:
      "Simpan dan kelola ide, hook, serta script dari seluruh channel.",
    emptyTitle: "Bank kontenmu dimulai di sini",
    emptyDescription:
      "Form tambah konten akan kita buat pada tahap berikutnya.",
  },
  board: {
    title: "Papan Produksi",
    description:
      "Pantau perjalanan konten dari Ide hingga Upload.",
    emptyTitle: "Belum ada papan produksi",
    emptyDescription:
      "Konten nantinya dikelompokkan berdasarkan tahap pengerjaannya.",
  },
  schedule: {
    title: "Jadwal Upload",
    description:
      "Atur rencana penerbitan konten agar lebih terarah.",
    emptyTitle: "Belum ada jadwal upload",
    emptyDescription:
      "Rencana tanggal upload konten akan ditampilkan di halaman ini.",
  },
  analytics: {
    title: "Analisis Performa",
    description:
      "Pelajari hasil konten dan catat apa yang perlu ditingkatkan.",
    emptyTitle: "Belum ada data performa",
    emptyDescription:
      "Views, likes, komentar, dan followers gained akan dirangkum di sini.",
  },
  channels: {
    title: "Kelola Channel",
    description:
      "Kelola channel sesuai kebutuhanmu, sekarang maupun nanti.",
    emptyTitle: "Tempat untuk semua channelmu",
    emptyDescription:
      "Fitur tambah dan kelola channel akan kita aktifkan bertahap.",
  },
  backup: {
    title: "Backup & Data",
    description:
      "Cadangkan data atau pindahkan ke perangkat lain melalui file JSON.",
    emptyTitle: "Backup belum diaktifkan",
    emptyDescription:
      "Fitur ekspor dan impor akan ditambahkan setelah penyimpanan siap.",
  },
};

const navigationButtons = document.querySelectorAll(".nav-button");
const pageSections = document.querySelectorAll(".page");
const pageTitle = document.getElementById("page-title");
const pageDescription = document.getElementById("page-description");
const addContentButton = document.getElementById("add-content-button");

// Isi sementara untuk halaman yang masih kosong.
// Menggunakan elemen DOM agar teks diperlakukan sebagai teks biasa.
function preparePlaceholderPages() {
  Object.entries(pageConfig).forEach(([pageName, config]) => {
    if (pageName === "dashboard") return;

    const section = document.getElementById(`page-${pageName}`);

    // Jangan menimpa halaman jika nanti sudah memiliki isi.
    if (!section || section.children.length > 0) return;

    const panel = document.createElement("div");
    panel.className = "panel";

    const emptyState = document.createElement("div");
    emptyState.className = "empty-state";

    const icon = document.createElement("div");
    icon.className = "empty-icon";
    icon.setAttribute("aria-hidden", "true");
    icon.textContent = "✦";

    const heading = document.createElement("h2");
    heading.textContent = config.emptyTitle;

    const description = document.createElement("p");
    description.textContent = config.emptyDescription;

    emptyState.append(icon, heading, description);
    panel.append(emptyState);
    section.append(panel);
  });
}

// Tampilkan halaman dan tandai menu yang sedang aktif.
function showPage(requestedPage) {
  const pageName = Object.hasOwn(pageConfig, requestedPage)
    ? requestedPage
    : "dashboard";

  const config = pageConfig[pageName];

  pageSections.forEach((section) => {
    const isActive = section.id === `page-${pageName}`;

    section.hidden = !isActive;
    section.classList.toggle("active", isActive);
  });

  navigationButtons.forEach((button) => {
    const isActive = button.dataset.page === pageName;

    button.classList.toggle("active", isActive);

    if (isActive) {
      button.setAttribute("aria-current", "page");
    } else {
      button.removeAttribute("aria-current");
    }
  });

  pageTitle.textContent = config.title;
  pageDescription.textContent = config.description;
  document.title = `${config.title} | Saju Content Planner`;

  // Tombol tambah hanya tampil di halaman pengelolaan konten.
  addContentButton.hidden = ![
    "dashboard",
    "contents",
    "board",
    "schedule",
  ].includes(pageName);
}

// Gunakan bagian # pada URL untuk menandai halaman.
// Tombol Back dan Forward browser juga bisa digunakan.
function navigateTo(pageName) {
  if (window.location.hash === `#${pageName}`) {
    showPage(pageName);
  } else {
    window.location.hash = pageName;
  }
}

navigationButtons.forEach((button) => {
  button.addEventListener("click", () => {
    navigateTo(button.dataset.page);
  });
});

window.addEventListener("hashchange", () => {
  showPage(window.location.hash.slice(1));
});

// Buka dan tutup form konten.
const contentDialog = document.getElementById("content-dialog");
const contentForm = document.getElementById("content-form");
const closeContentDialogButton = document.getElementById(
  "close-content-dialog"
);

addContentButton.addEventListener("click", () => {
  editingContentId = null;
  contentForm.reset();

  contentDialog.querySelector("h2").textContent = "Tambah Konten";
  document.getElementById("save-content-button").textContent =
    "Simpan Konten";

  contentDialog.showModal();
});

closeContentDialogButton.addEventListener("click", () => {
  contentDialog.close();
});

// Simpan konten baru atau perubahan konten.
contentForm.addEventListener("submit", (event) => {
  event.preventDefault();

  if (!storageReady) {
    window.alert("Penyimpanan belum tersedia. Konten belum disimpan.");
    return;
  }

  const formData = new FormData(contentForm);
  const title = String(formData.get("title") || "").trim();

  if (!title) {
    window.alert("Judul konten wajib diisi.");
    document.getElementById("content-title").focus();
    return;
  }

  const existingContent = editingContentId === null
    ? null
    : contents.find((content) => content.id === editingContentId);

  if (editingContentId !== null && !existingContent) {
    window.alert("Konten yang akan diedit tidak ditemukan.");
    return;
  }

  const metrics = {};

  const metricLabels = {
    views: "Views",
    likes: "Likes",
    comments: "Komentar",
    followersGained: "Followers Gained",
  };

  for (const [fieldName, label] of Object.entries(metricLabels)) {
    const rawValue = String(formData.get(fieldName) || "").trim();
    const value = rawValue === "" ? 0 : Number(rawValue);

    if (!Number.isSafeInteger(value) || value < 0) {
      window.alert(`${label} harus berupa angka bulat minimal 0.`);
      contentForm.elements.namedItem(fieldName).focus();
      return;
    }

    metrics[fieldName] = value;
  }

  const now = new Date().toISOString();

  // Pertahankan data lama ketika mengedit, termasuk angka performa.
  const savedContent = {
    ...(existingContent || {
      id: crypto.randomUUID(),
      uploadedDate: "",
      views: 0,
      likes: 0,
      comments: 0,
      followersGained: 0,
      evaluation: "",
      createdAt: now,
    }),

    title,
    channel: String(formData.get("channel") || "").trim(),
    platform: String(formData.get("platform") || ""),
    status: String(formData.get("status") || "Ide"),
    scheduledDate: String(formData.get("scheduledDate") || ""),
    hook: String(formData.get("hook") || "").trim(),
    script: String(formData.get("script") || "").trim(),
        notes: String(formData.get("notes") || "").trim(),
    uploadedDate: String(formData.get("uploadedDate") || ""),
    ...metrics,
    evaluation: String(formData.get("evaluation") || "").trim(),
    updatedAt: now,
  };

  const nextContents = existingContent
    ? contents.map((content) =>
        content.id === editingContentId ? savedContent : content
      )
    : [savedContent, ...contents];

  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        version: 1,
        contents: nextContents,
      })
    );
  } catch (error) {
    window.alert(
      "Konten gagal disimpan. Penyimpanan browser mungkin penuh atau diblokir. Isian form tetap tersedia."
    );
    return;
  }

  contents = nextContents;
  renderContentData();

  editingContentId = null;
  contentForm.reset();
  contentDialog.close();
  navigateTo("contents");
});

// Jalankan saat aplikasi dibuka.
preparePlaceholderPages();
showPage(window.location.hash.slice(1));

// Penyimpanan lokal aplikasi.
const STORAGE_KEY = "saju-content-planner-data-v1";
const CONTENT_STATUSES = ["Ide", "Script", "Record", "Edit", "Upload"];

let contents = [];
let storageReady = false;

const numberFormatter = new Intl.NumberFormat("id-ID");

// Baca data tanpa menimpa data lama jika terjadi masalah.
function initializeStorage() {
  const hint = document.getElementById("form-hint");
  const saveButton = document.getElementById("save-content-button");

  try {
    const rawData = localStorage.getItem(STORAGE_KEY);

    if (rawData !== null) {
      const savedData = JSON.parse(rawData);

      const isValid =
        savedData !== null &&
        savedData.version === 1 &&
        Array.isArray(savedData.contents) &&
        savedData.contents.every((item) => {
          return (
            item !== null &&
            typeof item === "object" &&
            typeof item.id === "string" &&
            typeof item.title === "string" &&
            CONTENT_STATUSES.includes(item.status)
          );
        });

      if (!isValid) {
        throw new Error("Format data tidak sesuai.");
      }

      contents = savedData.contents;
    }

    storageReady = true;
    saveButton.disabled = false;
    hint.textContent = "Data disimpan lokal di browser perangkat ini.";
  } catch (error) {
    saveButton.disabled = true;
    hint.textContent =
      "Data lokal tidak dapat dibaca. Penyimpanan dinonaktifkan agar data lama tidak tertimpa.";

    window.alert(
      "Penyimpanan lokal tidak dapat dibaca. Jangan hapus data situs. Kirim screenshot jika masalah ini muncul."
    );
  }
}

// Buat kartu menggunakan textContent agar isian tampil sebagai teks.
function createContentCard(content) {
  const card = document.createElement("article");
  card.className = "content-card";

  const header = document.createElement("div");
  header.className = "content-card-header";

  const title = document.createElement("h3");
  title.textContent = content.title;

  const status = document.createElement("span");
  status.className = "content-status";
  status.textContent = content.status;

  header.append(title, status);

  const meta = document.createElement("p");
  meta.className = "content-meta";
  meta.textContent = [
    content.channel || "Tanpa channel",
    content.platform || "Platform belum ditentukan",
  ].join(" • ");

  card.append(header, meta);

  if (content.hook) {
    const hook = document.createElement("p");
    hook.className = "content-preview";
    hook.textContent = content.hook;
    card.append(hook);
  }

  if (content.scheduledDate) {
    const date = document.createElement("p");
    date.className = "content-meta";
    date.textContent = `Rencana upload: ${content.scheduledDate}`;
    card.append(date);
  }


  const actions = document.createElement("div");
  actions.style.marginTop = "16px";

  const editButton = document.createElement("button");
  editButton.type = "button";
  editButton.className = "button button-primary";
  editButton.textContent = "Detail / Edit";
  editButton.setAttribute(
    "aria-label",
    `Buka detail dan edit: ${content.title}`
  );

  editButton.addEventListener("click", () => {
    openEditContent(content.id);
  });

   actions.className = "content-actions";

  const deleteButton = document.createElement("button");
  deleteButton.type = "button";
  deleteButton.className = "button button-danger";
  deleteButton.textContent = "Hapus";
  deleteButton.setAttribute(
    "aria-label",
    `Hapus konten: ${content.title}`
  );

  deleteButton.addEventListener("click", () => {
    deleteContent(content.id);
  });

  actions.append(editButton, deleteButton);
  card.append(actions);

  return card;
}

function renderContentList(container, items, emptyMessage) {
  container.replaceChildren();

  if (items.length === 0) {
    const empty = document.createElement("div");
    empty.className = "empty-state";

    const message = document.createElement("p");
    message.textContent = emptyMessage;

    empty.append(message);
    container.append(empty);
    return;
  }

  const list = document.createElement("div");
  list.className = "content-list";

  items.forEach((content) => {
    list.append(createContentCard(content));
  });

  container.append(list);
}

// Perbarui daftar dan ringkasan dashboard.
function renderContentData() {
      renderChannels();
  renderProductionBoard();
  renderUploadSchedule();
  renderAnalytics();
  renderBackupPage();

   renderAllContents();

  renderContentList(
    document.getElementById("recent-content-list"),
    contents.slice(0, 5),
    "Ide dan konten terbarumu akan muncul di sini."
  );

  document.getElementById("stat-total").textContent =
    numberFormatter.format(contents.length);

  const productionCount = contents.filter((content) =>
    ["Script", "Record", "Edit"].includes(content.status)
  ).length;

  document.getElementById("stat-production").textContent =
    numberFormatter.format(productionCount);

  const uploadedCount = contents.filter(
    (content) => content.status === "Upload"
  ).length;

  document.getElementById("stat-uploaded").textContent =
    numberFormatter.format(uploadedCount);

    const totalViews = contents
    .filter((content) => content.status === "Upload")
    .reduce((total, content) => {
      return total + getMetricValue(content, "views");
    }, 0);

  document.getElementById("stat-views").textContent =
    numberFormatter.format(totalViews);

  const statusCounters = {
    Ide: "count-idea",
    Script: "count-script",
    Record: "count-record",
    Edit: "count-edit",
    Upload: "count-upload",
  };

  Object.entries(statusCounters).forEach(([status, elementId]) => {
    const count = contents.filter(
      (content) => content.status === status
    ).length;

    document.getElementById(elementId).textContent =
      numberFormatter.format(count);
  });
}

initializeStorage();

if (storageReady) {
  renderContentData();
}

// null berarti sedang membuat konten baru.
let editingContentId = null;

function openEditContent(contentId) {
  const content = contents.find((item) => item.id === contentId);

  if (!content) {
    window.alert("Konten tidak ditemukan.");
    return;
  }

  editingContentId = content.id;
  contentForm.reset();

    const editableFields = [
    "title",
    "channel",
    "platform",
    "status",
    "scheduledDate",
    "hook",
    "script",
    "notes",
    "uploadedDate",
    "views",
    "likes",
    "comments",
    "followersGained",
    "evaluation",
  ];

  editableFields.forEach((fieldName) => {
    const field = contentForm.elements.namedItem(fieldName);

    if (field) {
      field.value = content[fieldName] ?? "";
    }
  });

  contentDialog.querySelector("h2").textContent = "Detail & Edit Konten";
  document.getElementById("save-content-button").textContent =
    "Simpan Perubahan";

  contentDialog.showModal();
}

// Hapus satu konten dan perbarui penyimpanan.
function deleteContent(contentId) {
  if (!storageReady) {
    window.alert("Penyimpanan belum tersedia.");
    return;
  }

  const content = contents.find((item) => item.id === contentId);

  if (!content) {
    window.alert("Konten tidak ditemukan.");
    return;
  }

  const confirmed = window.confirm(
    `Hapus konten "${content.title}"?\n\nKonten yang dihapus tidak bisa dikembalikan melalui aplikasi.`
  );

  if (!confirmed) return;

  const nextContents = contents.filter(
    (item) => item.id !== contentId
  );

  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        version: 1,
        contents: nextContents,
      })
    );
  } catch (error) {
    window.alert(
      "Gagal menyimpan perubahan. Konten belum dihapus. Coba kembali."
    );
    return;
  }

  contents = nextContents;
  renderContentData();
}


// Simpan perubahan status dari papan produksi.
function updateContentStatus(contentId, newStatus) {
  if (!storageReady || !CONTENT_STATUSES.includes(newStatus)) {
    return false;
  }

  const content = contents.find((item) => item.id === contentId);

  if (!content) {
    window.alert("Konten tidak ditemukan.");
    return false;
  }

  if (content.status === newStatus) return true;

  const nextContents = contents.map((item) => {
    if (item.id !== contentId) return item;

    return {
      ...item,
      status: newStatus,
      updatedAt: new Date().toISOString(),
    };
  });

  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        version: 1,
        contents: nextContents,
      })
    );
  } catch (error) {
    window.alert("Perubahan status gagal disimpan. Status lama tetap digunakan.");
    return false;
  }

  contents = nextContents;
  renderContentData();
  return true;
}

// Tampilkan konten dalam lima kolom produksi.
function renderProductionBoard() {
  const container = document.getElementById("page-board");
  container.replaceChildren();

  const description = document.createElement("p");
  description.className = "board-description";
  description.textContent =
    "Ubah status melalui pilihan di setiap kartu. Perubahan langsung disimpan.";

  const board = document.createElement("div");
  board.className = "production-board";

  CONTENT_STATUSES.forEach((status) => {
    const items = contents.filter((content) => content.status === status);

    const column = document.createElement("section");
    column.className = "board-column";
    column.setAttribute("aria-label", `Tahap ${status}`);

    const header = document.createElement("div");
    header.className = "board-column-header";

    const heading = document.createElement("h2");
    heading.textContent = status;

    const count = document.createElement("span");
    count.className = "content-status";
    count.textContent = numberFormatter.format(items.length);

    header.append(heading, count);

    const list = document.createElement("div");
    list.className = "content-list";

    if (items.length === 0) {
      const empty = document.createElement("p");
      empty.className = "board-empty";
      empty.textContent = "Belum ada konten di tahap ini.";
      list.append(empty);
    }

    items.forEach((content) => {
      // Gunakan kartu yang sudah memiliki tombol Detail / Edit dan Hapus.
      const card = createContentCard(content);

      const field = document.createElement("label");
      field.className = "form-field board-status-field";

      const labelText = document.createElement("span");
      labelText.textContent = "Ubah status";

      const select = document.createElement("select");
      select.setAttribute(
        "aria-label",
        `Ubah status konten: ${content.title}`
      );

      CONTENT_STATUSES.forEach((optionStatus) => {
        const option = document.createElement("option");
        option.value = optionStatus;
        option.textContent = optionStatus;
        select.append(option);
      });

      select.value = content.status;

      select.addEventListener("change", () => {
        const saved = updateContentStatus(content.id, select.value);

        if (!saved) {
          select.value = content.status;
        }
      });

      field.append(labelText, select);
      card.append(field);
      list.append(card);
    });

    column.append(header, list);
    board.append(column);
  });

  container.append(description, board);
}

// Tanggal lokal perangkat, agar tidak bergeser karena zona waktu UTC.
function getLocalDateKey() {
  const now = new Date();

  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

// Ubah tanggal menjadi format yang mudah dibaca.
function formatScheduleDate(dateKey) {
  const [year, month, day] = dateKey.split("-").map(Number);
  const date = new Date(year, month - 1, day);

  return date.toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

// Ambil konten terjadwal yang belum di-upload.
function getScheduledContents() {
  return contents
    .filter((content) => {
      return (
        typeof content.scheduledDate === "string" &&
        /^\d{4}-\d{2}-\d{2}$/.test(content.scheduledDate) &&
        content.status !== "Upload"
      );
    })
    .sort((a, b) => {
      return (
        a.scheduledDate.localeCompare(b.scheduledDate) ||
        a.title.localeCompare(b.title, "id")
      );
    });
}

function renderUploadSchedule() {
  const container = document.getElementById("page-schedule");
  const upcomingContainer = document.getElementById(
    "upcoming-content-list"
  );

  const today = getLocalDateKey();
  const scheduledContents = getScheduledContents();

  container.replaceChildren();

  const description = document.createElement("p");
  description.className = "board-description";
  description.textContent =
    "Antrean konten yang belum di-upload, termasuk jadwal yang sudah terlewat.";

  container.append(description);

  if (scheduledContents.length === 0) {
    const empty = document.createElement("div");
    empty.className = "empty-state";

    const message = document.createElement("p");
    message.textContent =
      "Belum ada antrean upload. Isi Rencana Tanggal Upload melalui Tambah Konten atau Detail / Edit.";

    empty.append(message);
    container.append(empty);
  } else {
    const groups = new Map();

    scheduledContents.forEach((content) => {
      const dateKey = content.scheduledDate;

      if (!groups.has(dateKey)) {
        groups.set(dateKey, []);
      }

      groups.get(dateKey).push(content);
    });

    const scheduleList = document.createElement("div");
    scheduleList.className = "schedule-list";

    groups.forEach((items, dateKey) => {
      const section = document.createElement("section");
      section.className = "panel";

      const header = document.createElement("div");
      header.className = "schedule-group-header";

      const heading = document.createElement("h2");
      heading.textContent = formatScheduleDate(dateKey);

      const badge = document.createElement("span");
      badge.className = "schedule-badge";

      if (dateKey < today) {
        badge.classList.add("schedule-overdue");
        badge.textContent = "Terlewat";
      } else if (dateKey === today) {
        badge.classList.add("schedule-today");
        badge.textContent = "Hari ini";
      } else {
        badge.textContent = "Mendatang";
      }

      header.append(heading, badge);

      const list = document.createElement("div");
      renderContentList(list, items, "");

      section.append(header, list);
      scheduleList.append(section);
    });

    container.append(scheduleList);
  }

  // Dashboard menampilkan maksimal tiga rencana terdekat,
  // mulai hari ini. Jadwal terlewat tetap terlihat di halaman Jadwal.
  const upcomingContents = scheduledContents
    .filter((content) => content.scheduledDate >= today)
    .slice(0, 3);

  renderContentList(
    upcomingContainer,
    upcomingContents,
    "Belum ada rencana upload mulai hari ini."
  );
}

// Segarkan jadwal ketika kembali ke tab aplikasi.
document.addEventListener("visibilitychange", () => {
  if (!document.hidden && storageReady) {
    renderUploadSchedule();
  }
});

window.addEventListener("focus", () => {
  if (storageReady) {
    renderUploadSchedule();
  }
});

// Ambil angka metrik yang valid.
function getMetricValue(content, fieldName) {
  const value = Number(content[fieldName]);

  return Number.isSafeInteger(value) && value >= 0 ? value : 0;
}

// Buat kartu ringkasan analisis.
function createAnalyticsStat(label, value, description) {
  const card = document.createElement("article");
  card.className = "stat-card";

  const labelElement = document.createElement("p");
  labelElement.className = "stat-label";
  labelElement.textContent = label;

  const valueElement = document.createElement("h2");
  valueElement.className = "stat-value";
  valueElement.textContent = numberFormatter.format(value);

  const descriptionElement = document.createElement("p");
  descriptionElement.className = "stat-description";
  descriptionElement.textContent = description;

  card.append(labelElement, valueElement, descriptionElement);
  return card;
}

function renderAnalytics() {
  const container = document.getElementById("page-analytics");
  container.replaceChildren();

  const uploadedContents = contents.filter(
    (content) => content.status === "Upload"
  );

  const totals = {
    views: 0,
    likes: 0,
    comments: 0,
    followersGained: 0,
  };

  uploadedContents.forEach((content) => {
    Object.keys(totals).forEach((fieldName) => {
      totals[fieldName] += getMetricValue(content, fieldName);
    });
  });

  const description = document.createElement("p");
  description.className = "board-description";
  description.textContent =
    `Ringkasan ${numberFormatter.format(uploadedContents.length)} konten ` +
    "berstatus Upload. Berdasarkan angka yang kamu catat, bukan data otomatis platform.";

  const stats = document.createElement("div");
  stats.className = "stats-grid";

  stats.append(
    createAnalyticsStat(
      "Total Views",
      totals.views,
      "Views konten berstatus Upload"
    ),
    createAnalyticsStat(
      "Total Likes",
      totals.likes,
      "Likes yang sudah dicatat"
    ),
    createAnalyticsStat(
      "Total Komentar",
      totals.comments,
      "Komentar yang sudah dicatat"
    ),
    createAnalyticsStat(
      "Followers Gained",
      totals.followersGained,
      "Jumlah per konten yang dicatat"
    )
  );

  container.append(description, stats);

  const panel = document.createElement("section");
  panel.className = "panel";

  const header = document.createElement("div");
  header.className = "panel-header";

  const headerText = document.createElement("div");

  const heading = document.createElement("h2");
  heading.textContent = "Performa per Konten";

  const subtitle = document.createElement("p");
  subtitle.textContent =
    "Diurutkan dari views tertinggi. Umur video dan platform bisa memengaruhi perbandingan.";

  headerText.append(heading, subtitle);
  header.append(headerText);
  panel.append(header);

  if (uploadedContents.length === 0) {
    const empty = document.createElement("div");
    empty.className = "empty-state";

    const message = document.createElement("p");
    message.textContent =
      "Belum ada konten berstatus Upload. Ubah status dan isi performanya melalui Detail / Edit.";

    empty.append(message);
    panel.append(empty);
    container.append(panel);
    return;
  }

  const rankedContents = [...uploadedContents].sort((a, b) => {
    return (
      getMetricValue(b, "views") - getMetricValue(a, "views") ||
      a.title.localeCompare(b.title, "id")
    );
  });

  const list = document.createElement("div");
  list.className = "content-list";

  rankedContents.forEach((content) => {
    const card = createContentCard(content);

    if (content.uploadedDate) {
      const published = document.createElement("p");
      published.className = "content-meta";
      published.textContent = `Tanggal terbit: ${content.uploadedDate}`;
      card.append(published);
    }

    const metrics = document.createElement("dl");
    metrics.className = "analytics-metrics";

    const fields = [
      ["views", "Views"],
      ["likes", "Likes"],
      ["comments", "Komentar"],
      ["followersGained", "Followers Gained"],
    ];

    fields.forEach(([fieldName, label]) => {
      const item = document.createElement("div");

      const term = document.createElement("dt");
      term.textContent = label;

      const value = document.createElement("dd");
      value.textContent = numberFormatter.format(
        getMetricValue(content, fieldName)
      );

      item.append(term, value);
      metrics.append(item);
    });

    const evaluation = document.createElement("div");
    evaluation.className = "analytics-evaluation";

    const evaluationTitle = document.createElement("h4");
    evaluationTitle.textContent = "Evaluasi";

    const evaluationText = document.createElement("p");
    evaluationText.textContent =
      content.evaluation || "Belum ada catatan evaluasi.";

    evaluation.append(evaluationTitle, evaluationText);
    card.append(metrics, evaluation);
    list.append(card);
  });

  panel.append(list);
  container.append(panel);
}

// Halaman Semua Konten dengan pencarian dan filter.
function renderAllContents() {
  const container = document.getElementById("page-contents");

  // Pertahankan filter saat konten ditambah, diedit, atau dihapus.
  const previousFilters = {
    search: document.getElementById("content-search")?.value || "",
    channel: document.getElementById("filter-channel")?.value || "",
    platform: document.getElementById("filter-platform")?.value || "",
    status: document.getElementById("filter-status")?.value || "",
  };

  container.replaceChildren();

  const toolbar = document.createElement("div");
  toolbar.className = "panel content-toolbar";

  const searchField = document.createElement("label");
  searchField.className = "form-field search-field";

  const searchLabel = document.createElement("span");
  searchLabel.textContent = "Cari konten";

  const searchInput = document.createElement("input");
  searchInput.id = "content-search";
  searchInput.type = "search";
  searchInput.placeholder = "Cari judul, hook, script, atau catatan...";
  searchInput.value = previousFilters.search;

  searchField.append(searchLabel, searchInput);
  toolbar.append(searchField);

  function createFilter(id, label, allLabel, values, previousValue) {
    const field = document.createElement("label");
    field.className = "form-field";

    const text = document.createElement("span");
    text.textContent = label;

    const select = document.createElement("select");
    select.id = id;

    const allOption = document.createElement("option");
    allOption.value = "";
    allOption.textContent = allLabel;
    select.append(allOption);

    values.forEach((value) => {
      const option = document.createElement("option");
      option.value = value;
      option.textContent = value;
      select.append(option);
    });

    // Kembali ke Semua jika pilihan lama sudah tidak tersedia.
    select.value = values.includes(previousValue) ? previousValue : "";

    field.append(text, select);
    toolbar.append(field);

    return select;
  }

  const channels = [...new Set(
    contents.map((content) => content.channel).filter(Boolean)
  )].sort((a, b) => a.localeCompare(b, "id"));

  const platforms = [...new Set(
    contents.map((content) => content.platform).filter(Boolean)
  )].sort((a, b) => a.localeCompare(b, "id"));

  const channelFilter = createFilter(
    "filter-channel",
    "Channel",
    "Semua channel",
    channels,
    previousFilters.channel
  );

  const platformFilter = createFilter(
    "filter-platform",
    "Platform",
    "Semua platform",
    platforms,
    previousFilters.platform
  );

  const statusFilter = createFilter(
    "filter-status",
    "Status",
    "Semua status",
    CONTENT_STATUSES,
    previousFilters.status
  );

  const summaryRow = document.createElement("div");
  summaryRow.className = "filter-summary";

  const summary = document.createElement("p");
  summary.setAttribute("role", "status");

  const resetButton = document.createElement("button");
  resetButton.type = "button";
  resetButton.className = "button button-secondary";
  resetButton.textContent = "Reset Filter";

  summaryRow.append(summary, resetButton);

  const results = document.createElement("div");
  container.append(toolbar, summaryRow, results);

  function updateResults() {
    const query = searchInput.value.trim().toLocaleLowerCase("id-ID");

    const filteredContents = contents.filter((content) => {
      const searchableText = [
        content.title,
        content.channel,
        content.platform,
        content.hook,
        content.script,
        content.notes,
        content.evaluation,
      ]
        .join(" ")
        .toLocaleLowerCase("id-ID");

      return (
        (!query || searchableText.includes(query)) &&
        (!channelFilter.value || content.channel === channelFilter.value) &&
        (!platformFilter.value || content.platform === platformFilter.value) &&
        (!statusFilter.value || content.status === statusFilter.value)
      );
    });

    summary.textContent =
      `Menampilkan ${numberFormatter.format(filteredContents.length)} ` +
      `dari ${numberFormatter.format(contents.length)} konten`;

    renderContentList(
      results,
      filteredContents,
      contents.length === 0
        ? "Belum ada konten. Klik Tambah Konten untuk menyimpan ide pertama."
        : "Tidak ada konten yang cocok. Ubah pencarian atau klik Reset Filter."
    );
  }

  searchInput.addEventListener("input", updateResults);

  [channelFilter, platformFilter, statusFilter].forEach((select) => {
    select.addEventListener("change", updateResults);
  });

  resetButton.addEventListener("click", () => {
    searchInput.value = "";
    channelFilter.value = "";
    platformFilter.value = "";
    statusFilter.value = "";

    updateResults();
    searchInput.focus();
  });

  updateResults();
}

// Unduh seluruh data konten sebagai file JSON.
function exportBackup() {
  if (!storageReady) {
    window.alert(
      "Data lokal belum berhasil dibaca. Ekspor dibatalkan agar tidak membuat backup yang keliru."
    );
    return;
  }

  const backup = {
    app: "Content Planner",
    version: 1,
    exportedAt: new Date().toISOString(),
    contents,
  };

  const json = JSON.stringify(backup, null, 2);
  const blob = new Blob([json], {
    type: "application/json;charset=utf-8",
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  const now = new Date();
  const time = [
    now.getHours(),
    now.getMinutes(),
    now.getSeconds(),
  ]
    .map((value) => String(value).padStart(2, "0"))
    .join("-");

  link.href = url;
  link.download =
    `content-planner-backup-${getLocalDateKey()}-${time}.json`;

  document.body.append(link);
  link.click();
  link.remove();

  // Beri browser waktu untuk memulai unduhan sebelum URL dibersihkan.
  setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 60000);
}

// Halaman backup.
function renderBackupPage() {
  const container = document.getElementById("page-backup");
  container.replaceChildren();

  const panel = document.createElement("section");
  panel.className = "panel";

  const header = document.createElement("div");
  header.className = "panel-header";

  const headerText = document.createElement("div");

  const heading = document.createElement("h2");
  heading.textContent = "Backup Data Konten";

  const description = document.createElement("p");
  description.textContent =
    "Simpan salinan data sebagai file JSON untuk pemulihan atau pindah perangkat.";

  headerText.append(heading, description);
  header.append(headerText);

  const count = document.createElement("p");
  count.className = "backup-info";
  count.textContent =
    `${numberFormatter.format(contents.length)} konten akan diekspor, ` +
    "termasuk seluruh status dan channel. Filter tampilan tidak membatasi backup.";

  const exportButton = document.createElement("button");
  exportButton.type = "button";
  exportButton.className = "button button-primary";
  exportButton.textContent = "Ekspor Backup JSON";
  exportButton.disabled = !storageReady;
  exportButton.addEventListener("click", exportBackup);

  const note = document.createElement("p");
  note.className = "backup-note";
  note.textContent =
    "File JSON berisi data teks tanpa enkripsi. Simpan di tempat pribadi. " +
    "Ekspor tidak menghapus atau mengubah data aplikasi.";

  panel.append(header, count, exportButton, note);

  const importSection = document.createElement("section");
  importSection.className = "performance-section";

  const importHeading = document.createElement("h2");
  importHeading.textContent = "Impor Backup";

  const importDescription = document.createElement("p");
  importDescription.className = "backup-info";
  importDescription.textContent =
    "Pilih file JSON hasil ekspor Saju Content Planner. Data akan diganti setelah kamu menyetujui konfirmasi.";

  const fileField = document.createElement("label");
  fileField.className = "form-field";

  const fileLabel = document.createElement("span");
  fileLabel.textContent = "File backup JSON";

  const fileInput = document.createElement("input");
  fileInput.type = "file";
  fileInput.accept = ".json,application/json";
  fileInput.disabled = !storageReady;

  fileInput.addEventListener("change", async () => {
    const file = fileInput.files[0];
    if (!file) return;

    fileInput.disabled = true;

    try {
      await importBackup(file);
    } finally {
      // Memungkinkan file yang sama dipilih kembali.
      fileInput.value = "";
      fileInput.disabled = !storageReady;
    }
  });

  fileField.append(fileLabel, fileInput);
  importSection.append(importHeading, importDescription, fileField);

  panel.append(importSection);
  container.append(panel);
}

// Periksa dan susun ulang data backup sebelum digunakan.
function validateBackup(data) {
  if (
    !data ||
    data.app !== "Content Planner" ||
    data.version !== 1 ||
    !Array.isArray(data.contents)
  ) {
    throw new Error("File bukan backup Saju Content Planner versi 1.");
  }

  const usedIds = new Set();

  function readText(item, fieldName) {
    const value = item[fieldName];

    if (value === undefined) return "";

    if (typeof value !== "string") {
      throw new Error(`Kolom ${fieldName} harus berupa teks.`);
    }

    return value;
  }

  function readDate(item, fieldName) {
    const value = readText(item, fieldName);

    if (value === "") return "";

    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      throw new Error(`Format ${fieldName} tidak valid.`);
    }

    const date = new Date(`${value}T12:00:00Z`);

    if (
      Number.isNaN(date.getTime()) ||
      date.toISOString().slice(0, 10) !== value
    ) {
      throw new Error(`Tanggal ${fieldName} tidak valid.`);
    }

    return value;
  }

  function readMetric(item, fieldName) {
    const value = item[fieldName] ?? 0;

    if (!Number.isSafeInteger(value) || value < 0) {
      throw new Error(`Angka ${fieldName} tidak valid.`);
    }

    return value;
  }

  return data.contents.map((item, index) => {
    if (!item || typeof item !== "object" || Array.isArray(item)) {
      throw new Error(`Konten nomor ${index + 1} tidak valid.`);
    }

    const id = readText(item, "id");
    const title = readText(item, "title").trim();

    if (!id.trim() || usedIds.has(id)) {
      throw new Error(`ID konten nomor ${index + 1} kosong atau duplikat.`);
    }

    if (!title) {
      throw new Error(`Judul konten nomor ${index + 1} kosong.`);
    }

    if (!CONTENT_STATUSES.includes(item.status)) {
      throw new Error(`Status konten nomor ${index + 1} tidak valid.`);
    }

    usedIds.add(id);

    // Hanya ambil kolom yang digunakan aplikasi.
    return {
      id,
      title,
      channel: readText(item, "channel"),
      platform: readText(item, "platform"),
      status: item.status,
      scheduledDate: readDate(item, "scheduledDate"),
      uploadedDate: readDate(item, "uploadedDate"),
      hook: readText(item, "hook"),
      script: readText(item, "script"),
      notes: readText(item, "notes"),
      views: readMetric(item, "views"),
      likes: readMetric(item, "likes"),
      comments: readMetric(item, "comments"),
      followersGained: readMetric(item, "followersGained"),
      evaluation: readText(item, "evaluation"),
      createdAt: readText(item, "createdAt"),
      updatedAt: readText(item, "updatedAt"),
    };
  });
}

// Baca file, minta konfirmasi, lalu simpan hasil impor.
async function importBackup(file) {
  if (!file) return;

  if (!storageReady) {
    window.alert("Penyimpanan belum tersedia. Impor dibatalkan.");
    return;
  }

  // Batasi ukuran file yang dibaca menjadi 10 MB.
  if (file.size > 10 * 1024 * 1024) {
    window.alert("File terlalu besar. Batas impor saat ini adalah 10 MB.");
    return;
  }

  let importedContents;

  try {
    const text = await file.text();
    const parsedData = JSON.parse(text);
    importedContents = validateBackup(parsedData);
  } catch (error) {
    window.alert(
      `Backup tidak dapat diimpor:\n${error.message}\n\nData aplikasi belum diubah.`
    );
    return;
  }

  const confirmed = window.confirm(
    `Backup valid: ${importedContents.length} konten.\n` +
    `Data saat ini: ${contents.length} konten.\n\n` +
    "Impor akan MENGGANTI seluruh data konten saat ini, termasuk jika backup kosong.\n\n" +
    "Pastikan sudah mengekspor data saat ini jika masih diperlukan. Lanjutkan?"
  );

  if (!confirmed) return;

  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        version: 1,
        contents: importedContents,
      })
    );
  } catch (error) {
    window.alert(
      "Impor gagal disimpan. Penyimpanan mungkin penuh atau diblokir. Data lama tetap dipertahankan."
    );
    return;
  }

  contents = importedContents;
  editingContentId = null;
  contentForm.reset();

  // Bersihkan filter lama agar seluruh hasil impor terlihat.
  [
    "content-search",
    "filter-channel",
    "filter-platform",
    "filter-status",
  ].forEach((id) => {
    const field = document.getElementById(id);
    if (field) field.value = "";
  });

  renderContentData();

  window.alert(
    `Impor berhasil. ${contents.length} konten sudah dimuat dan disimpan.`
  );
}

// Ganti nama channel pada seluruh konten yang menggunakannya.
function renameChannel(oldName) {
  if (!storageReady) return;

  const answer = window.prompt(
    `Nama baru untuk channel "${oldName}":`,
    oldName
  );

  if (answer === null) return;

  const newName = answer.trim();

  if (!newName || newName.length > 80) {
    window.alert("Nama channel harus berisi 1–80 karakter.");
    return;
  }

  if (newName === oldName) return;

  const affectedCount = contents.filter(
    (content) => content.channel === oldName
  ).length;

  const destinationExists = contents.some(
    (content) => content.channel === newName
  );

  const message =
    `Ganti channel "${oldName}" menjadi "${newName}" ` +
    `pada ${affectedCount} konten?` +
    (destinationExists
      ? "\n\nNama tujuan sudah digunakan. Konten akan dikelompokkan dalam channel yang sama."
      : "");

  if (!window.confirm(message)) return;

  const now = new Date().toISOString();

  const nextContents = contents.map((content) => {
    if (content.channel !== oldName) return content;

    return {
      ...content,
      channel: newName,
      updatedAt: now,
    };
  });

  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        version: 1,
        contents: nextContents,
      })
    );
  } catch (error) {
    window.alert("Nama channel gagal disimpan. Data belum diubah.");
    return;
  }

  contents = nextContents;
  renderContentData();
}

// Ringkasan channel berdasarkan konten tersimpan.
function renderChannels() {
  const container = document.getElementById("page-channels");
  const suggestions = document.getElementById("channel-suggestions");

  container.replaceChildren();
  suggestions.replaceChildren();

  const channelNames = [...new Set(
    contents.map((content) => content.channel).filter(Boolean)
  )].sort((a, b) => a.localeCompare(b, "id"));

  channelNames.forEach((name) => {
    const option = document.createElement("option");
    option.value = name;
    suggestions.append(option);
  });

  const description = document.createElement("p");
  description.className = "board-description";
  description.textContent =
    "Channel muncul setelah digunakan pada konten. " +
    "Untuk menambah channel baru, klik Tambah Konten lalu isi nama channel.";

  const addButton = document.createElement("button");
  addButton.type = "button";
  addButton.className = "button button-primary";
  addButton.textContent = "Tambah Konten";
  addButton.addEventListener("click", () => {
    // Gunakan alur form Tambah Konten yang sudah ada.
    addContentButton.click();
  });

  const toolbar = document.createElement("div");
  toolbar.className = "filter-summary";
  toolbar.append(description, addButton);
  container.append(toolbar);

  const withoutChannel = contents.filter(
    (content) => !content.channel
  ).length;

  if (withoutChannel > 0) {
    const note = document.createElement("p");
    note.className = "board-description";
    note.textContent =
      `${withoutChannel} konten belum memiliki channel. ` +
      "Lengkapi melalui Detail / Edit pada Semua Konten.";
    container.append(note);
  }

  if (channelNames.length === 0) {
    const empty = document.createElement("div");
    empty.className = "empty-state";

    const message = document.createElement("p");
    message.textContent =
      "Belum ada channel yang digunakan. Isi nama channel pada salah satu konten.";

    empty.append(message);
    container.append(empty);
    return;
  }

  const grid = document.createElement("div");
  grid.className = "channel-grid";

  channelNames.forEach((name) => {
    const items = contents.filter(
      (content) => content.channel === name
    );

    const uploaded = items.filter(
      (content) => content.status === "Upload"
    );

    const views = uploaded.reduce((total, content) => {
      return total + getMetricValue(content, "views");
    }, 0);

    const card = document.createElement("article");
    card.className = "panel";

    const heading = document.createElement("h2");
    heading.className = "channel-title";
    heading.textContent = name;

    const summary = document.createElement("p");
    summary.className = "content-meta";
    summary.textContent =
      `${numberFormatter.format(items.length)} konten • ` +
      `${numberFormatter.format(uploaded.length)} sudah upload`;

    const viewSummary = document.createElement("p");
    viewSummary.className = "content-meta";
    viewSummary.textContent =
      `${numberFormatter.format(views)} views dari konten Upload`;

    const platforms = [...new Set(
      items.map((content) => content.platform).filter(Boolean)
    )];

    const platformSummary = document.createElement("p");
    platformSummary.className = "content-meta";
    platformSummary.textContent =
      `Platform: ${platforms.join(", ") || "Belum ditentukan"}`;

    const actions = document.createElement("div");
    actions.className = "content-actions";

    const renameButton = document.createElement("button");
    renameButton.type = "button";
    renameButton.className = "button button-secondary";
    renameButton.textContent = "Ganti Nama Channel";
    renameButton.addEventListener("click", () => {
      renameChannel(name);
    });

    actions.append(renameButton);

    card.append(
      heading,
      summary,
      viewSummary,
      platformSummary,
      actions
    );

    grid.append(card);
  });

  container.append(grid);
}

// Aktifkan dukungan offline.
async function registerContentPlannerWorker() {
  if (!("serviceWorker" in navigator) || !window.isSecureContext) {
    console.warn(
      "Mode offline membutuhkan browser yang mendukung serta alamat HTTPS atau localhost."
    );
    return;
  }

  const appBase = new URL("./", window.location.href);
  const workerURL = new URL("sw.js", appBase);

  try {
    // Cegah penggantian worker aplikasi lain secara tidak sengaja.
    const existing = await navigator.serviceWorker.getRegistration(
      appBase.href
    );

    if (existing) {
      const workers = [
        existing.active,
        existing.waiting,
        existing.installing,
      ].filter(Boolean);

      const hasOtherWorker = workers.some(
        (worker) => worker.scriptURL !== workerURL.href
      );

      if (hasOtherWorker) {
        console.warn(
          "Pendaftaran offline dibatalkan: alamat ini masih menggunakan service worker aplikasi lain. Gunakan profil Saju Content Planner yang sudah terpisah."
        );
        return;
      }
    }

    await navigator.serviceWorker.register(workerURL.href, {
      scope: appBase.href,
      updateViaCache: "none",
    });

    console.log(
      "Service worker Saju Content Planner terdaftar. Cek status activated di Application → Service Workers."
    );
  } catch (error) {
    console.error("Mode offline gagal didaftarkan:", error);
  }
}

registerContentPlannerWorker();