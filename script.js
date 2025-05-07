// Tenta inicializar o Firebase Auth e Firestore.
let auth = null;
let db = null;

try {
    // Usa a variável appFirebase inicializada no HTML
    if (typeof appFirebase !== 'undefined' && firebase.apps.length > 0) {
        auth = firebase.auth();
        db = firebase.firestore();
        console.log("Serviços Firebase (auth, firestore) referenciados a partir do app inicializado no HTML.");
    } else if (typeof firebase !== 'undefined' && firebase.apps.length === 0) {
         console.warn("Firebase SDK carregado, mas appFirebase não foi inicializado com sucesso no HTML. Verifique a inicialização e as chaves.");
    } else {
        console.warn("Firebase SDK não parece estar carregado ou appFirebase não foi definido no HTML.");
    }
} catch (e) {
    console.error("Erro ao obter instâncias dos serviços Firebase:", e);
}

// Variáveis Globais do Quiz (para serem acessadas por todas as funções)
let todasQuestoes = typeof questoes !== 'undefined' ? [...questoes] : []; // VEM DE QUESTOES.JS
let questaoAtualObj = null;
let indiceQuestaoAtual = 0;
let questoesFiltradas = [];
let progressoGeral = {}; // Será populado por carregarProgresso
let temaSelecionado = 'todos';
let temaOriginalAntesRefazer = 'todos';
let modoRefazerErradas = false;
const localStorageKeyBase = 'quizAFTProgresso_';
const firebaseCollection = 'estatisticasUsuarios'; // Nome da coleção no Firestore

// --- Elementos Globais do DOM (Definidos aqui para fácil acesso) ---
let perguntaTexto, alternativasForm, responderBtn, proximaQuestaoBtn, pularBtn, resultadoDiv, mensagemResultado, gabaritoTexto, mensagemFim, filtroTema, questaoAtualSpan, totalQuestoesTemaSpan, temaAtualSpan, statusBateriaSpan, questoesResolvidasTemaSpan, acertosTemaSpan, incorretasTemaSpan, globRespondidasSpan, globAcertosSpan, globErrosSpan, aleatoriaQuestaoBtn, proximoTemaBtn, userEmailDisplaySpan, authMessageSpan, loginFormDiv, userInfoDiv, emailInput, passwordInput, loginBtn, registerBtn, logoutBtn, questoesErradasContainer, erradasContentDiv, numQuestoesErradasSpan, iniciarRefazerBtn, adminToggle, adminContent, adicionarQuestaoBtn, resetarProgressoBtn, carregarQuestoesBtn, arquivoQuestoesInput, mensagemCarregamentoDiv, formularioQuestaoDiv, tipoQuestaoSelect, temaInput, perguntaTextarea, alternativasMultiplaEscolhaDiv, alternativa1Input, alternativa2Input, alternativa3Input, alternativa4Input, alternativa5Input, alternativasCertoErradoDiv, respostaCorretaInput, gabaritoComentadoTextarea, salvarQuestaoBtn, cancelarQuestaoBtn, perguntaAutorDiv;
// Removido: reportarErroLinkA - pois foi movido para o HTML e não precisa ser manipulado aqui para o link em si

function mapearElementosDOM() {
    perguntaTexto = document.getElementById('pergunta-texto');
    alternativasForm = document.getElementById('alternativas');
    responderBtn = document.getElementById('responder-btn');
    proximaQuestaoBtn = document.getElementById('proxima-questao-btn');
    pularBtn = document.getElementById('pular-btn');
    resultadoDiv = document.getElementById('resultado');
    mensagemResultado = document.getElementById('mensagem-resultado');
    gabaritoTexto = document.getElementById('gabarito');
    mensagemFim = document.getElementById('mensagem-fim');
    filtroTema = document.getElementById('filtro-tema');
    questaoAtualSpan = document.getElementById('questao-atual');
    totalQuestoesTemaSpan = document.getElementById('total-questoes-tema');
    temaAtualSpan = document.getElementById('tema-atual');
    statusBateriaSpan = document.getElementById('status-bateria');
    questoesResolvidasTemaSpan = document.getElementById('questoes-resolvidas-tema');
    acertosTemaSpan = document.getElementById('acertos-tema');
    incorretasTemaSpan = document.getElementById('incorretas-tema');
    globRespondidasSpan = document.getElementById('glob-respondidas');
    globAcertosSpan = document.getElementById('glob-acertos');
    globErrosSpan = document.getElementById('glob-erros');
    aleatoriaQuestaoBtn = document.getElementById('aleatoria-questao-btn');
    proximoTemaBtn = document.getElementById('proximo-tema-btn');
    userEmailDisplaySpan = document.getElementById('user-email-display');
    authMessageSpan = document.getElementById('auth-message');
    loginFormDiv = document.getElementById('login-form');
    userInfoDiv = document.getElementById('user-info');
    emailInput = document.getElementById('email');
    passwordInput = document.getElementById('password');
    loginBtn = document.getElementById('login-btn');
    registerBtn = document.getElementById('register-btn');
    logoutBtn = document.getElementById('logout-btn');
    questoesErradasContainer = document.getElementById('questoes-erradas-container');
    erradasContentDiv = document.getElementById('erradas-content');
    numQuestoesErradasSpan = document.getElementById('num-questoes-erradas');
    iniciarRefazerBtn = document.getElementById('iniciar-refazer-btn');
    adminToggle = document.getElementById('admin-toggle');
    adminContent = document.getElementById('admin-content');
    adicionarQuestaoBtn = document.getElementById('adicionar-questao-btn');
    resetarProgressoBtn = document.getElementById('resetar-progresso-btn');
    carregarQuestoesBtn = document.getElementById('carregar-questoes-btn');
    arquivoQuestoesInput = document.getElementById('arquivo-questoes');
    mensagemCarregamentoDiv = document.getElementById('mensagem-carregamento');
    formularioQuestaoDiv = document.getElementById('formulario-questao');
    tipoQuestaoSelect = document.getElementById('tipo-questao');
    temaInput = document.getElementById('tema');
    perguntaTextarea = document.getElementById('pergunta');
    alternativasMultiplaEscolhaDiv = document.getElementById('alternativas-multipla-escolha');
    alternativa1Input = document.getElementById('alternativa1');
    alternativa2Input = document.getElementById('alternativa2');
    alternativa3Input = document.getElementById('alternativa3');
    alternativa4Input = document.getElementById('alternativa4');
    alternativa5Input = document.getElementById('alternativa5');
    alternativasCertoErradoDiv = document.getElementById('alternativas-certo-errado');
    respostaCorretaInput = document.getElementById('resposta-correta');
    gabaritoComentadoTextarea = document.getElementById('gabarito-comentado');
    salvarQuestaoBtn = document.getElementById('salvar-questao-btn');
    cancelarQuestaoBtn = document.getElementById('cancelar-questao-btn');
    perguntaAutorDiv = document.getElementById('pergunta-autor');
}


// --- Funções de Persistência (Definidas ANTES de serem usadas) ---
function getLocalStorageKey() {
    if (auth && auth.currentUser) {
        return `${localStorageKeyBase}${auth.currentUser.uid}`;
    }
    return `${localStorageKeyBase}anonimo`;
}

async function salvarProgresso() {
    const key = getLocalStorageKey();
    // Garantir que progressoGeral e seus campos existam
    progressoGeral = progressoGeral || {};
    progressoGeral.questoesResolvidasIds = progressoGeral.questoesResolvidasIds || new Set();
    progressoGeral.questoesErradas = progressoGeral.questoesErradas || [];
    progressoGeral.ultimoIndicePorTema = progressoGeral.ultimoIndicePorTema || {};
    progressoGeral.estatisticasGerais = progressoGeral.estatisticasGerais || { respondidas: 0, acertos: 0, incorretas: 0, puladas: 0 };
    progressoGeral.respostasUsuario = progressoGeral.respostasUsuario || {}; // Adicionado
    progressoGeral.questoesAdicionadasUsuario = progressoGeral.questoesAdicionadasUsuario || []; // Mantido

    // --- Salvar no Local Storage (MANTENHA como backup ou para anônimos) ---
    const dadosParaSalvarLocal = {
        ...progressoGeral,
        questoesResolvidasIds: Array.from(progressoGeral.questoesResolvidasIds), // Salva como array
        // Salva apenas IDs das erradas no Local Storage para consistência com o carregamento atual
        questoesErradasIds: progressoGeral.questoesErradas.map(q => q.id).filter(id => id), // Garante que IDs existam
        // Salva questões adicionadas no Local Storage também
        questoesAdicionadasUsuario: progressoGeral.questoesAdicionadasUsuario
    };
    localStorage.setItem(key, JSON.stringify(dadosParaSalvarLocal));
    // -----------------------------------------------------------------------

    // --- Salvar no Firebase (Estado mais completo) ---
    if (auth && auth.currentUser && db) {
        const userId = auth.currentUser.uid;
        const dadosParaFirebase = {
            // Dados que já eram salvos:
            temaSelecionado: progressoGeral.temaSelecionado,
            ultimoIndicePorTema: progressoGeral.ultimoIndicePorTema,
            estatisticasGerais: progressoGeral.estatisticasGerais,
            // NOVOS dados para salvar no Firebase:
            questoesResolvidasIds: Array.from(progressoGeral.questoesResolvidasIds), // Salva IDs resolvidos
            questoesErradasIds: progressoGeral.questoesErradas.map(q => q.id).filter(id => id), // Salva IDs errados
            respostasUsuario: progressoGeral.respostasUsuario, // Salva as respostas do usuário
            // Salvar questões adicionadas pelo usuário no Firebase? (OPCIONAL, pode gerar documentos grandes)
            // questoesAdicionadasUsuario: progressoGeral.questoesAdicionadasUsuario, // Descomente se desejar salvar isso online
            lastUpdated: firebase.firestore.FieldValue.serverTimestamp() // Adiciona um timestamp
        };
        try {
            // Use set com merge:true para atualizar ou criar o documento
            await db.collection(firebaseCollection).doc(userId).set(dadosParaFirebase, { merge: true });
            console.log("Progresso completo salvo no Firebase para:", userId); // Log de sucesso
        } catch (error) {
            console.error("Erro ao salvar progresso COMPLETO no Firebase:", error);
            if(authMessageSpan) authMessageSpan.textContent = "Erro ao salvar online. Progresso salvo localmente.";
        }
    }
    // -----------------------------------------------------------------------
}


