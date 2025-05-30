const api = '/api';

function saveToken(token) { localStorage.setItem('afriwallet_token', token); }
function getToken() { return localStorage.getItem('afriwallet_token'); }
function logout() {
  localStorage.removeItem('afriwallet_token');
  window.location = "login.html";
}
function showLoading(show = true) {
  const loading = document.getElementById('loading');
  if (loading) loading.classList.toggle('hidden', !show);
}
function playNotif() {
  const audio = document.getElementById('notif-audio');
  if (audio) audio.play();
}
function setDarkModeAuto() {
  const hour = new Date().getHours();
  if (hour >= 18 || hour < 7) document.body.classList.add('dark');
  else document.body.classList.remove('dark');
}
setDarkModeAuto();

window.onload = function() {
  if (window.location.pathname.endsWith('dashboard.html')) dashboardPage();
  if (window.location.pathname.endsWith('login.html')) loginPage();
  if (window.location.pathname.endsWith('signup.html')) signupPage();
};

function dashboardPage() {
  if (!getToken()) { window.location = "login.html"; return; }
  showLoading(true);

  fetch(api + '/wallet/me', {
    headers: { 'Authorization': getToken() }
  })
  .then(res => res.json())
  .then(user => {
    document.getElementById('username').innerText = user.username || '';
    document.getElementById('saldo').innerText = user.saldo + ' MZN';
    if(document.getElementById('user-email')) document.getElementById('user-email').innerText = user.email;
    showLoading(false);
  });

  fetch(api + '/wallet/history', {
    headers: { 'Authorization': getToken() }
  })
  .then(res => res.json())
  .then(lista => {
    document.getElementById('contador-transacoes').innerText = lista.length;
    renderHistorico(lista);
    if(document.getElementById('ver-tudo')) {
      document.getElementById('ver-tudo').onclick = () => renderHistorico(lista, true);
    }
  });

  if(document.getElementById('logout')) document.getElementById('logout').onclick = logout;

  // Depositar: passo a passo
  if (document.getElementById('btn-depositar')) {
    document.getElementById('btn-depositar').onclick = () => {
      document.getElementById('modal-depositar').classList.remove('hidden');
      document.getElementById('depositar-step1').classList.remove('hidden');
      document.getElementById('depositar-form').classList.add('hidden');
      document.getElementById('depositar-feedback').innerText = '';
    };
    document.getElementById('depositar-close').onclick = resetDepositarForm;

    // Escolher VIA
    const viaBtns = document.querySelectorAll('#depositar-step1 .via-btn');
    viaBtns.forEach(btn => {
      btn.onclick = () => {
        viaBtns.forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        const via = btn.getAttribute('data-via');
        document.getElementById('depositar-via').value = via;
        document.getElementById('depositar-via-label').innerText = "Via escolhida: " + via;
        document.getElementById('depositar-step1').classList.add('hidden');
        document.getElementById('depositar-form').classList.remove('hidden');
      }
    });

    document.getElementById('depositar-form').onsubmit = depositarSaldo;
  }
  // Levantar: passo a passo
  if (document.getElementById('btn-levantar')) {
    document.getElementById('btn-levantar').onclick = () => {
      document.getElementById('modal-levantar').classList.remove('hidden');
      document.getElementById('levantar-step1').classList.remove('hidden');
      document.getElementById('levantar-form').classList.add('hidden');
      document.getElementById('levantar-feedback').innerText = '';
    };
    document.getElementById('levantar-close').onclick = resetLevantarForm;

    // Escolher VIA
    const viaBtns = document.querySelectorAll('#levantar-step1 .via-btn');
    viaBtns.forEach(btn => {
      btn.onclick = () => {
        viaBtns.forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        const via = btn.getAttribute('data-via');
        document.getElementById('levantar-via').value = via;
        document.getElementById('levantar-via-label').innerText = "Via escolhida: " + via;
        document.getElementById('levantar-step1').classList.add('hidden');
        document.getElementById('levantar-form').classList.remove('hidden');
      }
    });

    document.getElementById('levantar-form').onsubmit = levantarSaldo;
  }
  // Enviar
  const modal = document.getElementById('modal-envio');
  if(modal && document.getElementById('btn-enviar')) {
    document.getElementById('btn-enviar').onclick = () => modal.classList.remove('hidden');
    document.getElementById('envio-close').onclick = resetEnvioForm;
    document.getElementById('enviar-form').onsubmit = enviarDinheiro;
  }
  // Perfil
  if(document.getElementById('nav-perfil')) {
    document.getElementById('nav-perfil').onclick = () => {
      document.getElementById('modal-perfil').classList.remove('hidden');
      fetch(api + '/wallet/me', {
        headers: { 'Authorization': getToken() }
      })
      .then(res => res.json())
      .then(user => {
        document.getElementById('perfil-username').value = user.username || '';
        document.getElementById('perfil-email').value = user.email || '';
      });
    };
    document.getElementById('perfil-close').onclick = resetPerfilForm;
    document.getElementById('perfil-form').onsubmit = atualizarPerfil;
  }
}

