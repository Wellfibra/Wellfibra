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

const candidatos = ['flavio', 'renan', 'lula', 'branco', 'nulo'];

// Escuta as alterações no Firestore em tempo real
onSnapshot(collection(db, 'votacao'), (snapshot) => {
  let votosTotais = 0;
  const contagemVotos = { flavio: 0, renan: 0, lula: 0, branco: 0, nulo: 0 };

  snapshot.forEach((docSnap) => {
    const id = docSnap.id;
    const data = docSnap.data();
    if (contagemVotos.hasOwnProperty(id)) {
      contagemVotos[id] = data.votos || 0;
      votosTotais += data.votos || 0;
    }
  });

  document.getElementById('total-geral').innerText = votosTotais;

  // Atualiza as estatísticas e grava a quantidade de votos no atributo do elemento
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

  // Reordena os elementos na tela do mais votado para o menos votado
  reordenarCandidatos();
});

function reordenarCandidatos() {
  const container = document.getElementById('opcoes-votacao');
  const cards = Array.from(container.getElementsByClassName('card'));

  // Ordenação decrescente com base no atributo data-votos
  cards.sort((a, b) => {
    const votosA = parseInt(a.getAttribute('data-votos')) || 0;
    const votosB = parseInt(b.getAttribute('data-votos')) || 0;
    return votosB - votosA;
  });

  // Anexa os cards na nova ordem dentro do container
  cards.forEach(card => container.appendChild(card));
}

async function processarVoto(opcao) {
  if (localStorage.getItem('ja_votou') === 'true') {
    alert("Você já registrou seu voto anteriormente!");
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

    localStorage.setItem('ja_votou', 'true');
    verificarVoto();
  } catch (error) {
    console.error("Erro ao votar:", error);
    alert("Ocorreu um erro ao registrar seu voto.");
  }
}

function verificarVoto() {
  if (localStorage.getItem('ja_votou') === 'true') {
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