function resetarVariaveisDeEstadoQuiz(hardReset = false) {
    progressoGeral = {
        questoesResolvidasIds: new Set(),
        questoesErradas: [],
        respostasUsuario: {},
        estatisticasGerais: { respondidas: 0, acertos: 0, incorretas: 0, puladas: 0 },
        temaSelecionado: 'todos',
        ultimoIndicePorTema: {},
        questoesAdicionadasUsuario: hardReset ? [] : (progressoGeral.questoesAdicionadasUsuario || [])
    };
    indiceQuestaoAtual = 0;
    temaSelecionado = 'todos';
    if (filtroTema) filtroTema.value = 'todos';
    modoRefazerErradas = false;
    if (statusBateriaSpan) statusBateriaSpan.textContent = "";

    if (hardReset) {
        const key = getLocalStorageKey();
        localStorage.removeItem(key);
        if(authMessageSpan) authMessageSpan.textContent = 'Progresso local resetado.';
        if (auth && auth.currentUser && db) {
            const userRef = db.collection(firebaseCollection).doc(auth.currentUser.uid);
            userRef.delete()
                .then(() => {
                    if(authMessageSpan) authMessageSpan.textContent = 'Progresso local e online resetado.';
                    console.log("Progresso do Firebase resetado para:", auth.currentUser.uid);
                 })
                .catch(err => {
                    console.error("Erro ao resetar progresso no Firebase:", err);
                    if(authMessageSpan) authMessageSpan.textContent = 'Erro ao resetar progresso online.';
                 });
        }
        // Recarrega as questões base e adicionadas (se houver)
         let baseQuestoes = typeof questoes !== 'undefined' ? [...questoes] : [];
         todasQuestoes = [...baseQuestoes, ...(progressoGeral.questoesAdicionadasUsuario || [])];
        atualizarFiltroTemas();
    } else {
        // Mantém as questões adicionadas pelo usuário se não for hard reset
        const questoesAdicionadas = progressoGeral.questoesAdicionadasUsuario || [];
        let baseQuestoes = typeof questoes !== 'undefined' ? [...questoes] : [];
        todasQuestoes = [...baseQuestoes];
        if (questoesAdicionadas.length > 0) {
            todasQuestoes = todasQuestoes.concat(questoesAdicionadas);
            progressoGeral.questoesAdicionadasUsuario = questoesAdicionadas; // Garante que permaneçam no estado
        }
        atualizarFiltroTemas();
    }
    atualizarContadoresGlobais();
    // Limpa a interface também
    limparAlternativas();
    if (mensagemFim) mensagemFim.style.display = 'none';
    exibirOpcaoRefazerErradas(); // Atualiza a visibilidade/contagem da seção de erradas
}


// --- Funções de Autenticação ---
function setupAuthListeners() {
    if (!auth || !loginBtn || !registerBtn || !logoutBtn) {
        console.error("Erro: Elementos de autenticação ou serviço Auth não encontrados.");
        return;
    }

    loginBtn.addEventListener('click', () => {
        const email = emailInput.value;
        const password = passwordInput.value;
        if (!email || !password) {
            if(authMessageSpan) authMessageSpan.textContent = 'Por favor, preencha email e senha.';
            return;
        }
        if(authMessageSpan) authMessageSpan.textContent = 'Entrando...';
        auth.signInWithEmailAndPassword(email, password)
            .then((userCredential) => {
                if(authMessageSpan) authMessageSpan.textContent = '';
                console.log("Login bem-sucedido:", userCredential.user.email);
            })
            .catch((error) => {
                console.error("Erro no login:", error);
                if(authMessageSpan) authMessageSpan.textContent = `Erro no login: ${error.message}`;
            });
    });

    registerBtn.addEventListener('click', () => {
        const email = emailInput.value;
        const password = passwordInput.value;
         if (!email || !password) {
            if(authMessageSpan) authMessageSpan.textContent = 'Por favor, preencha email e senha para registrar.';
            return;
        }
        if (password.length < 6) {
             if(authMessageSpan) authMessageSpan.textContent = 'A senha deve ter no mínimo 6 caracteres.';
             return;
        }
        if(authMessageSpan) authMessageSpan.textContent = 'Registrando...';
        auth.createUserWithEmailAndPassword(email, password)
            .then((userCredential) => {
                if(authMessageSpan) authMessageSpan.textContent = 'Registro concluído! Logado automaticamente.';
                console.log("Registro bem-sucedido:", userCredential.user.email);
                 if (db) {
                    db.collection(firebaseCollection).doc(userCredential.user.uid).set({
                        email: userCredential.user.email,
                        createdAt: firebase.firestore.FieldValue.serverTimestamp()
                    }).catch(err => console.error("Erro ao criar doc inicial no Firestore:", err));
                 }
            })
            .catch((error) => {
                console.error("Erro no registro:", error);
                if(authMessageSpan) authMessageSpan.textContent = `Erro no registro: ${error.message}`;
            });
    });

    logoutBtn.addEventListener('click', () => {
        // Salva o progresso ANTES de fazer logout
        salvarProgresso().then(() => {
             if(authMessageSpan) authMessageSpan.textContent = 'Saindo...';
             auth.signOut()
                .then(() => {
                    if(authMessageSpan) authMessageSpan.textContent = 'Você saiu.';
                    console.log("Logout bem-sucedido.");
                    // Após o logout, recarrega o progresso (que será o anônimo/local)
                    carregarProgresso();
                })
                .catch((error) => {
                    console.error("Erro no logout:", error);
                    if(authMessageSpan) authMessageSpan.textContent = `Erro ao sair: ${error.message}`;
                });
        }).catch(err => {
            console.error("Erro ao salvar progresso antes do logout:", err);
             // Tenta fazer logout mesmo se o salvamento falhar
             auth.signOut().catch(logoutErr => console.error("Erro no logout após falha no salvamento:", logoutErr));
        });
    });


    auth.onAuthStateChanged((user) => {
        const isAdminSectionOpen = adminContent && adminContent.style.display === 'block'; // Verifica se admin estava aberto

        if (user) {
            console.log("Usuário logado:", user.email);
            if(userEmailDisplaySpan) userEmailDisplaySpan.textContent = user.email;
            if(loginFormDiv) loginFormDiv.style.display = 'none';
            if(userInfoDiv) userInfoDiv.style.display = 'block';
            // Mantém a seção admin aberta se estava antes, senão fecha
             if(adminContent) adminContent.style.display = isAdminSectionOpen ? 'block' : 'none';
             if(adminToggle) {
                const iconSpan = adminToggle.querySelector('.toggle-icon');
                if (iconSpan) iconSpan.textContent = isAdminSectionOpen ? '-' : '+';
             }
            if(adicionarQuestaoBtn) adicionarQuestaoBtn.disabled = false;
            carregarProgresso(); // Carrega o progresso do usuário logado
        } else {
            console.log("Nenhum usuário logado.");
            if(userEmailDisplaySpan) userEmailDisplaySpan.textContent = '';
            if(loginFormDiv) loginFormDiv.style.display = 'block';
            if(userInfoDiv) userInfoDiv.style.display = 'none';
            if(adminContent) adminContent.style.display = 'none'; // Fecha admin ao deslogar
             if(adminToggle) { // Reseta ícone do admin
                const iconSpan = adminToggle.querySelector('.toggle-icon');
                if (iconSpan) iconSpan.textContent = '+';
             }
            if(adicionarQuestaoBtn) adicionarQuestaoBtn.disabled = true;
             if(authMessageSpan && authMessageSpan.textContent === 'Saindo...') authMessageSpan.textContent = 'Você saiu.';
            carregarProgresso(); // Carrega o progresso anônimo/local
        }
    });
}


// --- Funções do Quiz e Lógica Principal ---