function renderHistorico(lista, completo = false) {
  let historyList = document.getElementById('history-list');
  if (!historyList) return;
  historyList.innerHTML = '';
  (completo ? lista : lista.slice(0,5)).forEach(t => {
    const li = document.createElement('li');
    li.innerHTML = `
      <span class="history-icon ${t.type === 'enviar' ? 'history-enviar' : 'history-receber'}">
        ${t.type === 'enviar' ? '→' : '←'}
      </span>
      <b>${t.valor} MZN</b>
      <span class="history-via">${t.via}</span>
      <span style="margin-left:auto;font-size:.97em;color:#aaa;">${new Date(t.data).toLocaleString()}</span>
    `;
    historyList.appendChild(li);
  });
}

// DEPÓSITO
async function depositarSaldo(e) {
  e.preventDefault();
  showLoading(true);
  const valor = parseFloat(document.getElementById('depositar-valor').value);
  const via = document.getElementById('depositar-via').value;
  const res = await fetch(api + '/wallet/deposit', {
    method: 'POST',
    headers: {
      'Content-Type':'application/json',
      'Authorization': getToken()
    },
    body: JSON.stringify({valor, via})
  });
  const data = await res.json();
  showLoading(false);
  const feedback = document.getElementById('depositar-feedback');
  if (data.saldo !== undefined) {
    feedback.style.color = 'var(--success)';
    feedback.innerText = 'Depósito realizado!';
    playNotif();
    setTimeout(() => { resetDepositarForm(); window.location.reload(); }, 1200);
  } else {
    feedback.style.color = 'var(--danger)';
    feedback.innerText = data.error || 'Erro!';
  }
}
function resetDepositarForm() {
  document.getElementById('modal-depositar').classList.add('hidden');
  document.getElementById('depositar-form').reset();
  document.getElementById('depositar-step1').classList.remove('hidden');
  document.getElementById('depositar-form').classList.add('hidden');
  document.getElementById('depositar-feedback').innerText = '';
  document.getElementById('depositar-via-label').innerText = '';
  const viaBtns = document.querySelectorAll('#depositar-step1 .via-btn');
  viaBtns.forEach(b => b.classList.remove('selected'));
}

// LEVANTAR
async function levantarSaldo(e) {
  e.preventDefault();
  showLoading(true);
  const valor = parseFloat(document.getElementById('levantar-valor').value);
  const via = document.getElementById('levantar-via').value;
  const res = await fetch(api + '/wallet/withdraw', {
    method: 'POST',
    headers: {
      'Content-Type':'application/json',
      'Authorization': getToken()
    },
    body: JSON.stringify({valor, via})
  });
  const data = await res.json();
  showLoading(false);
  const feedback = document.getElementById('levantar-feedback');
  if (data.saldo !== undefined) {
    feedback.style.color = 'var(--success)';
    feedback.innerText = 'Levantamento realizado!';
    playNotif();
    setTimeout(() => { resetLevantarForm(); window.location.reload(); }, 1200);
  } else {
    feedback.style.color = 'var(--danger)';
    feedback.innerText = data.error || 'Erro!';
  }
}
function resetLevantarForm() {
  document.getElementById('modal-levantar').classList.add('hidden');
  document.getElementById('levantar-form').reset();
  document.getElementById('levantar-step1').classList.remove('hidden');
  document.getElementById('levantar-form').classList.add('hidden');
  document.getElementById('levantar-feedback').innerText = '';
  document.getElementById('levantar-via-label').innerText = '';
  const viaBtns = document.querySelectorAll('#levantar-step1 .via-btn');
  viaBtns.forEach(b => b.classList.remove('selected'));
}

