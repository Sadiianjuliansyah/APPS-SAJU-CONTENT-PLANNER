"use strict";

(() => {
  const PIN_KEY = "saju-content-planner-pin-v1";
  const ITERATIONS = 210000;

  const screen = document.getElementById("pin-screen");
  const form = document.getElementById("pin-form");
  const input = document.getElementById("pin-input");
  const confirmInput = document.getElementById("pin-confirm");
  const confirmField = document.getElementById("pin-confirm-field");
  const title = document.getElementById("pin-title");
  const description = document.getElementById("pin-description");
  const message = document.getElementById("pin-message");
  const submit = document.getElementById("pin-submit");

  let pinRecord = null;
  let ready = false;
  let busy = false;
  let activityVersion = 0;

  function showMessage(text, isError = false) {
    message.textContent = text;
    message.classList.toggle("is-error", isError);
  }

  function toHex(bytes) {
    return Array.from(bytes, (byte) => {
      return byte.toString(16).padStart(2, "0");
    }).join("");
  }

  function fromHex(text) {
    return new Uint8Array(
      text.match(/.{2}/g).map((pair) => parseInt(pair, 16))
    );
  }

  // Simpan hasil derivasi PIN, bukan PIN asli.
  async function derivePin(pin, salt) {
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(pin),
      "PBKDF2",
      false,
      ["deriveBits"]
    );

    const bits = await crypto.subtle.deriveBits(
      {
        name: "PBKDF2",
        salt: fromHex(salt),
        iterations: ITERATIONS,
        hash: "SHA-256",
      },
      key,
      256
    );

    return toHex(new Uint8Array(bits));
  }

  function readPinRecord() {
    const raw = localStorage.getItem(PIN_KEY);

    if (raw === null) return null;

    const record = JSON.parse(raw);

    if (
      !record ||
      record.version !== 1 ||
      record.iterations !== ITERATIONS ||
      typeof record.salt !== "string" ||
      !/^[0-9a-f]{32}$/.test(record.salt) ||
      typeof record.hash !== "string" ||
      !/^[0-9a-f]{64}$/.test(record.hash)
    ) {
      throw new Error("Data PIN tidak valid.");
    }

    return record;
  }

  function prepareLockScreen() {
    ready = false;
    submit.disabled = true;
    form.reset();

    try {
      if (!window.isSecureContext || !crypto.subtle) {
        throw new Error("Gunakan HTTPS atau alamat localhost.");
      }

      pinRecord = readPinRecord();

      const isSetup = pinRecord === null;

      title.textContent = isSetup
        ? "Buat PIN Pribadi"
        : "Masukkan PIN";

      description.textContent = isSetup
        ? "Buat PIN 6 digit untuk browser/perangkat ini."
        : "Buka Saju Content Planner dengan PIN pribadimu.";

      confirmField.hidden = !isSetup;
      confirmInput.disabled = !isSetup;
      confirmInput.required = isSetup;

      submit.textContent = isSetup ? "Buat PIN" : "Buka Aplikasi";

      input.autocomplete = isSetup
        ? "new-password"
        : "current-password";

      showMessage(
        isSetup
          ? "Ingat PIN ini. PIN tidak disertakan dalam backup konten."
          : "Data konten tetap tersimpan saat aplikasi terkunci."
      );

      ready = true;
      submit.disabled = busy;
    } catch (error) {
      showMessage(
        "PIN tidak dapat disiapkan. " +
        error.message +
        " Jangan hapus data situs.",
        true
      );
    }
  }

  function lockApp() {
    activityVersion += 1;

    // Tutup form konten agar tidak tampil di atas layar kunci.
    document.querySelectorAll("dialog[open]").forEach((dialog) => {
      dialog.close();
    });

    document.body.classList.add("pin-locked");
    screen.hidden = false;
    prepareLockScreen();
  }

  function unlockApp() {
    form.reset();
    screen.hidden = true;
    document.body.classList.remove("pin-locked");

    const heading = document.getElementById("page-title");
    heading.setAttribute("tabindex", "-1");
    heading.focus();
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!ready || busy) return;

    const pin = input.value;

    if (!/^[0-9]{6}$/.test(pin)) {
      showMessage("PIN harus tepat 6 digit angka.", true);
      return;
    }

    if (pinRecord === null && pin !== confirmInput.value) {
      showMessage("Konfirmasi PIN belum sama.", true);
      confirmInput.focus();
      return;
    }

    busy = true;
    submit.disabled = true;

    const currentActivity = activityVersion;
    const originalRecord = JSON.stringify(pinRecord);

    showMessage("Memeriksa PIN...");

    try {
      let candidate = pinRecord;

      if (candidate === null) {
        const salt = toHex(
          crypto.getRandomValues(new Uint8Array(16))
        );

        candidate = {
          version: 1,
          iterations: ITERATIONS,
          salt,
          hash: await derivePin(pin, salt),
        };
      } else {
        const hash = await derivePin(pin, candidate.salt);

        if (currentActivity !== activityVersion) return;

        if (hash !== candidate.hash) {
          form.reset();
          showMessage("PIN salah. Coba lagi.", true);
          input.focus();
          return;
        }
      }

      // Jangan membuka aplikasi jika ditinggalkan saat pemeriksaan.
      if (currentActivity !== activityVersion || document.hidden) {
        return;
      }

      // Cegah menimpa PIN yang berubah melalui tab lain.
      if (JSON.stringify(readPinRecord()) !== originalRecord) {
        lockApp();
        showMessage("PIN berubah di tab lain. Masukkan kembali.", true);
        return;
      }

      if (pinRecord === null) {
        localStorage.setItem(PIN_KEY, JSON.stringify(candidate));
      }

      pinRecord = candidate;
      unlockApp();
    } catch (error) {
      showMessage(
        "PIN gagal diproses atau disimpan. Aplikasi tetap terkunci.",
        true
      );
    } finally {
      busy = false;
      submit.disabled = !ready;
    }
  });

  // Kunci saat berpindah tab, meminimalkan, atau berpindah aplikasi.
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) lockApp();
  });

  window.addEventListener("pagehide", lockApp);

  window.addEventListener("pageshow", (event) => {
    if (event.persisted) lockApp();
  });

  // Perubahan PIN atau penghapusan storage di tab lain mengunci aplikasi.
  window.addEventListener("storage", (event) => {
    if (event.key === PIN_KEY || event.key === null) {
      lockApp();
    }
  });

  lockApp();
})();