function carregarProgresso() {
    const key = getLocalStorageKey();
    // Reseta o estado ANTES de carregar
    resetarVariaveisDeEstadoQuiz(false);

    if (auth && auth.currentUser && db) {
        const userId = auth.currentUser.uid;
        if(authMessageSpan) authMessageSpan.textContent = 'Carregando progresso online...';

        db.collection(firebaseCollection).doc(userId).get()
            .then((doc) => {
                if (doc.exists) {
                    console.log("Dados do Firebase encontrados para:", userId);
                    const dadosFirebase = doc.data();
                    // Carrega TODO o progresso GERAL do Firebase
                    progressoGeral.temaSelecionado = dadosFirebase.temaSelecionado || 'todos';
                    progressoGeral.ultimoIndicePorTema = dadosFirebase.ultimoIndicePorTema || {};
                    progressoGeral.estatisticasGerais = dadosFirebase.estatisticasGerais || { respondidas: 0, acertos: 0, incorretas: 0, puladas: 0 };
                    progressoGeral.questoesResolvidasIds = new Set(dadosFirebase.questoesResolvidasIds || []);
                    progressoGeral.respostasUsuario = dadosFirebase.respostasUsuario || {};

                    // Carrega questões adicionadas do Firebase (SE você decidiu salvar lá)
                    // progressoGeral.questoesAdicionadasUsuario = dadosFirebase.questoesAdicionadasUsuario || [];

                    // --- Carrega questões adicionadas do Local Storage (se não vieram do Firebase) ---
                     if (!progressoGeral.questoesAdicionadasUsuario || progressoGeral.questoesAdicionadasUsuario.length === 0) {
                          const progressoLocalSalvo = localStorage.getItem(key); // Usa a chave do usuário logado
                          if (progressoLocalSalvo) {
                              try {
                                  const progressoLocal = JSON.parse(progressoLocalSalvo);
                                  progressoGeral.questoesAdicionadasUsuario = progressoLocal?.questoesAdicionadasUsuario || [];
                                  console.log("Questões adicionadas carregadas do Local Storage para usuário logado.");
                              } catch(e) { console.error("Erro ao parsear LocalStorage para questões adicionadas (usuário logado):", e); }
                          }
                     }
                    // -------------------------------------------------------------------------------

                    // Reconstrói a lista de questões erradas com base nos IDs salvos no Firebase
                    const idsErradasFirebase = dadosFirebase.questoesErradasIds || [];
                    let baseQuestoes = typeof questoes !== 'undefined' ? [...questoes] : [];
                    todasQuestoes = [...baseQuestoes, ...(progressoGeral.questoesAdicionadasUsuario || [])]; // Recalcula todasQuestoes AQUI
                    progressoGeral.questoesErradas = todasQuestoes.filter(q => q && q.id && idsErradasFirebase.includes(q.id));

                    if(authMessageSpan) authMessageSpan.textContent = 'Progresso online carregado.';
                    finalizarCarregamentoAplicandoDados(); // Aplica os dados carregados

                } else {
                    console.log("Nenhum progresso online encontrado para:", userId, ". Verificando dados locais.");
                    if(authMessageSpan) authMessageSpan.textContent = 'Nenhum progresso online. Verificando dados locais...';
                    // Se não achou no Firebase, TENTA carregar do Local Storage
                    carregarDoLocalStorageInterno(key, true, null); // Passa true para isUserLoggedIn
                }
            })
            .catch((error) => {
                console.error("Erro ao carregar progresso do Firebase:", error);
                if(authMessageSpan) authMessageSpan.textContent = 'Erro ao carregar online. Verificando dados locais.';
                // Em caso de erro ao carregar do Firebase, TENTA carregar do Local Storage
                carregarDoLocalStorageInterno(key, true, null); // Passa true para isUserLoggedIn
            });
    } else {
        // Usuário não logado, carrega apenas do Local Storage
        console.log("Usuário não logado, carregando do Local Storage (anonimo).");
        carregarDoLocalStorageInterno(key, false, null); // Passa false para isUserLoggedIn
    }
}

function carregarDoLocalStorageInterno(key, isUserLoggedIn, dadosFirebasePrioritarios = null) {
    // Se dadosFirebasePrioritarios NÃO for null, significa que o Firebase carregou com sucesso
    // e a função principal `carregarProgresso` já cuidou disso. Não fazemos nada aqui.
    if (dadosFirebasePrioritarios) {
        console.log("Dados do Firebase já foram carregados, pulando carregamento do Local Storage.");
        finalizarCarregamentoAplicandoDados(); // Apenas finaliza a aplicação dos dados
        return;
    }

    // Se chegou aqui, ou o usuário é anônimo, ou o carregamento do Firebase falhou.
    // Tentamos carregar do Local Storage.
    const progressoLocalSalvo = localStorage.getItem(key);
    let progressoCarregadoLocal = null;

    if (progressoLocalSalvo) {
        try {
            progressoCarregadoLocal = JSON.parse(progressoLocalSalvo);
            console.log("Dados do Local Storage carregados para a chave:", key);
        } catch (e) {
            console.error("Erro ao parsear LocalStorage, resetando:", e);
            localStorage.removeItem(key);
        }
    } else {
        console.log("Nenhum dado no Local Storage encontrado para a chave:", key);
    }

    // Preenche o estado progressoGeral com dados locais, se existirem
    if (progressoCarregadoLocal) {
        progressoGeral.temaSelecionado = progressoCarregadoLocal.temaSelecionado || 'todos';
        progressoGeral.ultimoIndicePorTema = progressoCarregadoLocal.ultimoIndicePorTema || {};
        progressoGeral.estatisticasGerais = progressoCarregadoLocal.estatisticasGerais || { respondidas: 0, acertos: 0, incorretas: 0, puladas: 0 };
        progressoGeral.questoesResolvidasIds = new Set(progressoCarregadoLocal.questoesResolvidasIds || []);
        progressoGeral.respostasUsuario = progressoCarregadoLocal.respostasUsuario || {};
        progressoGeral.questoesAdicionadasUsuario = progressoCarregadoLocal.questoesAdicionadasUsuario || [];

        // Reconstrói questões erradas a partir dos IDs do Local Storage
        const idsErradasLocal = progressoCarregadoLocal.questoesErradasIds || [];
        let baseQuestoes = typeof questoes !== 'undefined' ? [...questoes] : [];
        todasQuestoes = [...baseQuestoes, ...(progressoGeral.questoesAdicionadasUsuario || [])]; // Recalcula todasQuestoes AQUI
        progressoGeral.questoesErradas = todasQuestoes.filter(q => q && q.id && idsErradasLocal.includes(q.id));

         if (isUserLoggedIn) { // Se era pra carregar do Firebase mas falhou e achou local
             if(authMessageSpan) authMessageSpan.textContent = 'Progresso local carregado (online falhou).';
         } else { // Se é anônimo e achou local
             if(authMessageSpan) authMessageSpan.textContent = 'Progresso local (anônimo) carregado.';
         }

    } else {
        // Se não achou nem no Firebase (ou falhou) E não achou no Local Storage
        // O estado já foi resetado no início de carregarProgresso
        if (isUserLoggedIn) {
            if(authMessageSpan) authMessageSpan.textContent = 'Nenhum progresso encontrado (online ou local). Iniciando.';
        } else {
            if(authMessageSpan) authMessageSpan.textContent = 'Bem-vindo(a)! Nenhum progresso local.';
        }
    }

    // Finaliza aplicando os dados carregados (do Local Storage ou estado zerado)
    finalizarCarregamentoAplicandoDados();
}



function finalizarCarregamentoAplicandoDados() {
    // Garante que todasQuestoes inclua as adicionadas (sejam do Firebase ou Local Storage)
    let baseQuestoes = typeof questoes !== 'undefined' ? [...questoes] : [];
    todasQuestoes = [...baseQuestoes, ...(progressoGeral.questoesAdicionadasUsuario || [])];
    atualizarFiltroTemas();

    // Aplica o tema selecionado e índice salvo (seja do Firebase ou Local Storage)
    temaSelecionado = progressoGeral.temaSelecionado || 'todos';
    // Garante que o índice não seja maior que o número de questões filtradas após carregar
    const ultimoIndiceSalvo = progressoGeral.ultimoIndicePorTema?.[temaSelecionado] || 0;

    if (filtroTema) filtroTema.value = temaSelecionado;

    // Filtra as questões COM BASE no tema carregado
    filtrarEExibir(ultimoIndiceSalvo); // Passa o índice salvo para filtrarEExibir

    // Atualiza contadores GLOBAIS com base no estado carregado
    atualizarContadoresGlobais();
    // Atualiza a exibição da seção de questões erradas
    exibirOpcaoRefazerErradas();

    console.log("Estado final após carregamento:", progressoGeral);
}


function atualizarContadoresGlobais() {
    if (!progressoGeral || !progressoGeral.estatisticasGerais) {
         progressoGeral = progressoGeral || {};
         progressoGeral.estatisticasGerais = { respondidas: 0, acertos: 0, incorretas: 0, puladas: 0 };
     }
     const { respondidas, acertos, incorretas } = progressoGeral.estatisticasGerais;
     if (globRespondidasSpan) globRespondidasSpan.textContent = respondidas;
     if (globAcertosSpan) globAcertosSpan.textContent = acertos;
     if (globErrosSpan) globErrosSpan.textContent = incorretas;
}

function limparAlternativas() {
    if (!alternativasForm) return;

    const inputs = alternativasForm.querySelectorAll('input[type="radio"]');
    inputs.forEach(input => {
        input.checked = false;
        const label = input.closest('.alternativa-label');
        if (label) {
            label.classList.remove('correta', 'incorreta-usuario');
            label.style.display = ''; // Garante que labels ocultas reapareçam
        }
         const span = label ? label.querySelector('span:not(.letra-alternativa)') : null; // Seleciona o span do TEXTO
         if (span) span.innerHTML = ''; // Limpa o texto anterior (Importante se questão anterior era CE)
    });
    alternativasForm.classList.remove('alternativas-desabilitadas');
    alternativasForm.style.display = 'block'; // Garante que o form esteja visível

    // Adicione esta linha para limpar o estilo do gabarito
    if (gabaritoTexto) {
        gabaritoTexto.classList.remove('gabarito-resposta-incorreta');
        // Se você criou uma classe para resposta correta, remova-a também:
        // gabaritoTexto.classList.remove('gabarito-resposta-correta');
    }

    if (resultadoDiv) resultadoDiv.style.display = 'none';
    if (responderBtn) responderBtn.disabled = true; // Desabilita ao limpar
    if (proximaQuestaoBtn) proximaQuestaoBtn.style.display = 'none';
    if (mensagemFim) mensagemFim.style.display = 'none';
}


