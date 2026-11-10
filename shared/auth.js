// --- Login-Hürde (gemeinsam für Dashboard und alle Apps) ---
// PASSWORD_HASH wird beim Build & Deploy (GitHub Action) automatisch durch
// den SHA-256-Hash des Passworts aus dem Secret SITE_PASSWORD ersetzt.
// Solange hier der unveränderte Platzhalter steht (z. B. beim lokalen
// Doppelklick-Öffnen der Dateien), ist die Hürde deaktiviert.
// Einbindung: als erstes <script> direkt nach <body>, damit die Seite
// nie ungeschützt aufblitzt. Ein Login gilt für alle Seiten (gleicher Origin).
(function(){
  const PASSWORD_HASH = "__PASSWORD_HASH__";
  const AUTH_KEY = "okz_authed_hash";

  async function sha256Hex(text){
    const enc = new TextEncoder().encode(text);
    const digest = await crypto.subtle.digest("SHA-256", enc);
    return Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2, "0")).join("");
  }

  function loginRequired(){
    return /^[0-9a-f]{64}$/i.test(PASSWORD_HASH);
  }

  if(!loginRequired()) return;

  let alreadyAuthed = false;
  try{ alreadyAuthed = localStorage.getItem(AUTH_KEY) === PASSWORD_HASH; }catch(err){}
  if(alreadyAuthed) return;

  const gate = document.createElement("div");
  gate.className = "login-gate";
  gate.innerHTML =
    '<div class="login-card">' +
      '<h1>OKZ Tools</h1>' +
      '<p class="sub">Bitte Passwort eingeben.</p>' +
      '<input type="password" id="loginPasswordInput" placeholder="Passwort" autocomplete="current-password">' +
      '<button type="button" class="btn-primary" id="btnLogin" style="width:100%;margin-top:12px;">Anmelden</button>' +
      '<p class="login-error" id="loginError">Falsches Passwort.</p>' +
    '</div>';
  document.body.prepend(gate);

  const pwInput = gate.querySelector("#loginPasswordInput");
  const btnLogin = gate.querySelector("#btnLogin");
  const errorEl = gate.querySelector("#loginError");

  async function attemptLogin(){
    const hash = await sha256Hex(pwInput.value);
    if(hash === PASSWORD_HASH){
      try{ localStorage.setItem(AUTH_KEY, PASSWORD_HASH); }catch(err){}
      gate.remove();
    } else {
      errorEl.style.display = "block";
      pwInput.value = "";
      pwInput.focus();
    }
  }

  btnLogin.addEventListener("click", attemptLogin);
  pwInput.addEventListener("keydown", e => { if(e.key === "Enter") attemptLogin(); });
  pwInput.focus();
})();
