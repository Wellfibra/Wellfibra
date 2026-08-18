import { initializeApp } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js";
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  increment, 
  onSnapshot 
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDB76IXhjcjaa7FQVpSiYN4cF-YFcRB2J0",
  authDomain: "sistema-votacao-562ec.firebaseapp.com",
  projectId: "sistema-votacao-562ec",
  storageBucket: "sistema-votacao-562ec.firebasestorage.app",
  messagingSenderId: "181737767025",
  appId: "1:181737767025:web:5d633486e1a36c417ddbd0"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const candidatos = [
  'lula', 'clariana', 'edmilson', 'cury', 'flavio', 
  'hertz', 'marcal', 'renan', 'zema', 'caiado', 
  'rui', 'samara', 'grassi', 'brancos_nulos', 'nao_sabem'
];

const nomesExibicao = {
  lula: 'Luiz Inácio Lula da Silva',
  clariana: 'Clariana Barão',
  edmilson: 'Edmilson Costa',
  cury: 'Escritor Augusto Cury',
  flavio: 'Flávio Bolsonaro',
  hertz: 'Hertz Dias',
  marcal: 'Pablo Marçal',
  renan: 'Renan Santos',
  zema: 'Romeu Zema',
  caiado: 'Ronaldo Caiado',
  rui: 'Rui Costa Pimenta',
  samara: 'Samara Martins',
  grassi: 'Wilson Grassi'
};

// Relógio com Data e Hora em Tempo Real
function atualizarDataHora() {
  const agora = new Date();
  const dataFormatada = agora.toLocaleDateString('pt-BR', {
    weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric'
  });
  const horaFormatada = agora.toLocaleTimeString('pt-BR');
  
  const elem = document.getElementById('data-hora-atual');
  if (elem) {
    elem.innerText = `${dataFormatada.toUpperCase()} - ${horaFormatada}`;
  }
}
setInterval(atualizarDataHora, 1000);
atualizarDataHora();

// Função de Compartilhamento
const btnCompartilhar = document.getElementById('btn-compartilhar');
if (btnCompartilhar) {
  btnCompartilhar.addEventListener('click', async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'SimulaVoto 2026',
          text: 'Acesse a pesquisa em tempo real e vote no SimulaVoto 2026:',
          url: window.location.href,
        });
      } catch (err) {
        console.log('Compartilhamento cancelado');
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Link da pesquisa copiado para a área de transferência!');
    }
  });
}

// Monitoramento dos Votos via Firestore
onSnapshot(collection(db, 'votacao'), (snapshot) => {
  let votosTotais = 0;
  const contagemVotos = {};
  candidatos.forEach(id => contagemVotos[id] = 0);

  snapshot.forEach((docSnap) => {
    const id = docSnap.id;
    const data = docSnap.data();
    if (contagemVotos.hasOwnProperty(id)) {
      contagemVotos[id] = data.votos || 0;
      votosTotais += data.votos || 0;
    }
  });

  const totalElem = document.getElementById('total-geral');
  if (totalElem) totalElem.innerText = votosTotais;

  candidatos.forEach((id) => {
    const qtdVotos = contagemVotos[id];
    const porcentagem = votosTotais > 0 ? ((qtdVotos / votosTotais) * 100).toFixed(1) : 0;

    const spanStats = document.getElementById(`stats-${id}`);
    const barFill = document.getElementById(`bar-${id}`);
    const cardElement = document.getElementById(`card-${id}`);

    if (spanStats) spanStats.innerText = `${qtdVotos} votos (${porcentagem}%)`;
    if (barFill) barFill.style.width = `${porcentagem}%`;
    if (cardElement) cardElement.setAttribute('data-votos', qtdVotos);
  });

  reordenarCandidatos();
  verificarSegundoTurno(contagemVotos, votosTotais);
});

function reordenarCandidatos() {
  const container = document.getElementById('opcoes-votacao');
  if (!container) return;
  
  const cards = Array.from(container.getElementsByClassName('card'));

  cards.sort((a, b) => {
    const votosA = parseInt(a.getAttribute('data-votos')) || 0;
    const votosB = parseInt(b.getAttribute('data-votos')) || 0;
    return votosB - votosA;
  });

  cards.forEach(card => container.appendChild(card));
}

function verificarSegundoTurno(contagem, total) {
  const box = document.getElementById('segundo-turno-box');
  const texto = document.getElementById('texto-empate');

  if (!box || !texto || total === 0) {
    if (box) box.style.display = 'none';
    return;
  }

  const apenasCandidatos = Object.keys(nomesExibicao).map(id => ({
    id,
    nome: nomesExibicao[id],
    votos: contagem[id] || 0
  })).sort((a, b) => b.votos - a.votos);

  const primeiro = apenasCandidatos[0];
  const segundo = apenasCandidatos[1];

  if (primeiro.votos > 0 && primeiro.votos === segundo.votos) {
    box.style.display = 'block';
    texto.innerText = `Empate técnico na liderança entre ${primeiro.nome} e ${segundo.nome} (${primeiro.votos} votos cada).`;
  } else {
    box.style.display = 'none';
  }
}

async function processarVoto(opcao) {
  if (localStorage.getItem('ja_votou_simulavoto_2026') === 'true') {
    alert("Você já registrou seu voto nesta pesquisa!");
    return;
  }

  if (!confirm("Tem certeza do seu voto? Não será possível alterar depois.")) {
    return;
  }

  try {
    const docRef = doc(db, 'votacao', opcao);
    
    await setDoc(docRef, {
      votos: increment(1)
    }, { merge: true });

    localStorage.setItem('ja_votou_simulavoto_2026', 'true');
    verificarVoto();
  } catch (error) {
    console.error("Erro ao votar:", error);
    alert("Ocorreu um erro ao registrar seu voto.");
  }
}

function verificarVoto() {
  if (localStorage.getItem('ja_votou_simulavoto_2026') === 'true') {
    const msg = document.getElementById('mensagem');
    if (msg) msg.innerText = "Você já registrou seu voto!";
    
    candidatos.forEach((id) => {
      const btn = document.getElementById(`btn-${id}`);
      if (btn) btn.style.display = 'none';
    });
  }
}

candidatos.forEach((id) => {
  const btn = document.getElementById(`btn-${id}`);
  if (btn) {
    btn.addEventListener('click', () => processarVoto(id));
  }
});

verificarVoto();