function exibirQuestao() {
    limparAlternativas();

    if (!questoesFiltradas || questoesFiltradas.length === 0) {
        if (perguntaTexto) perguntaTexto.textContent = "Nenhuma questão encontrada para este tema ou todas já foram resolvidas.";
        if (questaoAtualSpan) questaoAtualSpan.textContent = '0';
        if (totalQuestoesTemaSpan) totalQuestoesTemaSpan.textContent = '0';
        if (temaAtualSpan) temaAtualSpan.textContent = temaSelecionado === 'todos' ? 'Todas as Matérias' : temaSelecionado;
        if (responderBtn) responderBtn.style.display = 'none';
        if (pularBtn) pularBtn.style.display = 'none';
        if (aleatoriaQuestaoBtn) aleatoriaQuestaoBtn.style.display = 'block';
        if (proximoTemaBtn) proximoTemaBtn.style.display = modoRefazerErradas ? 'none' : 'block';
        if (proximaQuestaoBtn) proximaQuestaoBtn.style.display = 'none';
        if (resultadoDiv) resultadoDiv.style.display = 'none';
        if (mensagemFim) {
             mensagemFim.textContent = modoRefazerErradas ? "Você concluiu a bateria de questões erradas!" : "Você concluiu todas as questões deste tema!";
             mensagemFim.style.display = 'block';
        }
        if(alternativasForm) alternativasForm.style.display = 'none';
         if(perguntaAutorDiv) perguntaAutorDiv.innerHTML = ''; // Limpa autor
        questaoAtualObj = null;
        atualizarContador();
        return;
    }

    // Valida o índice para evitar erros após carregar o progresso
    if (indiceQuestaoAtual < 0 || indiceQuestaoAtual >= questoesFiltradas.length) {
         indiceQuestaoAtual = 0; // Reseta para a primeira se o índice salvo for inválido
         console.warn("Índice da questão inválido após filtragem, resetando para 0.");
         if (!modoRefazerErradas && progressoGeral.ultimoIndicePorTema) {
             progressoGeral.ultimoIndicePorTema[temaSelecionado] = indiceQuestaoAtual; // Salva o índice corrigido
             salvarProgresso();
         }
    }


    if (indiceQuestaoAtual >= questoesFiltradas.length) { // Checa novamente após a correção potencial acima
         if (!modoRefazerErradas) {
            if (mensagemFim) {
                 mensagemFim.textContent = "Você concluiu todas as questões deste tema!";
                 mensagemFim.style.display = 'block';
            }
            if (responderBtn) responderBtn.style.display = 'none';
            if (pularBtn) pularBtn.style.display = 'none';
            if (proximoTemaBtn) proximoTemaBtn.style.display = 'block';
            if (proximaQuestaoBtn) proximaQuestaoBtn.style.display = 'none';
            if (alternativasForm) alternativasForm.style.display = 'none';
             if(perguntaAutorDiv) perguntaAutorDiv.innerHTML = ''; // Limpa autor
            questaoAtualObj = null;
         } else {
            // Concluiu bateria de erradas
            if (mensagemFim) {
                 mensagemFim.textContent = "Você concluiu a bateria de questões erradas!";
                 mensagemFim.style.display = 'block';
            }
             progressoGeral.questoesErradas = []; // Limpa as erradas após refazer
             modoRefazerErradas = false;
             temaSelecionado = temaOriginalAntesRefazer;
             if(filtroTema) {
                 filtroTema.value = temaSelecionado;
                 filtroTema.disabled = false;
             }
             if(document.getElementById('filtros-navegacao')) document.getElementById('filtros-navegacao').style.display = 'flex';
             if(statusBateriaSpan) statusBateriaSpan.textContent = "";
             filtrarEExibir(); // Volta para o tema original
             return; // Evita salvar progresso aqui, pois filtrarEExibir já salva
         }
         atualizarContador();
         exibirOpcaoRefazerErradas(); // Atualiza a exibição (deve mostrar 0 erradas)
         salvarProgresso();
         return;
    }


    questaoAtualObj = questoesFiltradas[indiceQuestaoAtual];

     // Garante que a questão tenha um ID
     if (!questaoAtualObj.id) {
        const timestamp = Date.now();
        const randomPart = Math.random().toString(36).substring(2, 8);
        questaoAtualObj.id = `q_auto_${indiceQuestaoAtual}_${timestamp}_${randomPart}`;
        // Tenta atualizar o ID na lista principal também, se encontrada
        const indexEmTodas = todasQuestoes.findIndex(q => q && q.pergunta === questaoAtualObj.pergunta && q.tema === questaoAtualObj.tema && !q.id);
        if (indexEmTodas > -1 && todasQuestoes[indexEmTodas]) {
             todasQuestoes[indexEmTodas].id = questaoAtualObj.id;
        } else {
            // Se não encontrou na lista principal (pode ser uma questão adicionada),
            // tenta encontrar e atualizar na lista de adicionadas no progressoGeral
            const indexAdicionadas = progressoGeral.questoesAdicionadasUsuario.findIndex(q => q && q.pergunta === questaoAtualObj.pergunta && q.tema === questaoAtualObj.tema && !q.id);
             if (indexAdicionadas > -1 && progressoGeral.questoesAdicionadasUsuario[indexAdicionadas]) {
                 progressoGeral.questoesAdicionadasUsuario[indexAdicionadas].id = questaoAtualObj.id;
             }
        }
        console.warn(`Questão sem ID detectada e ID gerado: ${questaoAtualObj.id}`);
        salvarProgresso(); // Salva o progresso com o novo ID atribuído
     }

    if (perguntaTexto) {
        // O índice da questão atual no array (começa em 0), somamos 1 para ter a numeração correta
        const numeroDaQuestaoNoTema = indiceQuestaoAtual + 1;
        // Define o conteúdo HTML do elemento da pergunta, prefixando com o número
        perguntaTexto.innerHTML = `<b>${numeroDaQuestaoNoTema}.</b> ${questaoAtualObj.pergunta}`;
    }
    if (perguntaAutorDiv) {
        perguntaAutorDiv.innerHTML = questaoAtualObj.autor ? `<span style="font-size:0.8em; color: #6c757d; display:block; margin-bottom: 8px;">Questão elaborada por: ${questaoAtualObj.autor}</span>` : '';
    }
    // O link de reportar erro está agora no admin, não precisa ser manipulado aqui

    const tipoQuestao = questaoAtualObj.tipo || (questaoAtualObj.alternativa3 || questaoAtualObj.alternativa4 || questaoAtualObj.alternativa5 ? 'ME' : 'CE'); // Determina tipo

    const labelA = document.getElementById('label-a');
    const labelB = document.getElementById('label-b');
    const labelC = document.getElementById('label-c');
    const labelD = document.getElementById('label-d');
    const labelE = document.getElementById('label-e');

    const letraA = labelA ? labelA.querySelector('.letra-alternativa') : null;
    const letraB = labelB ? labelB.querySelector('.letra-alternativa') : null;
    const letraC = labelC ? labelC.querySelector('.letra-alternativa') : null;
    const letraD = labelD ? labelD.querySelector('.letra-alternativa') : null;
    const letraE = labelE ? labelE.querySelector('.letra-alternativa') : null;

    const altASpan = document.getElementById('alt-a');
    const altBSpan = document.getElementById('alt-b');
    const altCSpan = document.getElementById('alt-c');
    const altDSpan = document.getElementById('alt-d');
    const altESpan = document.getElementById('alt-e');

    if (tipoQuestao === 'CE') {
        if(labelA) labelA.style.display = 'block';
        if (letraA) letraA.textContent = 'C';
        if(altASpan) altASpan.textContent = 'Certo';
        if(labelB) labelB.style.display = 'block';
        if (letraB) letraB.textContent = 'E';
        if(altBSpan) altBSpan.textContent = 'Errado';
        if(labelC) labelC.style.display = 'none';
        if(labelD) labelD.style.display = 'none';
        if(labelE) labelE.style.display = 'none';
    } else { // Múltipla Escolha (ME)
        if(labelA) labelA.style.display = questaoAtualObj.alternativa1 ? 'block' : 'none';
        if (letraA) letraA.textContent = 'A';
        if(altASpan) altASpan.textContent = questaoAtualObj.alternativa1 || '';

        if(labelB) labelB.style.display = questaoAtualObj.alternativa2 ? 'block' : 'none';
        if (letraB) letraB.textContent = 'B';
        if(altBSpan) altBSpan.textContent = questaoAtualObj.alternativa2 || '';

        if(labelC) labelC.style.display = questaoAtualObj.alternativa3 ? 'block' : 'none';
        if (letraC) letraC.textContent = 'C';
        if(altCSpan) altCSpan.textContent = questaoAtualObj.alternativa3 || '';

        if(labelD) labelD.style.display = questaoAtualObj.alternativa4 ? 'block' : 'none';
        if (letraD) letraD.textContent = 'D';
        if(altDSpan) altDSpan.textContent = questaoAtualObj.alternativa4 || '';

        if(labelE) labelE.style.display = questaoAtualObj.alternativa5 ? 'block' : 'none';
        if (letraE) letraE.textContent = 'E';
        if(altESpan) altESpan.textContent = questaoAtualObj.alternativa5 || '';
    }

    if (questaoAtualSpan) questaoAtualSpan.textContent = indiceQuestaoAtual + 1;
    if (totalQuestoesTemaSpan) totalQuestoesTemaSpan.textContent = questoesFiltradas.length;
    if (temaAtualSpan) temaAtualSpan.textContent = modoRefazerErradas ? "Questões Erradas" : (temaSelecionado === 'todos' ? 'Todas as Matérias' : questaoAtualObj.tema || temaSelecionado);

    if (responderBtn) responderBtn.style.display = 'block';
    if (responderBtn) responderBtn.disabled = true; // Desabilita até uma opção ser selecionada
    if (pularBtn) pularBtn.style.display = 'block';
    if (aleatoriaQuestaoBtn) aleatoriaQuestaoBtn.style.display = 'block';
    if (proximoTemaBtn) proximoTemaBtn.style.display = modoRefazerErradas ? 'none' : 'block';
    if (proximaQuestaoBtn) proximaQuestaoBtn.style.display = 'none';
    if (alternativasForm) alternativasForm.style.display = 'block';

    if (alternativasForm) {
        const inputsRadio = alternativasForm.querySelectorAll('input[type="radio"]');
        inputsRadio.forEach(input => {
            input.removeEventListener('change', habilitarResponder); // Remove listener antigo para evitar duplicação
            input.addEventListener('change', habilitarResponder); // Adiciona novo listener
        });
    }

    atualizarContador(); // Atualiza contadores do tema
    if (!modoRefazerErradas && progressoGeral.ultimoIndicePorTema) {
        progressoGeral.ultimoIndicePorTema[temaSelecionado] = indiceQuestaoAtual; // Salva o índice atual para este tema
    }
    salvarProgresso(); // Salva o estado atual (incluindo o último índice visitado)
}


