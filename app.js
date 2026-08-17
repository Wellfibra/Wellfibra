import { initializeApp } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js";
import { 
  getFirestore, 
  collection, 
  doc, 
  updateDoc, 
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

// Lista atualizada de IDs
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

  document.getElementById('total-geral').innerText = votosTotais;

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
  const cards = Array.from(container.getElementsByClassName('card'));

  cards.sort((a, b) => {
    const votosA = parseInt(a.getAttribute('data-votos')) || 0;
    const votosB = parseInt(b.getAttribute('data-votos')) || 0;
    return votosB - votosA;
  });

  cards.forEach(card => container.appendChild(card));
}

// Checa empate de liderança para projeção de 2º Turno
function verificarSegundoTurno(contagem, total) {
  const box = document.getElementById('segundo-turno-box');
  const texto = document.getElementById('texto-empate');

  if (total === 0) {
    box.style.display = 'none';
    return;
  }

  // Considera apenas candidatos nomeados (exclui brancos/nulos e não sabem)
  const apenasCandidatos = Object.keys(nomesExibicao).map(id => ({
    id,
    nome: nomesExibicao[id],
    votos: contagem[id] || 0
  })).sort((a, b) => b.votos - a.votos);

  const primeiro = apenasCandidatos[0];
  const segundo = apenasCandidatos[1];

  // Exibe alerta de empate caso haja votos e os 2 primeiros estejam igualados
  if (primeiro.votos > 0 && primeiro.votos === segundo.votos) {
    box.style.display = 'block';
    texto.innerText = `Empate técnico na liderança entre ${primeiro.nome} e ${segundo.nome} (${primeiro.votos} votos cada).`;
  } else {
    box.style.display = 'none';
  }
}

async function processarVoto(opcao) {
  if (localStorage.getItem('ja_votou_pesquisa_2026') === 'true') {
    alert("Você já registrou seu voto nesta pesquisa!");
    return;
  }

  if (!confirm("Tem certeza do seu voto? Não será possível alterar depois.")) {
    return;
  }

  try {
    const docRef = doc(db, 'votacao', opcao);
    
    await updateDoc(docRef, {
      votos: increment(1)
    });

    localStorage.setItem('ja_votou_pesquisa_2026', 'true');
    verificarVoto();
  } catch (error) {
    console.error("Erro ao votar:", error);
    alert("Ocorreu um erro ao registrar seu voto.");
  }
}

function verificarVoto() {
  if (localStorage.getItem('ja_votou_pesquisa_2026') === 'true') {
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
