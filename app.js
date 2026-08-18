import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
  getFirestore, 
  doc, 
  onSnapshot, 
  updateDoc, 
  increment, 
  setDoc 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Configuração do seu projeto Firebase
const firebaseConfig = {
  apiKey: "SUA_API_KEY",
  authDomain: "SEU_PROJETO.firebaseapp.com",
  projectId: "SEU_PROJETO",
  storageBucket: "SEU_PROJETO.appspot.com",
  messagingSenderId: "SEU_SENDER_ID",
  appId: "SEU_APP_ID"
};

// Inicializa o Firebase e o Firestore
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const pesquisaRef = doc(db, "pesquisas", "eleicao2026");

// Relógio em tempo real
function atualizarDataHora() {
  const elementoDH = document.getElementById('data-hora-atual');
  if (elementoDH) {
    elementoDH.innerText = new Date().toLocaleString('pt-BR');
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

// Função para reordenar os cards com animação suave (FLIP)
function reordenarComAnimacao() {
  const container = document.getElementById('opcoes-votacao');
  if (!container) return;
  const cards = Array.from(container.children);

  const posicoesIniciais = new Map();
  cards.forEach(card => {
    posicoesIniciais.set(card.id, card.getBoundingClientRect().top);
  });

  cards.sort((a, b) => {
    const votosA = parseInt(a.getAttribute('data-votos')) || 0;
    const votosB = parseInt(b.getAttribute('data-votos')) || 0;
    return votosB - votosA;
  });

  cards.forEach(card => container.appendChild(card));

  cards.forEach(card => {
    const posicaoInicial = posicoesIniciais.get(card.id);
    const posicaoFinal = card.getBoundingClientRect().top;
    const deslocamentoY = posicaoInicial - posicaoFinal;

    if (deslocamentoY !== 0) {
      card.style.transform = `translateY(${deslocamentoY}px)`;
      card.style.transition = 'none';

      requestAnimationFrame(() => {
        card.style.transform = '';
        card.style.transition = 'transform 0.6s cubic-bezier(0.2, 0, 0.2, 1)';
      });
    }
  });
}

// Escuta as alterações no Firebase em tempo real (Sincronização)
onSnapshot(pesquisaRef, (docSnap) => {
  if (docSnap.exists()) {
    const dados = docSnap.data();
    let votosTotais = 0;

    candidatos.forEach(id => {
      votosTotais += dados[id] || 0;
    });

    const totalGeralEl = document.getElementById('total-geral');
    if (totalGeralEl) totalGeralEl.innerText = votosTotais;

    candidatos.forEach(id => {
      const qtdVotos = dados[id] || 0;
      const porcentagem = votosTotais > 0 ? Math.round((qtdVotos / votosTotais) * 100) : 0;

      const spanStats = document.getElementById(`stats-${id}`);
      const barFill = document.getElementById(`bar-${id}`);
      const cardElement = document.getElementById(`card-${id}`);

      if (spanStats) {
        const textoAnterior = spanStats.innerText;
        const novoTexto = `${porcentagem}%`;
        
        spanStats.innerText = novoTexto;

        if (textoAnterior !== novoTexto) {
          spanStats.classList.remove('porcentagem-animada');
          void spanStats.offsetWidth;
          spanStats.classList.add('porcentagem-animada');
        }
      }

      if (barFill) barFill.style.width = `${porcentagem}%`;
      if (cardElement) cardElement.setAttribute('data-votos', qtdVotos);
    });

    reordenarComAnimacao();
  } else {
    // Cria o documento inicial no Firestore caso ainda não exista
    const dadosIniciais = {};
    candidatos.forEach(id => dadosIniciais[id] = 0);
    setDoc(pesquisaRef, dadosIniciais);
  }
});

// Função para registrar o voto no Firestore com incremento atômico
async function registrarVoto(candidatoId) {
  try {
    await updateDoc(pesquisaRef, {
      [candidatoId]: increment(1)
    });

    const msg = document.getElementById('mensagem');
    if (msg) {
      msg.innerText = "✓ Voto computado e sincronizado!";
      msg.style.opacity = '1';
      setTimeout(() => { msg.style.opacity = '0'; }, 2000);
    }
  } catch (error) {
    console.error("Erro ao registrar voto no Firebase:", error);
  }
}

// Evento de clique nos botões de votação
candidatos.forEach(id => {
  const btn = document.getElementById(`btn-${id}`);
  if (btn) {
    btn.addEventListener('click', () => registrarVoto(id));
  }
});

// Botão de compartilhamento
const btnCompartilhar = document.getElementById('btn-compartilhar');
if (btnCompartilhar) {
  btnCompartilhar.addEventListener('click', () => {
    if (navigator.share) {
      navigator.share({
        title: 'SimulaVoto 2026',
        text: 'Confira os resultados em tempo real da enquete!',
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Link copiado!');
    }
  });
}