function habilitarResponder() {
    if (responderBtn) responderBtn.disabled = false;
}

function verificarResposta(event) {
    event.preventDefault();
    if (!questaoAtualObj || !alternativasForm) return;

    const alternativaSelecionadaInput = alternativasForm.querySelector('input[name="alternativa"]:checked');
    if (!alternativaSelecionadaInput) return; // Não faz nada se nada foi selecionado

    const respostaUsuario = alternativaSelecionadaInput.value.toUpperCase();
    // Garante que a resposta correta exista e esteja em maiúsculas
    const respostaCorreta = questaoAtualObj.respostaCorreta ? questaoAtualObj.respostaCorreta.toUpperCase() : null;
    const questaoId = questaoAtualObj.id;

    if (!respostaCorreta || !questaoId) {
        console.error("Erro: Questão atual sem resposta correta ou ID definido.", questaoAtualObj);
        // Poderia exibir uma mensagem para o usuário aqui
        return;
    }

    const jaResolvida = progressoGeral.questoesResolvidasIds.has(questaoId);
    let acertou = respostaUsuario === respostaCorreta;

    // Atualiza estatísticas gerais apenas se a questão ainda não foi resolvida
    if (!jaResolvida) {
        progressoGeral.estatisticasGerais.respondidas++;
        if (acertou) {
            progressoGeral.estatisticasGerais.acertos++;
        } else {
            progressoGeral.estatisticasGerais.incorretas++;
            // Adiciona à lista de erradas APENAS se NÃO estiver no modo de refazer
            // e se ainda não estiver na lista (evita duplicatas)
            if (!modoRefazerErradas && !progressoGeral.questoesErradas.some(q => q.id === questaoId)) {
                 // Certifique-se que o objeto da questão tem um ID antes de adicionar
                 if (questaoAtualObj.id) {
                    progressoGeral.questoesErradas.push({...questaoAtualObj}); // Adiciona uma cópia para evitar referências
                 } else {
                     console.error("Tentativa de adicionar questão errada sem ID:", questaoAtualObj);
                 }
            }
        }
        progressoGeral.questoesResolvidasIds.add(questaoId);
    } else if (modoRefazerErradas && acertou) {
        // Se está refazendo erradas e acertou, remove da lista de erradas
        progressoGeral.questoesErradas = progressoGeral.questoesErradas.filter(q => q.id !== questaoId);
    }
    // Sempre atualiza a última resposta do usuário para a questão
    progressoGeral.respostasUsuario[questaoId] = respostaUsuario;

    // Estiliza as alternativas
    alternativasForm.querySelectorAll('.alternativa-label').forEach(label => {
        const input = label.querySelector('input[type="radio"]');
        if (input) { // Verifica se o input existe
             // Adiciona classe 'correta' à alternativa correta
            if (input.value.toUpperCase() === respostaCorreta) {
                label.classList.add('correta');
            }
            // Adiciona classe 'incorreta-usuario' à alternativa selecionada se estiver errada
            if (input.checked && !acertou) {
                label.classList.add('incorreta-usuario');
            }
        }
    });
    // Desabilita o formulário de alternativas
    alternativasForm.classList.add('alternativas-desabilitadas');

    // --- Atualização do Feedback ---
    if (mensagemResultado) {
        mensagemResultado.textContent = acertou ? "Correto!" : "Incorreto.";
        mensagemResultado.className = acertou ? 'feedback-acerto' : 'feedback-erro'; // Aplica classe para cor do texto
    }
    if (gabaritoTexto) {
        gabaritoTexto.innerHTML = `<b>Gabarito: ${respostaCorreta}</b>. <br>${questaoAtualObj.gabaritoComentado || ''}`;
        // **MODIFICAÇÃO AQUI:** Adiciona/Remove classe para cor de fundo baseada na correção
        if (acertou) {
            gabaritoTexto.classList.remove('gabarito-resposta-incorreta'); // Garante que remove se acertou
        } else {
            gabaritoTexto.classList.add('gabarito-resposta-incorreta'); // Adiciona classe se errou
        }
    }
    // --- Fim da Atualização do Feedback ---

    if (resultadoDiv) resultadoDiv.style.display = 'block';
    if (responderBtn) responderBtn.style.display = 'none'; // Esconde botão Responder
    if (pularBtn) pularBtn.style.display = 'none'; // Esconde botão Pular
    if (proximaQuestaoBtn) proximaQuestaoBtn.style.display = 'block'; // Mostra botão Próxima

    // Atualiza contadores e salva progresso
    atualizarContador();
    atualizarContadoresGlobais();
    exibirOpcaoRefazerErradas(); // Atualiza a contagem de erradas visualmente
    salvarProgresso();
}



function proximaQuestao() {
    indiceQuestaoAtual++;
    exibirQuestao();
}

function pularQuestao() {
    if (!questaoAtualObj || !questaoAtualObj.id) return; // Precisa do ID da questão atual
    const questaoId = questaoAtualObj.id;

    // Marca como resolvida (pulada) apenas se ainda não foi resolvida
    if (!progressoGeral.questoesResolvidasIds.has(questaoId)) {
        progressoGeral.estatisticasGerais.respondidas++;
        progressoGeral.estatisticasGerais.puladas = (progressoGeral.estatisticasGerais.puladas || 0) + 1; // Garante que puladas exista
        progressoGeral.questoesResolvidasIds.add(questaoId);
        // Não adiciona às erradas ao pular
        salvarProgresso(); // Salva o progresso APÓS pular
    } else {
        console.log(`Questão ${questaoId} já foi resolvida/pulada anteriormente.`);
    }


    indiceQuestaoAtual++;
    exibirQuestao(); // Exibe a próxima questão
    atualizarContadoresGlobais(); // Atualiza os contadores globais
    exibirOpcaoRefazerErradas(); // Atualiza a exibição da seção de erradas
}

function exibirQuestaoAleatoria() {
    // Usa a lista de questões JÁ FILTRADAS pelo tema atual
    if (questoesFiltradas && questoesFiltradas.length > 0) {
        let novoIndice;
        // Garante que não repita a mesma questão se houver mais de uma
        if (questoesFiltradas.length === 1) {
            novoIndice = 0;
        } else {
            do {
                novoIndice = Math.floor(Math.random() * questoesFiltradas.length);
            } while (novoIndice === indiceQuestaoAtual);
        }
        indiceQuestaoAtual = novoIndice;
        exibirQuestao();
    } else {
         // Se não há questões filtradas (talvez tema vazio ou todas resolvidas), busca em TODAS as questões
         if (todasQuestoes.length > 0) {
             let novoIndiceGeral;
             const idQuestaoAtual = questaoAtualObj ? questaoAtualObj.id : null;

             if (todasQuestoes.length === 1) {
                 novoIndiceGeral = 0;
             } else {
                 do {
                    novoIndiceGeral = Math.floor(Math.random() * todasQuestoes.length);
                 // Evita repetir a questão atual, se houver uma
                 } while (idQuestaoAtual && todasQuestoes[novoIndiceGeral] && todasQuestoes[novoIndiceGeral].id === idQuestaoAtual);
             }


             const questaoAleatoria = todasQuestoes[novoIndiceGeral];
             if (questaoAleatoria && questaoAleatoria.tema) {
                 temaSelecionado = questaoAleatoria.tema;
                 if(filtroTema) filtroTema.value = temaSelecionado;
                  // Filtra pelo novo tema e encontra o índice da questão aleatória dentro do novo filtro
                 filtrarEExibir(); // Filtra pelo novo tema
                 const indiceNaFiltrada = questoesFiltradas.findIndex(q => q.id === questaoAleatoria.id);
                 indiceQuestaoAtual = (indiceNaFiltrada !== -1) ? indiceNaFiltrada : 0;
                 exibirQuestao(); // Exibe a questão encontrada
             } else {
                  if(perguntaTexto) perguntaTexto.textContent = "Erro ao selecionar questão aleatória (sem tema).";
             }
         } else {
            if(perguntaTexto) perguntaTexto.textContent = "Nenhuma questão disponível para exibir aleatoriamente.";
         }
    }
}


function proximoTema() {
    if (!filtroTema) return;
    const temas = Array.from(filtroTema.options).map(opt => opt.value).filter(val => val !== 'todos'); // Pega todos os temas, exceto 'todos'
    if (temas.length === 0) return; // Não faz nada se só houver 'todos'

    const indiceTemaAtualNaLista = temas.indexOf(temaSelecionado);

    let proximoIndiceNaLista;
    // Se está em 'todos', ou tema atual não está na lista (?), ou é o último tema, vai para o primeiro tema da lista
    if (temaSelecionado === 'todos' || indiceTemaAtualNaLista === -1 || indiceTemaAtualNaLista === temas.length - 1) {
        proximoIndiceNaLista = 0;
    } else {
        // Senão, vai para o próximo tema da lista
        proximoIndiceNaLista = indiceTemaAtualNaLista + 1;
    }

    const proximoTemaValor = temas[proximoIndiceNaLista];
    filtroTema.value = proximoTemaValor; // Seleciona o próximo tema no dropdown
    filtroTema.dispatchEvent(new Event('change')); // Dispara o evento change para carregar o novo tema
}

