// Relógio em tempo real
function atualizarDataHora() {
  const agora = new Date();
  const elementoDH = document.getElementById('data-hora-atual');
  if (elementoDH) {
    elementoDH.innerText = agora.toLocaleString('pt-BR');
  }
}
setInterval(atualizarDataHora, 1000);
atualizarDataHora();

// Lista dos IDs dos candidatos
const candidatos = [
  'lula', 'flavio', 'caiado', 'renan', 'zema', 'samara', 'cury', 
  'clariana', 'edmilson', 'hertz', 'marcal', 'rui', 'grassi', 
  'brancos_nulos', 'nao_sabem'
];

// Estado local dos votos (pode ser integrado com Firebase)
let contagemVotos = {};
candidatos.forEach(id => contagemVotos[id] = 0);

function atualizarInterface() {
  let votosTotais = 0;
  candidatos.forEach(id => {
    votosTotais += contagemVotos[id];
  });

  const totalGeralEl = document.getElementById('total-geral');
  if (totalGeralEl) totalGeralEl.innerText = votosTotais;

  // Atualiza as barras de progresso e as porcentagens em número inteiro estilo TV
  candidatos.forEach(id => {
    const qtdVotos = contagemVotos[id];
    const porcentagem = votosTotais > 0 ? Math.round((qtdVotos / votosTotais) * 100) : 0;

    const spanStats = document.getElementById(`stats-${id}`);
    const barFill = document.getElementById(`bar-${id}`);
    const cardElement = document.getElementById(`card-${id}`);

    if (spanStats) spanStats.innerText = `${porcentagem}%`;
    if (barFill) barFill.style.width = `${porcentagem}%`;
    if (cardElement) cardElement.setAttribute('data-votos', qtdVotos);
  });

  // Reordena dinamicamente os cards pelo número de votos
  const container = document.getElementById('opcoes-votacao');
  const cards = Array.from(container.children);
  
  cards.sort((a, b) => {
    const votosA = parseInt(a.getAttribute('data-votos')) || 0;
    const votosB = parseInt(b.getAttribute('data-votos')) || 0;
    return votosB - votosA;
  });

  cards.forEach(card => container.appendChild(card));
}

// Configuração dos eventos dos botões de voto
candidatos.forEach(id => {
  const btn = document.getElementById(`btn-${id}`);
  if (btn) {
    btn.addEventListener('click', () => {
      contagemVotos[id]++;
      const msg = document.getElementById('mensagem');
      if (msg) {
        msg.innerText = "Voto computado com sucesso!";
        setTimeout(() => { msg.innerText = ""; }, 3000);
      }
      atualizarInterface();
    });
  }
});

// Compartilhamento
const btnCompartilhar = document.getElementById('btn-compartilhar');
if (btnCompartilhar) {
  btnCompartilhar.addEventListener('click', () => {
    if (navigator.share) {
      navigator.share({
        title: 'SimulaVoto 2026',
        text: 'Confira os resultados parciais da enquete de intenção de voto!',
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Link copiado para a área de transferência!');
    }
  });
}

atualizarInterface();