// ENVIAR DINHEIRO
async function enviarDinheiro(e) {
  e.preventDefault();
  showLoading(true);
  const destino = document.getElementById('envio-user').value.trim();
  const valor = parseFloat(document.getElementById('envio-valor').value);
  const via = document.getElementById('envio-via').value;
  const res = await fetch(api + '/wallet/send', {
    method: 'POST',
    headers: {
      'Content-Type':'application/json',
      'Authorization': getToken()
    },
    body: JSON.stringify({valor, destino, via})
  });
  const data = await res.json();
  showLoading(false);
  const feedback = document.getElementById('envio-feedback');
  if (data.saldo !== undefined) {
    feedback.style.color = 'var(--success)';
    feedback.innerText = 'Enviado com sucesso!';
    playNotif();
    setTimeout(() => { resetEnvioForm(); window.location.reload(); }, 1200);
  } else {
    feedback.style.color = 'var(--danger)';
    feedback.innerText = data.error || 'Erro!';
  }
}
function resetEnvioForm() {
  document.getElementById('modal-envio').classList.add('hidden');
  document.getElementById('enviar-form').reset();
  document.getElementById('envio-feedback').innerText = '';
}

// PERFIL
function resetPerfilForm() {
  document.getElementById('modal-perfil').classList.add('hidden');
  document.getElementById('perfil-form').reset();
  document.getElementById('perfil-feedback').innerText = '';
}
async function atualizarPerfil(e) {
  e.preventDefault();
  showLoading(true);
  const username = document.getElementById('perfil-username').value.trim();
  const email = document.getElementById('perfil-email').value.trim();
  const senha = document.getElementById('perfil-nova-senha').value;
  const res = await fetch(api + '/wallet/profile', {
    method: 'PUT',
    headers: {
      'Content-Type':'application/json',
      'Authorization': getToken()
    },
    body: JSON.stringify({username, email, senha})
  });
  const data = await res.json();
  showLoading(false);
  const feedback = document.getElementById('perfil-feedback');
  if (data.sucesso) {
    feedback.style.color = 'var(--success)';
    feedback.innerText = 'Perfil atualizado!';
    setTimeout(() => { resetPerfilForm(); window.location.reload(); }, 1200);
  } else {
    feedback.style.color = 'var(--danger)';
    feedback.innerText = data.error || 'Erro!';
  }
}

// Login e Cadastro
function loginPage() {
  const form = document.getElementById('loginForm');
  form.onsubmit = async function(e) {
    e.preventDefault();
    showLoading(true);
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;
    const res = await fetch(api + '/auth/login', {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({email, password})
    });
    const data = await res.json();
    showLoading(false);
    if (data.token) {
      saveToken(data.token);
      window.location = "dashboard.html";
    } else {
      document.getElementById('login-feedback').innerText = data.error || 'Erro!';
    }
  }
}
function signupPage() {
  const form = document.getElementById('signupForm');
  form.onsubmit = async function(e) {
    e.preventDefault();
    showLoading(true);
    const username = document.getElementById('signup-username').value.trim();
    const email = document.getElementById('signup-email').value.trim();
    const password = document.getElementById('signup-password').value;
    const res = await fetch(api + '/auth/signup', {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({username, email, password})
    });
    const data = await res.json();
    showLoading(false);
    if (data.message) {
      document.getElementById('signup-feedback').innerText = "Cadastro realizado! Faça login.";
      setTimeout(()=>window.location="login.html", 1300);
    } else {
      document.getElementById('signup-feedback').innerText = data.error || 'Erro!';
    }
  }
}