function atualizarContador() {
    if (!progressoGeral.questoesResolvidasIds || !questoesFiltradas) {
        // Zera os contadores do tema se não houver dados
        if(totalQuestoesTemaSpan) totalQuestoesTemaSpan.textContent = questoesFiltradas?.length || 0;
        if(questoesResolvidasTemaSpan) questoesResolvidasTemaSpan.textContent = 0;
        if(acertosTemaSpan) acertosTemaSpan.textContent = 0;
        if(incorretasTemaSpan) incorretasTemaSpan.textContent = 0;
        return;
    }

    // Filtra as questões resolvidas que pertencem ao tema atual
    const resolvidasNesteTema = questoesFiltradas.filter(q => q && q.id && progressoGeral.questoesResolvidasIds.has(q.id));

    // Conta acertos e erros DENTRO das resolvidas neste tema
    let acertosNesteTema = 0;
    let incorretasNesteTema = 0;

    resolvidasNesteTema.forEach(q => {
         if (q && q.id && progressoGeral.respostasUsuario[q.id]) {
            const respostaUsuario = progressoGeral.respostasUsuario[q.id].toUpperCase();
            const respostaCorreta = q.respostaCorreta ? q.respostaCorreta.toUpperCase() : null;
             if (respostaCorreta && respostaUsuario === respostaCorreta) {
                acertosNesteTema++;
            } else if (respostaCorreta) { // Considera erro se a resposta não foi correta (exclui puladas implícitas)
                incorretasNesteTema++;
            }
         }
         // Não conta puladas explicitamente aqui, pois o foco são acertos/erros das respondidas
    });

    // Atualiza os spans na interface
    if(totalQuestoesTemaSpan) totalQuestoesTemaSpan.textContent = questoesFiltradas.length;
    if(questoesResolvidasTemaSpan) questoesResolvidasTemaSpan.textContent = resolvidasNesteTema.length;
    if(acertosTemaSpan) acertosTemaSpan.textContent = acertosNesteTema;
    if(incorretasTemaSpan) incorretasTemaSpan.textContent = incorretasNesteTema;
}



function filtrarEExibir(indiceParaIniciar = 0) { // Aceita um índice inicial
    const filtroValor = modoRefazerErradas ? "__refazer_erradas__" : (filtroTema ? filtroTema.value : 'todos');

    if (filtroValor === "__refazer_erradas__") {
        questoesFiltradas = [...(progressoGeral.questoesErradas || [])];
        // Sempre inicia do zero ao refazer erradas
        indiceQuestaoAtual = 0;
        if (statusBateriaSpan) statusBateriaSpan.textContent = "[Refazendo Erradas] ";
        if (document.getElementById('filtros-navegacao')) document.getElementById('filtros-navegacao').style.display = 'none';
    } else {
        temaSelecionado = filtroValor;
        if (temaSelecionado === 'todos') {
            // Filtra para não incluir questões já resolvidas se essa opção for desejada no futuro
            // Por enquanto, inclui todas:
            questoesFiltradas = [...todasQuestoes];
        } else {
            questoesFiltradas = todasQuestoes.filter(q => q.tema === temaSelecionado);
        }

        // Usa o índice passado ou o último índice salvo para o tema, ou 0 se nenhum for válido
        indiceQuestaoAtual = indiceParaIniciar >= 0 ? indiceParaIniciar : (progressoGeral.ultimoIndicePorTema?.[temaSelecionado] || 0);
        // Garante que o índice não seja maior que o número de questões filtradas
        if (indiceQuestaoAtual >= questoesFiltradas.length) {
             indiceQuestaoAtual = 0;
        }


        if (statusBateriaSpan) statusBateriaSpan.textContent = "";
        if (document.getElementById('filtros-navegacao')) document.getElementById('filtros-navegacao').style.display = 'flex';

        // Salva o tema selecionado no progresso
        progressoGeral.temaSelecionado = temaSelecionado;
        // Não salva o índice aqui, pois exibirQuestao faz isso
    }

    exibirQuestao(); // Exibe a questão no índice definido
    exibirOpcaoRefazerErradas(); // Atualiza a seção de erradas
    // Salvar progresso é chamado dentro de exibirQuestao e verificarResposta/pularQuestao
}



function exibirOpcaoRefazerErradas() {
    if (!questoesErradasContainer || !erradasContentDiv || !numQuestoesErradasSpan || !iniciarRefazerBtn) return;

    const numErradas = progressoGeral.questoesErradas ? progressoGeral.questoesErradas.length : 0;

    if (numErradas > 0) {
        numQuestoesErradasSpan.textContent = numErradas;
        iniciarRefazerBtn.disabled = false;
        questoesErradasContainer.style.display = 'block'; // Mostra o container da seção
        // Verifica se o conteúdo já está visível ou não (controlado pelo collapsible)
         const isContentVisible = erradasContentDiv.style.display === 'block';
         if (!isContentVisible) {
             // Pode optar por abrir automaticamente ou deixar o usuário clicar
             // erradasContentDiv.style.display = 'block';
             // if(document.getElementById('erradas-toggle')) {
             //     const icon = document.getElementById('erradas-toggle').querySelector('.toggle-icon');
             //     if(icon) icon.textContent = '-';
             // }
         }
    } else {
        numQuestoesErradasSpan.textContent = '0';
        iniciarRefazerBtn.disabled = true;
        // Opcional: Esconder a seção inteira se não houver erradas
        // questoesErradasContainer.style.display = 'none';
        // Ou apenas garantir que o conteúdo esteja fechado
        erradasContentDiv.style.display = 'none';
         if(document.getElementById('erradas-toggle')) {
            const icon = document.getElementById('erradas-toggle').querySelector('.toggle-icon');
            if(icon) icon.textContent = '+';
         }
    }
}


function iniciarBateriaRefazer() {
    if (!progressoGeral.questoesErradas || progressoGeral.questoesErradas.length === 0) {
        alert("Você não tem questões erradas para refazer.");
        return;
    }
    if (!modoRefazerErradas) {
        temaOriginalAntesRefazer = temaSelecionado; // Salva o tema atual
    }
    modoRefazerErradas = true;
    if (filtroTema) filtroTema.disabled = true; // Desabilita seleção de tema
    filtrarEExibir(); // Chama para filtrar e exibir as questões erradas
}

function atualizarFiltroTemas() {
    if (!filtroTema) return;

    const valorSelecionadoAnteriormente = filtroTema.value;
    // Guarda as opções existentes (exceto a primeira "Todos")
    const optionsToRemove = Array.from(filtroTema.options).slice(1);
    optionsToRemove.forEach(opt => filtroTema.remove(opt.index));

    // Cria um Set para temas únicos, garantindo que não sejam nulos ou vazios, e ordena
    const temasUnicos = [...new Set(todasQuestoes.map(q => q?.tema).filter(Boolean))].sort((a, b) => a.localeCompare(b));

    temasUnicos.forEach(tema => {
        const option = document.createElement('option');
        option.value = tema;
        option.textContent = tema;
        filtroTema.appendChild(option);
    });

    // Tenta restaurar a seleção anterior, se ainda existir na lista atualizada
    if (Array.from(filtroTema.options).some(opt => opt.value === valorSelecionadoAnteriormente)) {
        filtroTema.value = valorSelecionadoAnteriormente;
    } else {
        // Se o tema anterior não existe mais (ex: foi de questão adicionada e resetou), volta para 'todos'
        filtroTema.value = 'todos';
        temaSelecionado = 'todos'; // Atualiza a variável de estado
         if (progressoGeral) progressoGeral.temaSelecionado = 'todos'; // Atualiza no progresso também
    }
}


function limparFormularioQuestao() {
    if(temaInput) temaInput.value = '';
    if(perguntaTextarea) perguntaTextarea.value = '';
    if(alternativa1Input) alternativa1Input.value = '';
    if(alternativa2Input) alternativa2Input.value = '';
    if(alternativa3Input) alternativa3Input.value = '';
    if(alternativa4Input) alternativa4Input.value = '';
    if(alternativa5Input) alternativa5Input.value = '';
    if(respostaCorretaInput) respostaCorretaInput.value = '';
    if(gabaritoComentadoTextarea) gabaritoComentadoTextarea.value = '';
    if(tipoQuestaoSelect) tipoQuestaoSelect.value = 'ME';
    ajustarFormAlternativas();
}

function ajustarFormAlternativas() {
    if (!tipoQuestaoSelect || !alternativasMultiplaEscolhaDiv || !alternativasCertoErradoDiv) return;

    if (tipoQuestaoSelect.value === 'CE') {
        alternativasMultiplaEscolhaDiv.style.display = 'none';
        alternativasCertoErradoDiv.style.display = 'block';
        if(alternativa1Input) { alternativa1Input.value = 'Certo'; alternativa1Input.readOnly = true; }
        if(alternativa2Input) { alternativa2Input.value = 'Errado'; alternativa2Input.readOnly = true; }
        // Limpa as outras alternativas que não são usadas em CE
        if(alternativa3Input) alternativa3Input.value = '';
        if(alternativa4Input) alternativa4Input.value = '';
        if(alternativa5Input) alternativa5Input.value = '';
         // Define placeholder para resposta correta em CE
         if(respostaCorretaInput) respostaCorretaInput.placeholder = 'A (Certo) ou B (Errado)';
    } else { // ME
        alternativasMultiplaEscolhaDiv.style.display = 'block';
        alternativasCertoErradoDiv.style.display = 'none';
        // Limpa e habilita edição para alternativas ME
        if(alternativa1Input) { alternativa1Input.value = ''; alternativa1Input.readOnly = false; }
        if(alternativa2Input) { alternativa2Input.value = ''; alternativa2Input.readOnly = false; }
        // Placeholder padrão para resposta correta em ME
        if(respostaCorretaInput) respostaCorretaInput.placeholder = 'A, B, C, D ou E';
    }
}


