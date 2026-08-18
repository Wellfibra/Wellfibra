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

// Estado local dos votos
let contagemVotos = {};
candidatos.forEach(id => contagemVotos[id] = 0);

function reordenarComAnimacao() {
  const container = document.getElementById('opcoes-votacao');
  const cards = Array.from(container.children);

  // Mapeia posições iniciais
  const posicoesIniciais = new Map();
  cards.forEach(card => {
    posicoesIniciais.set(card.id, card.getBoundingClientRect().top);
  });

  // Ordena os elementos do maior número de votos para o menor
  cards.sort((a, b) => {
    const votosA = parseInt(a.getAttribute('data-votos')) || 0;
    const votosB = parseInt(b.getAttribute('data-votos')) || 0;
    return votosB - votosA;
  });

  // Reorganiza na árvore DOM
  cards.forEach(card => container.appendChild(card));

  // Aplica transição suave de descolamento (FLIP Animation)
  cards.forEach(card => {
    const posicaoInicial = posicoesIniciais.get(card.id);
    const posicaoFinal = card.getBoundingClientRect().top;
    const deslocamentoY = posicaoInicial - posicaoFinal;

    if (deslocamentoY !== 0) {
      card.style.transform = `translateY(${deslocamentoY}px)`;
      card.style.transition = 'none';

      requestAnimationFrame(() => {
        card.style.transition = 'transform 0.6s cubic-bezier(0.2, 0, 0.2, 1)';
        card.style.transform = '';
      });
    }
  });
}

function atualizarInterface(idVotado = null) {
  let votosTotais = 0;
  candidatos.forEach(id => {
    votosTotais += contagemVotos[id];
  });

  const totalGeralEl = document.getElementById('total-geral');
  if (totalGeralEl) totalGeralEl.innerText = votosTotais;

  candidatos.forEach(id => {
    const qtdVotos = contagemVotos[id];
    const porcentagem = votosTotais > 0 ? Math.round((qtdVotos / votosTotais) * 100) : 0;

    const spanStats = document.getElementById(`stats-${id}`);
    const barFill = document.getElementById(`bar-${id}`);
    const cardElement = document.getElementById(`card-${id}`);

    if (spanStats) {
      const textoAnterior = spanStats.innerText;
      const novoTexto = `${porcentagem}%`;
      
      spanStats.innerText = novoTexto;

      // Animação no texto da porcentagem caso tenha mudado
      if (textoAnterior !== novoTexto || id === idVotado) {
        spanStats.classList.remove('porcentagem-animada');
        void spanStats.offsetWidth; // Força re-flow para reiniciar CSS animation
        spanStats.classList.add('porcentagem-animada');
      }
    }

    if (barFill) barFill.style.width = `${porcentagem}%`;
    if (cardElement) cardElement.setAttribute('data-votos', qtdVotos);
  });

  // Quem tiver mais votos vai para o topo com animação
  reordenarComAnimacao();
}

// Configuração dos eventos dos botões de voto
candidatos.forEach(id => {
  const btn = document.getElementById(`btn-${id}`);
  if (btn) {
    btn.addEventListener('click', () => {
      contagemVotos[id]++;

      const msg = document.getElementById('mensagem');
      if (msg) {
        msg.innerText = "✓ Voto computado!";
        msg.style.opacity = '1';
        setTimeout(() => { msg.style.opacity = '0'; }, 2000);
      }

      atualizarInterface(id);
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
