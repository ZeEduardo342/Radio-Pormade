// Substitua as chaves abaixo pelas suas credenciais do Firebase
// Este arquivo deve ser carregado antes de 'admin.js' e 'player.js'

const firebaseConfig = {
  apiKey: "AIzaSyBlkFAWHfBkYi7NPp1fVQAO4GNIqQjnrR4",
  authDomain: "radio-pormade.firebaseapp.com",
  projectId: "radio-pormade",
  storageBucket: "radio-pormade.firebasestorage.app",
  messagingSenderId: "615920476920",
  appId: "1:615920476920:web:b3609f7958d7fe010c510d"
};

// Inicializa o Firebase
firebase.initializeApp(firebaseConfig);

// Referência ao Firestore
const db = firebase.firestore();

// Nome da coleção conforme o briefing
const COLLECTION_NAME = "musicas";