function salvarNovaQuestaoPeloUsuario() {
    if (!temaInput || !perguntaTextarea || !respostaCorretaInput || !tipoQuestaoSelect) {
        alert("Erro: Elementos essenciais do formulário não encontrados.");
        return;
    }

    const novoTema = temaInput.value.trim();
    const novaPergunta = perguntaTextarea.value.trim();
    let novaAlternativa1 = alternativa1Input ? alternativa1Input.value.trim() : '';
    let novaAlternativa2 = alternativa2Input ? alternativa2Input.value.trim() : '';
    let novaAlternativa3 = alternativa3Input ? alternativa3Input.value.trim() : '';
    let novaAlternativa4 = alternativa4Input ? alternativa4Input.value.trim() : '';
    let novaAlternativa5 = alternativa5Input ? alternativa5Input.value.trim() : '';
    let novaRespostaCorreta = respostaCorretaInput.value.trim().toUpperCase();
    const novoGabaritoComentado = gabaritoComentadoTextarea ? gabaritoComentadoTextarea.value.trim() : '';
    const tipoQuestao = tipoQuestaoSelect.value;

    if (!novoTema || !novaPergunta || !novaRespostaCorreta) {
        alert("Por favor, preencha Tema, Pergunta e Resposta Correta.");
        return;
    }

    const alternativasValidasME = ['A', 'B', 'C', 'D', 'E'];
    const alternativasValidasCE = ['A', 'B']; // A=Certo, B=Errado

    if (tipoQuestao === 'ME') {
        if (!novaAlternativa1 || !novaAlternativa2 || !novaAlternativa3 || !novaAlternativa4 || !novaAlternativa5) {
            // Permite adicionar questão ME mesmo sem todas alternativas preenchidas?
            // A validação original exigia todas. Manteremos por enquanto.
            alert("Para Múltipla Escolha (A-E), preencha todas as alternativas.");
            // Se quiser permitir menos alternativas, remova ou ajuste esta validação.
             // Exemplo: if (!novaAlternativa1 || !novaAlternativa2) { alert("Preencha pelo menos A e B"); return; }
            return;
        }
        if (!alternativasValidasME.includes(novaRespostaCorreta)) {
            alert("Resposta Correta inválida para Múltipla Escolha. Use A, B, C, D ou E.");
            return;
        }
    } else { // CE
        novaAlternativa1 = 'Certo'; // Define automaticamente
        novaAlternativa2 = 'Errado'; // Define automaticamente
        novaAlternativa3 = novaAlternativa4 = novaAlternativa5 = ''; // Limpa as não usadas

         // Permite que o usuário digite 'C' para Certo ou 'E' para Errado e converte para A/B
        if (novaRespostaCorreta === 'C') {
            novaRespostaCorreta = 'A';
        } else if (novaRespostaCorreta === 'E') {
            novaRespostaCorreta = 'B';
        }

        if (!alternativasValidasCE.includes(novaRespostaCorreta)) {
            alert("Resposta Correta inválida para Certo/Errado. Use A (para Certo) ou B (para Errado).");
            return;
        }
    }

    const novaQuestao = {
        // Gera um ID único mais robusto
        id: `q_user_${auth && auth.currentUser ? auth.currentUser.uid.substring(0, 5) : 'anon'}_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`,
        tema: novoTema,
        pergunta: novaPergunta,
        alternativa1: novaAlternativa1,
        alternativa2: novaAlternativa2,
        alternativa3: novaAlternativa3,
        alternativa4: novaAlternativa4,
        alternativa5: novaAlternativa5,
        respostaCorreta: novaRespostaCorreta,
        gabaritoComentado: novoGabaritoComentado,
        autor: (auth && auth.currentUser) ? auth.currentUser.email : 'Usuário Local', // Pega email do usuário logado
        tipo: tipoQuestao // Salva o tipo da questão
    };

    todasQuestoes.push(novaQuestao);
    if (!progressoGeral.questoesAdicionadasUsuario) {
        progressoGeral.questoesAdicionadasUsuario = [];
    }
    progressoGeral.questoesAdicionadasUsuario.push(novaQuestao);

    atualizarFiltroTemas(); // Atualiza o filtro para incluir o novo tema, se for novo
    salvarProgresso(); // Salva o progresso com a questão adicionada

    alert("Questão adicionada com sucesso!");
    limparFormularioQuestao();
    if(formularioQuestaoDiv) formularioQuestaoDiv.style.display = 'none';

     // Opcional: filtrar diretamente para o tema da questão adicionada
     if (filtroTema) {
         filtroTema.value = novoTema;
         filtroTema.dispatchEvent(new Event('change'));
     }
}



function carregarQuestoesDeArquivoJSON(event) {
    const arquivo = event.target.files[0];
    if (!arquivo) {
        if(mensagemCarregamentoDiv) mensagemCarregamentoDiv.textContent = 'Nenhum arquivo selecionado.';
        return;
    }
     if (!arquivo.name.toLowerCase().endsWith('.json')) {
        if(mensagemCarregamentoDiv) mensagemCarregamentoDiv.textContent = 'Erro: O arquivo selecionado não é um JSON.';
        if(arquivoQuestoesInput) arquivoQuestoesInput.value = ''; // Limpa seleção
        return;
    }


    const leitor = new FileReader();
    leitor.onload = function(e) {
        try {
            const novasQuestoes = JSON.parse(e.target.result);
            if (!Array.isArray(novasQuestoes)) {
                throw new Error("O arquivo JSON não contém um array de questões.");
            }

            let adicionadas = 0;
            let ignoradas = 0;
            let questoesInvalidas = [];
            const autor = (auth && auth.currentUser) ? auth.currentUser.email : 'Importado Local';

            novasQuestoes.forEach((nq, index) => {
                // Validação básica da estrutura da questão
                 if (!nq || typeof nq !== 'object' || !nq.tema || !nq.pergunta || !nq.respostaCorreta) {
                    ignoradas++;
                    questoesInvalidas.push({index: index + 1, reason: "Estrutura básica inválida (falta tema, pergunta ou resposta)"});
                    return; // Pula para a próxima questão
                 }

                 // Determina o tipo e valida alternativas e resposta correta
                const tipoInferido = (!nq.alternativa3 && !nq.alternativa4 && !nq.alternativa5 && nq.alternativa1 && nq.alternativa2) ? 'CE' : 'ME';
                const tipoQuestao = nq.tipo || tipoInferido; // Usa o tipo do JSON ou infere

                let questaoParaAdd = {
                    id: `q_import_${Date.now()}_${index}_${Math.random().toString(16).slice(2)}`,
                    tema: nq.tema.trim(),
                    pergunta: nq.pergunta.trim(),
                    alternativa1: nq.alternativa1?.trim() || '',
                    alternativa2: nq.alternativa2?.trim() || '',
                    alternativa3: nq.alternativa3?.trim() || '',
                    alternativa4: nq.alternativa4?.trim() || '',
                    alternativa5: nq.alternativa5?.trim() || '',
                    respostaCorreta: nq.respostaCorreta.trim().toUpperCase(),
                    gabaritoComentado: nq.gabaritoComentado?.trim() || '',
                    autor: nq.autor || autor,
                    tipo: tipoQuestao
                };

                // Validação e ajuste para tipo CE
                if (tipoQuestao === 'CE') {
                    if (!questaoParaAdd.alternativa1 || !questaoParaAdd.alternativa2) {
                         ignoradas++;
                         questoesInvalidas.push({index: index + 1, reason: "Questão CE sem alternativa1 ou alternativa2"});
                         return;
                    }
                     // Força alternativas A/B para Certo/Errado (ou usa as do JSON se fizer sentido)
                     // Adotaremos A=Certo, B=Errado como padrão interno
                    questaoParaAdd.alternativa1 = 'Certo';
                    questaoParaAdd.alternativa2 = 'Errado';
                    questaoParaAdd.alternativa3 = '';
                    questaoParaAdd.alternativa4 = '';
                    questaoParaAdd.alternativa5 = '';

                    if (questaoParaAdd.respostaCorreta === 'C') questaoParaAdd.respostaCorreta = 'A';
                    else if (questaoParaAdd.respostaCorreta === 'E') questaoParaAdd.respostaCorreta = 'B';

                    if (questaoParaAdd.respostaCorreta !== 'A' && questaoParaAdd.respostaCorreta !== 'B') {
                        ignoradas++;
                         questoesInvalidas.push({index: index + 1, reason: `Resposta inválida (${nq.respostaCorreta}) para tipo CE`});
                        return;
                    }
                }
                // Validação para tipo ME
                else if (tipoQuestao === 'ME') {
                     // Validação Mínima: Pelo menos A e B devem existir para ME
                     if (!questaoParaAdd.alternativa1 || !questaoParaAdd.alternativa2) {
                        ignoradas++;
                         questoesInvalidas.push({index: index + 1, reason: "Questão ME sem pelo menos alternativa A e B"});
                        return;
                     }
                    if (!['A', 'B', 'C', 'D', 'E'].includes(questaoParaAdd.respostaCorreta)) {
                        ignoradas++;
                         questoesInvalidas.push({index: index + 1, reason: `Resposta inválida (${nq.respostaCorreta}) para tipo ME`});
                        return;
                    }
                    // Garante que alternativas vazias fiquem vazias
                    if (!nq.alternativa3) questaoParaAdd.alternativa3 = '';
                    if (!nq.alternativa4) questaoParaAdd.alternativa4 = '';
                    if (!nq.alternativa5) questaoParaAdd.alternativa5 = '';
                }
                // Se não for nem ME nem CE (tipo inválido ou inferência falhou)
                 else {
                     ignoradas++;
                      questoesInvalidas.push({index: index + 1, reason: `Tipo de questão inválido ou não reconhecido: ${tipoQuestao}`});
                     return;
                 }


                // Se passou nas validações, adiciona
                todasQuestoes.push(questaoParaAdd);
                if (!progressoGeral.questoesAdicionadasUsuario) {
                    progressoGeral.questoesAdicionadasUsuario = [];
                }
                progressoGeral.questoesAdicionadasUsuario.push(questaoParaAdd);
                adicionadas++;

            });

            if (adicionadas > 0) {
                atualizarFiltroTemas();
                salvarProgresso(); // Salva as questões adicionadas
                if(mensagemCarregamentoDiv) {
                     mensagemCarregamentoDiv.textContent = `${adicionadas} questões carregadas com sucesso!`;
                      if (ignoradas > 0) {
                         mensagemCarregamentoDiv.textContent += ` ${ignoradas} questões foram ignoradas por erros ou formato inválido.`;
                         console.warn("Detalhes das questões ignoradas:", questoesInvalidas);
                      }
                }
                filtrarEExibir(); // Atualiza a exibição
            } else {
                if(mensagemCarregamentoDiv) {
                    mensagemCarregamentoDiv.textContent = `Nenhuma questão válida encontrada no arquivo. ${ignoradas} ignoradas.`;
                     console.warn("Detalhes das questões ignoradas:", questoesInvalidas);
                }
            }

        } catch (err) {
            console.error("Erro ao processar o arquivo JSON:", err);
            if(mensagemCarregamentoDiv) mensagemCarregamentoDiv.textContent = `Erro ao ler ou processar o arquivo JSON: ${err.message}. Verifique o formato do arquivo.`;
        } finally {
            if(arquivoQuestoesInput) arquivoQuestoesInput.value = ''; // Limpa o input de arquivo
        }
    };

    leitor.onerror = function() {
        console.error("Erro ao ler arquivo:", leitor.error);
        if(mensagemCarregamentoDiv) mensagemCarregamentoDiv.textContent = `Erro ao ler o arquivo. Verifique as permissões ou o arquivo selecionado.`;
        if(arquivoQuestoesInput) arquivoQuestoesInput.value = ''; // Limpa o input de arquivo
    };

    leitor.readAsText(arquivo); // Inicia a leitura do arquivo
}



function setupCollapsible(toggleId, contentId) {
    const toggleButton = document.getElementById(toggleId);
    const contentDiv = document.getElementById(contentId);

    if (!toggleButton || !contentDiv) {
        console.warn(`Elemento toggle (${toggleId}) ou content (${contentId}) não encontrado para collapsible.`);
        return;
    }

    const iconSpan = toggleButton.querySelector('.toggle-icon');
    if (!iconSpan) {
         console.warn(`Ícone não encontrado dentro do toggle ${toggleId}.`);
         // Continua sem o ícone se não achar
    }


    // Define estado inicial baseado no estilo inline (se já estiver aberto)
    const isInitiallyOpen = contentDiv.style.display === 'block';
    if(iconSpan) iconSpan.textContent = isInitiallyOpen ? '-' : '+';

    toggleButton.addEventListener('click', () => {
        const isOpen = contentDiv.style.display === 'block';
        contentDiv.style.display = isOpen ? 'none' : 'block';
        if(iconSpan) iconSpan.textContent = isOpen ? '+' : '-';

        // Salva o estado de abertura/fechamento da seção admin no progressoGeral
        if (toggleId === 'admin-toggle' && progressoGeral) {
            progressoGeral.adminOpen = !isOpen; // Salva o novo estado (aberto = true, fechado = false)
            // Não precisa salvar o progresso aqui, pois o usuário pode abrir/fechar várias vezes
            // O salvamento ocorrerá em outras ações (responder, pular, etc.)
        }
    });
}


// --- Função de Inicialização Geral ---
function inicializarApp() {
    console.log("App AFTec Simulador - Inicializando...");
    mapearElementosDOM(); // Garante que todos os elementos DOM estejam mapeados

    if (typeof questoes === 'undefined' || !Array.isArray(questoes)) {
        console.error("Variável 'questoes' não definida ou não é um array. Verifique questoes.js");
        if (perguntaTexto) perguntaTexto.textContent = "Erro: Nenhuma questão base carregada. Verifique o arquivo 'questoes.js'.";
        todasQuestoes = []; // Define como array vazio para evitar erros posteriores
        // return; // Decide se quer parar a execução ou tentar continuar sem questões base
    } else {
         // Garante IDs únicos para as questões base iniciais
         todasQuestoes = [...questoes]; // Começa com as questões base
         todasQuestoes.forEach((q, index) => {
            if (q && !q.id) { // Verifica se a questão existe e não tem ID
                const timestamp = Date.now();
                const randomPart = Math.random().toString(36).substring(2, 8);
                q.id = `q_base_${index}_${timestamp}_${randomPart}`;
            }
         });
    }


    if (auth) {
        setupAuthListeners(); // Configura listeners de autenticação SE o Firebase Auth estiver disponível
    } else {
        console.log("Firebase Auth não disponível, operando em modo local/anônimo.");
        // Garante que a interface de login/usuário esteja no estado correto (deslogado)
        if(loginFormDiv) loginFormDiv.style.display = 'block';
        if(userInfoDiv) userInfoDiv.style.display = 'none';
        if(adminContent) adminContent.style.display = 'none';
        if(adicionarQuestaoBtn) adicionarQuestaoBtn.disabled = true; // Desabilita adição de questões se não logado
        // Carrega o progresso local/anônimo imediatamente se Auth não estiver disponível
        carregarProgresso();
    }

    // Configura listeners dos botões do quiz e outros elementos
    if (alternativasForm && responderBtn) alternativasForm.addEventListener('submit', verificarResposta);
    if (proximaQuestaoBtn) proximaQuestaoBtn.addEventListener('click', proximaQuestao);
    if (pularBtn) pularBtn.addEventListener('click', pularQuestao);
    if (aleatoriaQuestaoBtn) aleatoriaQuestaoBtn.addEventListener('click', exibirQuestaoAleatoria);
    if (proximoTemaBtn) proximoTemaBtn.addEventListener('click', proximoTema);

    if (filtroTema) {
        filtroTema.addEventListener('change', () => {
             if (!modoRefazerErradas) {
                 temaSelecionado = filtroTema.value;
                 if (progressoGeral) progressoGeral.temaSelecionado = temaSelecionado; // Atualiza no estado
                 filtrarEExibir(); // Filtra e exibe questões do novo tema
                 // Salvar progresso é chamado dentro de exibirQuestao
             }
        });
    }

    if (resetarProgressoBtn) {
        resetarProgressoBtn.addEventListener('click', () => {
            if (confirm('Tem certeza que deseja resetar TODO o progresso local e online (se logado)? Esta ação não pode ser desfeita.')) {
                resetarVariaveisDeEstadoQuiz(true); // Hard reset
                 // Após resetar, precisa recarregar as questões base e exibir a primeira
                 filtrarEExibir(); // Exibe a primeira questão do tema 'todos'
                 atualizarContadoresGlobais();
                 exibirOpcaoRefazerErradas();
            }
        });
    }

    if (iniciarRefazerBtn) iniciarRefazerBtn.addEventListener('click', iniciarBateriaRefazer);

    // Configura seções retráteis
    if (adminToggle) setupCollapsible('admin-toggle', 'admin-content');
    if (document.getElementById('erradas-toggle')) setupCollapsible('erradas-toggle', 'erradas-content');

    // Botões do formulário de adicionar questão
    if (adicionarQuestaoBtn) {
        adicionarQuestaoBtn.addEventListener('click', () => {
            limparFormularioQuestao();
            if(formularioQuestaoDiv) formularioQuestaoDiv.style.display = 'block';
        });
    }

    if (cancelarQuestaoBtn) {
        cancelarQuestaoBtn.addEventListener('click', () => {
            limparFormularioQuestao();
             if(formularioQuestaoDiv) formularioQuestaoDiv.style.display = 'none';
        });
    }

    if (salvarQuestaoBtn) salvarQuestaoBtn.addEventListener('click', salvarNovaQuestaoPeloUsuario);
    if (tipoQuestaoSelect) tipoQuestaoSelect.addEventListener('change', ajustarFormAlternativas); // Listener para ajustar form CE/ME

     // Botão para carregar questões de arquivo JSON
     if (carregarQuestoesBtn && arquivoQuestoesInput) {
        carregarQuestoesBtn.addEventListener('click', () => arquivoQuestoesInput.click()); // Abre o seletor de arquivo
        arquivoQuestoesInput.addEventListener('change', carregarQuestoesDeArquivoJSON); // Processa o arquivo selecionado
     }

    // Listener para o link de reportar erro (exemplo simples)
    const linkReportar = document.getElementById('link-reportar');
    if (linkReportar) {
        linkReportar.addEventListener('click', (event) => {
            event.preventDefault(); // Previne a navegação padrão do link
            if (questaoAtualObj && questaoAtualObj.id) {
                // Aqui você pode implementar a lógica para reportar o erro.
                // Exemplo: Abrir um formulário, enviar dados para um servidor, etc.
                const tema = questaoAtualObj.tema || 'N/A';
                const id = questaoAtualObj.id;
                const pergunta = questaoAtualObj.pergunta.substring(0, 50) + "..."; // Pega início da pergunta
                const confirmReport = confirm(`Reportar erro na questão atual?\n\nTema: ${tema}\nID: ${id}\nInício: ${pergunta}`);
                if (confirmReport) {
                    // Lógica de reporte (ex: enviar para um formulário Google, API, etc.)
                    alert("Funcionalidade de reporte ainda não implementada. Por favor, anote o ID da questão e reporte manualmente.");
                    console.log("Reportar erro para questão ID:", id);
                }
            } else {
                alert("Não há questão atual selecionada para reportar.");
            }
        });
    }

    console.log("App AFTec Simulador - Inicialização concluída.");
}

// --- Ponto de Entrada Principal ---
document.addEventListener('DOMContentLoaded', inicializarApp);
