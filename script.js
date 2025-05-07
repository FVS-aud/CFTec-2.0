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
const usuariosCollection = 'usuarios'; // Nome da coleção para dados dos usuários (nome, nº inscrição)

// --- Elementos Globais do DOM (Definidos aqui para fácil acesso) ---
let perguntaTexto, alternativasForm, responderBtn, proximaQuestaoBtn, pularBtn, resultadoDiv, mensagemResultado, gabaritoTexto, mensagemFim, filtroTema, questaoAtualSpan, totalQuestoesTemaSpan, temaAtualSpan, statusBateriaSpan, questoesResolvidasTemaSpan, acertosTemaSpan, incorretasTemaSpan, globRespondidasSpan, globAcertosSpan, globErrosSpan, aleatoriaQuestaoBtn, proximoTemaBtn, userIdentifierDisplaySpan, authMessageSpan, loginFormDiv, userInfoDiv, inscricaoInput, passwordInput, nomeInput /* NOVO */, loginBtn, registerBtn, logoutBtn, questoesErradasContainer, erradasContentDiv, numQuestoesErradasSpan, iniciarRefazerBtn, adminToggle, adminContent, adicionarQuestaoBtn, resetarProgressoBtn, carregarQuestoesBtn, arquivoQuestoesInput, mensagemCarregamentoDiv, formularioQuestaoDiv, tipoQuestaoSelect, temaInput, perguntaTextarea, alternativasMultiplaEscolhaDiv, alternativa1Input, alternativa2Input, alternativa3Input, alternativa4Input, alternativa5Input, alternativasCertoErradoDiv, respostaCorretaInput, gabaritoComentadoTextarea, salvarQuestaoBtn, cancelarQuestaoBtn, perguntaAutorDiv;
let welcomeMessageSpan, // Span para exibir a mensagem de boas-vindas
    setNameModalDiv,    // Div do modal
    nomeEscolhidoInput, // Input do nome no modal
    formaTratamentoSelect, // Select da forma de tratamento no modal
    saveNameBtn,        // Botão de salvar no modal
    setNameMessageSpan; // Span de mensagem no modal

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
    userIdentifierDisplaySpan = document.getElementById('user-identifier-display');
    authMessageSpan = document.getElementById('auth-message');
    loginFormDiv = document.getElementById('login-form');
    userInfoDiv = document.getElementById('user-info');
    inscricaoInput = document.getElementById('inscricao');
    passwordInput = document.getElementById('password');
    nomeInput = document.getElementById('nome'); // NOVO
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
    // Mapeando elementos do modal que faltavam na lista global
    welcomeMessageSpan = document.getElementById('welcome-message');
    setNameModalDiv = document.getElementById('set-name-modal');
    nomeEscolhidoInput = document.getElementById('nome-escolhido');
    formaTratamentoSelect = document.getElementById('forma-tratamento');
    saveNameBtn = document.getElementById('save-name-btn');
    setNameMessageSpan = document.getElementById('set-name-message');
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
    progressoGeral.respostasUsuario = progressoGeral.respostasUsuario || {};
    progressoGeral.questoesAdicionadasUsuario = progressoGeral.questoesAdicionadasUsuario || [];

    // --- Salvar no Local Storage ---
    const dadosParaSalvarLocal = {
        ...progressoGeral,
        questoesResolvidasIds: Array.from(progressoGeral.questoesResolvidasIds),
        questoesErradasIds: progressoGeral.questoesErradas.map(q => q.id).filter(id => id),
        questoesAdicionadasUsuario: progressoGeral.questoesAdicionadasUsuario
    };
    localStorage.setItem(key, JSON.stringify(dadosParaSalvarLocal));
    // -----------------------------------------------------------------------

    // --- Salvar no Firebase ---
    if (auth && auth.currentUser && db) {
        const userId = auth.currentUser.uid;
        // Salva apenas as estatísticas do quiz na coleção 'estatisticasUsuarios'
        const dadosEstatisticasParaFirebase = {
            temaSelecionado: progressoGeral.temaSelecionado,
            ultimoIndicePorTema: progressoGeral.ultimoIndicePorTema,
            estatisticasGerais: progressoGeral.estatisticasGerais,
            questoesResolvidasIds: Array.from(progressoGeral.questoesResolvidasIds),
            questoesErradasIds: progressoGeral.questoesErradas.map(q => q.id).filter(id => id),
            respostasUsuario: progressoGeral.respostasUsuario,
            lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
        };
        try {
            // Atualiza ou cria o documento de estatísticas
            await db.collection(firebaseCollection).doc(userId).set(dadosEstatisticasParaFirebase, { merge: true });
            console.log("Progresso de estatísticas salvo no Firebase para:", userId);
        } catch (error) {
            console.error("Erro ao salvar estatísticas no Firebase:", error);
            if(authMessageSpan) authMessageSpan.textContent = "Erro ao salvar online. Progresso salvo localmente.";
        }
        // Note que os dados do usuário (nome, nº inscrição) são salvos separadamente na coleção 'usuarios' durante o registro.
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
        // Mantém ou reseta questões adicionadas dependendo do hardReset
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
            // Reseta estatísticas
            const statsRef = db.collection(firebaseCollection).doc(auth.currentUser.uid);
            statsRef.delete()
                .then(() => {
                    if(authMessageSpan) authMessageSpan.textContent = 'Progresso local e online resetado.';
                    console.log("Estatísticas do Firebase resetadas para:", auth.currentUser.uid);
                 })
                .catch(err => {
                    console.error("Erro ao resetar estatísticas no Firebase:", err);
                    if(authMessageSpan) authMessageSpan.textContent = 'Erro ao resetar estatísticas online.';
                 });
            // Poderia resetar o documento do usuário na coleção 'usuarios' também, se desejado.
            // Ex: db.collection(usuariosCollection).doc(auth.currentUser.uid).delete().catch(...)
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

    // --- LOGIN ---
    loginBtn.addEventListener('click', () => {
        const inscricaoValue = inscricaoInput ? inscricaoInput.value.trim() : null;
        const password = passwordInput ? passwordInput.value : null;

        if (!inscricaoValue || !password) {
            if(authMessageSpan) authMessageSpan.textContent = 'Por favor, preencha Nº Inscrição e Senha.';
            return;
        }
        // Validação do formato do número de inscrição (COMO ANTES) ...
        const inscricaoNumero = parseInt(inscricaoValue, 10);
        if (isNaN(inscricaoNumero) || inscricaoNumero < 240000000 || inscricaoNumero > 2421999999 || (inscricaoValue.length !== 9 && inscricaoValue.length !== 10)) {
             if(authMessageSpan) authMessageSpan.textContent = 'Nº de Inscrição inválido. Use o formato numérico entre 240000000 e 2421999999.';
             return;
        }

        const emailFicticio = `${inscricaoValue}@inscricao.aft`;
        if(authMessageSpan) authMessageSpan.textContent = 'Entrando...';

        auth.signInWithEmailAndPassword(emailFicticio, password)
            .then((userCredential) => {
                if(authMessageSpan) authMessageSpan.textContent = '';
                console.log("Login bem-sucedido para (email fictício):", userCredential.user.email);
                // A atualização do display e verificação do nome/pronome será feita pelo onAuthStateChanged
            })
            .catch((error) => {
                // Tratamento de erros (COMO ANTES) ...
                console.error("Erro no login:", error);
                let friendlyMessage = `Erro no login.`;
                if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
                   friendlyMessage = "Número de Inscrição ou Senha inválidos.";
                } else if (error.code === 'auth/invalid-email') {
                    friendlyMessage = "Formato do Número de Inscrição inválido para login.";
                } else {
                    friendlyMessage += ` (${error.code})`;
                }
                if(authMessageSpan) authMessageSpan.textContent = friendlyMessage;
            });
    });
    // --- REGISTRO ---
    registerBtn.addEventListener('click', () => {
        const inscricaoValue = inscricaoInput ? inscricaoInput.value.trim() : null;
        const password = passwordInput ? passwordInput.value : null;
        // REMOVER: const nomeValue = nomeInput ? nomeInput.value.trim() : null; // NOME NÃO É MAIS PEGO AQUI

        // Mudar validação para não exigir o campo nome aqui
        if (!inscricaoValue || !password) {
            if(authMessageSpan) authMessageSpan.textContent = 'Por favor, preencha Nº Inscrição e Senha para registrar.';
            return;
        }
        // Validação do formato da inscrição e senha (COMO ANTES) ...
         const inscricaoNumero = parseInt(inscricaoValue, 10);
        if (isNaN(inscricaoNumero) || inscricaoNumero < 240000000 || inscricaoNumero > 2421999999 || (inscricaoValue.length !== 9 && inscricaoValue.length !== 10)) {
             if(authMessageSpan) authMessageSpan.textContent = 'Nº de Inscrição inválido para registro. Use o formato numérico entre 240000000 e 2421999999.';
             return;
        }
         if (password.length < 6) {
             if(authMessageSpan) authMessageSpan.textContent = 'A senha deve ter no mínimo 6 caracteres.';
             return;
        }

        const emailFicticio = `${inscricaoValue}@inscricao.aft`;
        if(authMessageSpan) authMessageSpan.textContent = 'Registrando...';

        auth.createUserWithEmailAndPassword(emailFicticio, password)
            .then((userCredential) => {
                console.log("Registro bem-sucedido para (email fictício):", userCredential.user.email);

                // **Salva APENAS a inscrição no Firestore inicialmente**
                 if (db) {
                    db.collection(usuariosCollection)
                      .doc(userCredential.user.uid)
                      .set({
                        emailFicticio: userCredential.user.email,
                        numeroInscricao: inscricaoValue,
                        // REMOVER: nomeEscolhido: nomeValue, // NOME SERÁ SALVO DEPOIS
                        formaTratamento: '', // Inicializa forma de tratamento vazia
                        createdAt: firebase.firestore.FieldValue.serverTimestamp()
                    }, { merge: true }) // Usa merge true para não sobrescrever se já existir algo
                    .then(() => {
                        console.log("Dados básicos do usuário (inscrição) salvos no Firestore para:", userCredential.user.uid);
                        // **Após salvar dados básicos, CHAMA A FUNÇÃO PARA EXIBIR O MODAL**
                        exibirModalDefinirNome(true); // Passa true para indicar que é pós-registro
                    })
                    .catch(err => console.error("Erro ao salvar dados básicos do usuário no Firestore:", err));
                 } else {
                     console.warn("Firestore (db) não está disponível para salvar dados básicos do usuário.");
                     // Mesmo sem Firestore, exibir o modal localmente
                     exibirModalDefinirNome(true);
                 }
                 // A atualização do display será feita pelo onAuthStateChanged, mas o modal é exibido aqui
            })
            .catch((error) => {
                // Tratamento de erros (COMO ANTES) ...
                 console.error("Erro no registro:", error);
                 let friendlyMessage = `Erro no registro: ${error.message}`;
                 if (error.code === 'auth/email-already-in-use') {
                     friendlyMessage = "Este Número de Inscrição já está registrado.";
                 } else if (error.code === 'auth/invalid-email') {
                     friendlyMessage = "Formato do Número de Inscrição inválido para registro.";
                 }
                if(authMessageSpan) authMessageSpan.textContent = friendlyMessage;
            });
    });
    // --- LOGOUT --- (COMO ANTES) ...
    logoutBtn.addEventListener('click', () => {
        salvarProgresso().then(() => {
             if(authMessageSpan) authMessageSpan.textContent = 'Saindo...';
             auth.signOut()
                .then(() => {
                    if(authMessageSpan) authMessageSpan.textContent = 'Você saiu.';
                    console.log("Logout bem-sucedido.");
                    if(setNameModalDiv) setNameModalDiv.style.display = 'none'; // Esconde modal no logout
                    carregarProgresso(); // Recarrega em modo anônimo
                })
                .catch((error) => {
                    console.error("Erro no logout:", error);
                    if(authMessageSpan) authMessageSpan.textContent = `Erro ao sair: ${error.message}`;
                });
        }).catch(err => {
            console.error("Erro ao salvar progresso antes do logout:", err);
             auth.signOut().catch(logoutErr => console.error("Erro no logout após falha no salvamento:", logoutErr));
        });
    });
    // --- OBSERVADOR DE ESTADO DE AUTENTICAÇÃO ---
    auth.onAuthStateChanged(async (user) => {
        const isAdminSectionOpen = adminContent && adminContent.style.display === 'block'; // Verifica se admin estava aberto

        if (user) {
            console.log("Usuário logado (email fictício):", user.email);
            if(loginFormDiv) loginFormDiv.style.display = 'none';
            if(userInfoDiv) userInfoDiv.style.display = 'block';

            // **Verifica se precisa definir nome/tratamento**
            await verificarNecessidadeModalNome(user.uid); // Função que busca dados no Firestore e decide se mostra modal ou welcome message

            // Restaura estado da seção admin se necessário
            if(adminContent) adminContent.style.display = isAdminSectionOpen ? 'block' : 'none';
             if(adminToggle) {
                const iconSpan = adminToggle.querySelector('.toggle-icon');
                if (iconSpan) iconSpan.textContent = isAdminSectionOpen ? '-' : '+';
             }
             if(adicionarQuestaoBtn) adicionarQuestaoBtn.disabled = false; // Habilita botão de admin

            carregarProgresso(); // Carrega o progresso (agora online)

        } else {
            // Lógica para usuário deslogado (COMO ANTES, MAS GARANTE QUE MODAL SOME)
            console.log("Nenhum usuário logado.");
            if(welcomeMessageSpan) welcomeMessageSpan.innerHTML = ''; // Limpa welcome message
            if(loginFormDiv) loginFormDiv.style.display = 'block';
            if(userInfoDiv) userInfoDiv.style.display = 'none';
            if(setNameModalDiv) setNameModalDiv.style.display = 'none'; // Esconde modal
            if(adminContent) adminContent.style.display = 'none';
             if(adminToggle) {
                const iconSpan = adminToggle.querySelector('.toggle-icon');
                if (iconSpan) iconSpan.textContent = '+';
             }
            if(adicionarQuestaoBtn) adicionarQuestaoBtn.disabled = true;
             if(authMessageSpan && authMessageSpan.textContent === 'Saindo...') authMessageSpan.textContent = 'Você saiu.';
            carregarProgresso(); // Carrega progresso local (anônimo)
        }
    });

    // --- Listener para o botão Salvar no Modal ---
    if (saveNameBtn) {
        saveNameBtn.addEventListener('click', salvarNomeTratamento);
    }
}

// --- Função para exibir a mensagem de boas-vindas ---
function exibirMensagemBoasVindas(nome, formaTratamento) {
    if (welcomeMessageSpan) {
        let terminacao = '';
        let artigo = ''; // Para tratar o caso de 'Prefiro não usar'

        // Define a terminação baseada na forma de tratamento
        switch (formaTratamento) {
            case 'o': terminacao = 'o'; artigo = 'o'; break;
            case 'a': terminacao = 'a'; artigo = 'a'; break;
            case 'e': terminacao = 'e'; artigo = 'e'; break;
            case 'x': terminacao = 'x'; artigo = 'x'; break;
            case '@': terminacao = '@'; artigo = '@'; break;
            case '': // Caso 'Prefiro não usar'
            default:
                terminacao = '';
                artigo = '';
                break;
        }

        // Constrói a mensagem
        if (artigo) {
             welcomeMessageSpan.innerHTML = `Seja bem-vind${artigo}, <b>${nome || 'Usuário'}</b>`;
        } else {
             welcomeMessageSpan.innerHTML = `Boas-vindas, <b>${nome || 'Usuário'}</b>`; // Mensagem alternativa
        }

    }
    if (setNameModalDiv) setNameModalDiv.style.display = 'none'; // Esconde o modal após exibir a mensagem
}


// --- Função para exibir o modal de definir nome ---
function exibirModalDefinirNome(isPosRegistro = false) {
    if (setNameModalDiv) {
        console.log("Exibindo modal para definir nome.");
        setNameModalDiv.style.display = 'block';
        if (isPosRegistro) {
            if(setNameMessageSpan) setNameMessageSpan.textContent = 'Registro concluído! Defina seu nome e tratamento.';
        } else {
            if(setNameMessageSpan) setNameMessageSpan.textContent = ''; // Limpa mensagem se não for pós-registro
        }
    } else {
        // Se o elemento do modal não foi encontrado (pode ser o erro original)
        console.error("Modal #set-name-modal não encontrado no DOM.");
        if(authMessageSpan) authMessageSpan.textContent = "Erro: Interface de usuário incompleta (modal).";
    }
}

// --- Função para verificar se o usuário precisa definir nome/tratamento ---
async function verificarNecessidadeModalNome(userId) {
    if (!db) {
        console.warn("Firestore não disponível, exibindo modal como fallback.");
        exibirModalDefinirNome(false); // Exibe o modal se não conseguir verificar
        return;
    }
    try {
        const userDocRef = db.collection(usuariosCollection).doc(userId);
        const userDoc = await userDocRef.get();

        if (userDoc.exists) {
            const userData = userDoc.data();
            // Verifica se nomeEscolhido E formaTratamento (mesmo que vazia '') já existem
            if (userData.hasOwnProperty('nomeEscolhido') && userData.hasOwnProperty('formaTratamento')) {
                 // Se já definiu (mesmo que formaTratamento seja ''), exibe a mensagem
                 console.log("Usuário já definiu nome e tratamento:", userData.nomeEscolhido, "|", userData.formaTratamento);
                 exibirMensagemBoasVindas(userData.nomeEscolhido, userData.formaTratamento);
            } else {
                 // Se falta nome OU formaTratamento (ou ambos), exibe o modal
                 console.log("Usuário precisa definir nome e/ou tratamento.");
                 exibirModalDefinirNome(false);
            }
        } else {
            // Documento do usuário não existe (pode acontecer em casos raros ou migrações)
            console.warn("Documento do usuário não encontrado no Firestore. Exibindo modal.");
            exibirModalDefinirNome(false);
        }
    } catch (error) {
        console.error("Erro ao verificar dados do usuário no Firestore:", error);
        // Fallback em caso de erro: exibe o modal
        exibirModalDefinirNome(false);
    }
}


// --- Função para salvar nome e tratamento do modal ---
async function salvarNomeTratamento() {
    if (!auth || !auth.currentUser || !db || !nomeEscolhidoInput || !formaTratamentoSelect) {
        if(setNameMessageSpan) setNameMessageSpan.textContent = 'Erro: Não foi possível salvar. Tente novamente.';
        console.error("Erro: Usuário não logado, Firestore indisponível ou elementos do modal não encontrados.");
        return;
    }

    const userId = auth.currentUser.uid;
    const nomeEscolhido = nomeEscolhidoInput.value.trim();
    const formaTratamento = formaTratamentoSelect.value;

    if (!nomeEscolhido) {
        if(setNameMessageSpan) setNameMessageSpan.textContent = 'Por favor, insira um nome para exibição.';
        return;
    }

    if(setNameMessageSpan) setNameMessageSpan.textContent = 'Salvando...';

    try {
        const userDocRef = db.collection(usuariosCollection).doc(userId);
        await userDocRef.set({
            nomeEscolhido: nomeEscolhido,
            formaTratamento: formaTratamento
        }, { merge: true }); // Usa merge: true para adicionar/atualizar apenas estes campos

        console.log("Nome e tratamento salvos no Firestore para:", userId);
        if(setNameMessageSpan) setNameMessageSpan.textContent = 'Salvo!';

        // Exibe a mensagem de boas-vindas atualizada e esconde o modal
        exibirMensagemBoasVindas(nomeEscolhido, formaTratamento);

    } catch (error) {
        console.error("Erro ao salvar nome/tratamento no Firestore:", error);
        if(setNameMessageSpan) setNameMessageSpan.textContent = 'Erro ao salvar. Tente novamente.';
    }
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
                    console.log("Dados de estatísticas do Firebase encontrados para:", userId);
                    const dadosFirebase = doc.data();
                    // Carrega dados de ESTATÍSTICAS do Firebase
                    progressoGeral.temaSelecionado = dadosFirebase.temaSelecionado || 'todos';
                    progressoGeral.ultimoIndicePorTema = dadosFirebase.ultimoIndicePorTema || {};
                    progressoGeral.estatisticasGerais = dadosFirebase.estatisticasGerais || { respondidas: 0, acertos: 0, incorretas: 0, puladas: 0 };
                    progressoGeral.questoesResolvidasIds = new Set(dadosFirebase.questoesResolvidasIds || []);
                    progressoGeral.respostasUsuario = dadosFirebase.respostasUsuario || {};

                    // Carrega questões adicionadas do LOCAL STORAGE (não estão na coleção de estatísticas)
                     const progressoLocalSalvo = localStorage.getItem(key);
                     if (progressoLocalSalvo) {
                         try {
                             const progressoLocal = JSON.parse(progressoLocalSalvo);
                             progressoGeral.questoesAdicionadasUsuario = progressoLocal?.questoesAdicionadasUsuario || [];
                             console.log("Questões adicionadas carregadas do Local Storage para usuário logado.");
                         } catch(e) { console.error("Erro ao parsear LocalStorage para questões adicionadas (usuário logado):", e); }
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
    if (dadosFirebasePrioritarios) {
        console.log("Dados do Firebase já foram carregados, pulando carregamento do Local Storage.");
        finalizarCarregamentoAplicandoDados();
        return;
    }

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

    if (progressoCarregadoLocal) {
        progressoGeral.temaSelecionado = progressoCarregadoLocal.temaSelecionado || 'todos';
        progressoGeral.ultimoIndicePorTema = progressoCarregadoLocal.ultimoIndicePorTema || {};
        progressoGeral.estatisticasGerais = progressoCarregadoLocal.estatisticasGerais || { respondidas: 0, acertos: 0, incorretas: 0, puladas: 0 };
        progressoGeral.questoesResolvidasIds = new Set(progressoCarregadoLocal.questoesResolvidasIds || []);
        progressoGeral.respostasUsuario = progressoCarregadoLocal.respostasUsuario || {};
        progressoGeral.questoesAdicionadasUsuario = progressoCarregadoLocal.questoesAdicionadasUsuario || [];

        const idsErradasLocal = progressoCarregadoLocal.questoesErradasIds || [];
        let baseQuestoes = typeof questoes !== 'undefined' ? [...questoes] : [];
        todasQuestoes = [...baseQuestoes, ...(progressoGeral.questoesAdicionadasUsuario || [])]; // Recalcula todasQuestoes AQUI
        progressoGeral.questoesErradas = todasQuestoes.filter(q => q && q.id && idsErradasLocal.includes(q.id));

         if (isUserLoggedIn) {
             if(authMessageSpan) authMessageSpan.textContent = 'Progresso local carregado (online falhou).';
         } else {
             if(authMessageSpan) authMessageSpan.textContent = 'Progresso local (anônimo) carregado.';
         }

    } else {
        if (isUserLoggedIn) {
            if(authMessageSpan) authMessageSpan.textContent = 'Nenhum progresso encontrado (online ou local). Iniciando.';
        } else {
            if(authMessageSpan) authMessageSpan.textContent = 'Bem-vindo(a)! Nenhum progresso local.';
        }
    }

    finalizarCarregamentoAplicandoDados();
}



function finalizarCarregamentoAplicandoDados() {
    let baseQuestoes = typeof questoes !== 'undefined' ? [...questoes] : [];
    todasQuestoes = [...baseQuestoes, ...(progressoGeral.questoesAdicionadasUsuario || [])];
    atualizarFiltroTemas();

    temaSelecionado = progressoGeral.temaSelecionado || 'todos';
    const ultimoIndiceSalvo = progressoGeral.ultimoIndicePorTema?.[temaSelecionado] || 0;

    if (filtroTema) filtroTema.value = temaSelecionado;

    filtrarEExibir(ultimoIndiceSalvo);

    atualizarContadoresGlobais();
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
            label.style.display = '';
        }
         const span = label ? label.querySelector('span:not(.letra-alternativa)') : null;
         if (span) span.innerHTML = '';
    });
    alternativasForm.classList.remove('alternativas-desabilitadas');
    alternativasForm.style.display = 'block';

    if (gabaritoTexto) {
        gabaritoTexto.classList.remove('gabarito-resposta-incorreta');
    }

    if (resultadoDiv) resultadoDiv.style.display = 'none';
    if (responderBtn) responderBtn.disabled = true;
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
         if(perguntaAutorDiv) perguntaAutorDiv.innerHTML = '';
        questaoAtualObj = null;
        atualizarContador();
        return;
    }

    if (indiceQuestaoAtual < 0 || indiceQuestaoAtual >= questoesFiltradas.length) {
         indiceQuestaoAtual = 0;
         console.warn("Índice da questão inválido após filtragem, resetando para 0.");
         if (!modoRefazerErradas && progressoGeral.ultimoIndicePorTema) {
             progressoGeral.ultimoIndicePorTema[temaSelecionado] = indiceQuestaoAtual;
             salvarProgresso();
         }
    }


    if (indiceQuestaoAtual >= questoesFiltradas.length) {
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
             if(perguntaAutorDiv) perguntaAutorDiv.innerHTML = '';
            questaoAtualObj = null;
         } else {
            if (mensagemFim) {
                 mensagemFim.textContent = "Você concluiu a bateria de questões erradas!";
                 mensagemFim.style.display = 'block';
            }
             progressoGeral.questoesErradas = [];
             modoRefazerErradas = false;
             temaSelecionado = temaOriginalAntesRefazer;
             if(filtroTema) {
                 filtroTema.value = temaSelecionado;
                 filtroTema.disabled = false;
             }
             if(document.getElementById('filtros-navegacao')) document.getElementById('filtros-navegacao').style.display = 'flex';
             if(statusBateriaSpan) statusBateriaSpan.textContent = "";
             filtrarEExibir();
             return;
         }
         atualizarContador();
         exibirOpcaoRefazerErradas();
         salvarProgresso();
         return;
    }


    questaoAtualObj = questoesFiltradas[indiceQuestaoAtual];

     if (!questaoAtualObj.id) {
        const timestamp = Date.now();
        const randomPart = Math.random().toString(36).substring(2, 8);
        questaoAtualObj.id = `q_auto_${indiceQuestaoAtual}_${timestamp}_${randomPart}`;
        const indexEmTodas = todasQuestoes.findIndex(q => q && q.pergunta === questaoAtualObj.pergunta && q.tema === questaoAtualObj.tema && !q.id);
        if (indexEmTodas > -1 && todasQuestoes[indexEmTodas]) {
             todasQuestoes[indexEmTodas].id = questaoAtualObj.id;
        } else {
            const indexAdicionadas = progressoGeral.questoesAdicionadasUsuario.findIndex(q => q && q.pergunta === questaoAtualObj.pergunta && q.tema === questaoAtualObj.tema && !q.id);
             if (indexAdicionadas > -1 && progressoGeral.questoesAdicionadasUsuario[indexAdicionadas]) {
                 progressoGeral.questoesAdicionadasUsuario[indexAdicionadas].id = questaoAtualObj.id;
             }
        }
        console.warn(`Questão sem ID detectada e ID gerado: ${questaoAtualObj.id}`);
        salvarProgresso();
     }

    if (perguntaTexto) {
        const numeroDaQuestaoNoTema = indiceQuestaoAtual + 1;
        perguntaTexto.innerHTML = `<b>${numeroDaQuestaoNoTema}.</b> ${questaoAtualObj.pergunta}`;
    }
    if (perguntaAutorDiv) {
        perguntaAutorDiv.innerHTML = questaoAtualObj.autor ? `<span style="font-size:0.8em; color: #6c757d; display:block; margin-bottom: 8px;">Questão elaborada por: ${questaoAtualObj.autor}</span>` : '';
    }

    const tipoQuestao = questaoAtualObj.tipo || (questaoAtualObj.alternativa3 || questaoAtualObj.alternativa4 || questaoAtualObj.alternativa5 ? 'ME' : 'CE');

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
    } else {
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
    if (responderBtn) responderBtn.disabled = true;
    if (pularBtn) pularBtn.style.display = 'block';
    if (aleatoriaQuestaoBtn) aleatoriaQuestaoBtn.style.display = 'block';
    if (proximoTemaBtn) proximoTemaBtn.style.display = modoRefazerErradas ? 'none' : 'block';
    if (proximaQuestaoBtn) proximaQuestaoBtn.style.display = 'none';
    if (alternativasForm) alternativasForm.style.display = 'block';

    if (alternativasForm) {
        const inputsRadio = alternativasForm.querySelectorAll('input[type="radio"]');
        inputsRadio.forEach(input => {
            input.removeEventListener('change', habilitarResponder);
            input.addEventListener('change', habilitarResponder);
        });
    }

    atualizarContador();
    if (!modoRefazerErradas && progressoGeral.ultimoIndicePorTema) {
        progressoGeral.ultimoIndicePorTema[temaSelecionado] = indiceQuestaoAtual;
    }
    salvarProgresso();
}


function habilitarResponder() {
    if (responderBtn) responderBtn.disabled = false;
}

function verificarResposta(event) {
    event.preventDefault();
    if (!questaoAtualObj || !alternativasForm) return;

    const alternativaSelecionadaInput = alternativasForm.querySelector('input[name="alternativa"]:checked');
    if (!alternativaSelecionadaInput) return;

    const respostaUsuario = alternativaSelecionadaInput.value.toUpperCase();
    const respostaCorreta = questaoAtualObj.respostaCorreta ? questaoAtualObj.respostaCorreta.toUpperCase() : null;
    const questaoId = questaoAtualObj.id;

    if (!respostaCorreta || !questaoId) {
        console.error("Erro: Questão atual sem resposta correta ou ID definido.", questaoAtualObj);
        return;
    }

    const jaResolvida = progressoGeral.questoesResolvidasIds.has(questaoId);
    let acertou = respostaUsuario === respostaCorreta;

    if (!jaResolvida) {
        progressoGeral.estatisticasGerais.respondidas++;
        if (acertou) {
            progressoGeral.estatisticasGerais.acertos++;
        } else {
            progressoGeral.estatisticasGerais.incorretas++;
            if (!modoRefazerErradas && !progressoGeral.questoesErradas.some(q => q.id === questaoId)) {
                 if (questaoAtualObj.id) {
                    progressoGeral.questoesErradas.push({...questaoAtualObj});
                 } else {
                     console.error("Tentativa de adicionar questão errada sem ID:", questaoAtualObj);
                 }
            }
        }
        progressoGeral.questoesResolvidasIds.add(questaoId);
    } else if (modoRefazerErradas && acertou) {
        progressoGeral.questoesErradas = progressoGeral.questoesErradas.filter(q => q.id !== questaoId);
    }
    progressoGeral.respostasUsuario[questaoId] = respostaUsuario;

    alternativasForm.querySelectorAll('.alternativa-label').forEach(label => {
        const input = label.querySelector('input[type="radio"]');
        if (input) {
            if (input.value.toUpperCase() === respostaCorreta) {
                label.classList.add('correta');
            }
            if (input.checked && !acertou) {
                label.classList.add('incorreta-usuario');
            }
        }
    });
    alternativasForm.classList.add('alternativas-desabilitadas');

    if (mensagemResultado) {
        mensagemResultado.textContent = acertou ? "Correto!" : "Incorreto.";
        mensagemResultado.className = acertou ? 'feedback-acerto' : 'feedback-erro';
    }
    if (gabaritoTexto) {
        gabaritoTexto.innerHTML = `<b>Gabarito: ${respostaCorreta}</b>. <br>${questaoAtualObj.gabaritoComentado || ''}`;
        if (acertou) {
            gabaritoTexto.classList.remove('gabarito-resposta-incorreta');
        } else {
            gabaritoTexto.classList.add('gabarito-resposta-incorreta');
        }
    }

    if (resultadoDiv) resultadoDiv.style.display = 'block';
    if (responderBtn) responderBtn.style.display = 'none';
    if (pularBtn) pularBtn.style.display = 'none';
    if (proximaQuestaoBtn) proximaQuestaoBtn.style.display = 'block';

    atualizarContador();
    atualizarContadoresGlobais();
    exibirOpcaoRefazerErradas();
    salvarProgresso();
}



function proximaQuestao() {
    indiceQuestaoAtual++;
    exibirQuestao();
}

function pularQuestao() {
    if (!questaoAtualObj || !questaoAtualObj.id) return;
    const questaoId = questaoAtualObj.id;

    if (!progressoGeral.questoesResolvidasIds.has(questaoId)) {
        progressoGeral.estatisticasGerais.respondidas++;
        progressoGeral.estatisticasGerais.puladas = (progressoGeral.estatisticasGerais.puladas || 0) + 1;
        progressoGeral.questoesResolvidasIds.add(questaoId);
        salvarProgresso();
    } else {
        console.log(`Questão ${questaoId} já foi resolvida/pulada anteriormente.`);
    }


    indiceQuestaoAtual++;
    exibirQuestao();
    atualizarContadoresGlobais();
    exibirOpcaoRefazerErradas();
}

function exibirQuestaoAleatoria() {
    if (questoesFiltradas && questoesFiltradas.length > 0) {
        let novoIndice;
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
         if (todasQuestoes.length > 0) {
             let novoIndiceGeral;
             const idQuestaoAtual = questaoAtualObj ? questaoAtualObj.id : null;

             if (todasQuestoes.length === 1) {
                 novoIndiceGeral = 0;
             } else {
                 do {
                    novoIndiceGeral = Math.floor(Math.random() * todasQuestoes.length);
                 } while (idQuestaoAtual && todasQuestoes[novoIndiceGeral] && todasQuestoes[novoIndiceGeral].id === idQuestaoAtual);
             }


             const questaoAleatoria = todasQuestoes[novoIndiceGeral];
             if (questaoAleatoria && questaoAleatoria.tema) {
                 temaSelecionado = questaoAleatoria.tema;
                 if(filtroTema) filtroTema.value = temaSelecionado;
                 filtrarEExibir();
                 const indiceNaFiltrada = questoesFiltradas.findIndex(q => q.id === questaoAleatoria.id);
                 indiceQuestaoAtual = (indiceNaFiltrada !== -1) ? indiceNaFiltrada : 0;
                 exibirQuestao();
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
    const temas = Array.from(filtroTema.options).map(opt => opt.value).filter(val => val !== 'todos');
    if (temas.length === 0) return;

    const indiceTemaAtualNaLista = temas.indexOf(temaSelecionado);

    let proximoIndiceNaLista;
    if (temaSelecionado === 'todos' || indiceTemaAtualNaLista === -1 || indiceTemaAtualNaLista === temas.length - 1) {
        proximoIndiceNaLista = 0;
    } else {
        proximoIndiceNaLista = indiceTemaAtualNaLista + 1;
    }

    const proximoTemaValor = temas[proximoIndiceNaLista];
    filtroTema.value = proximoTemaValor;
    filtroTema.dispatchEvent(new Event('change'));
}

function atualizarContador() {
    if (!progressoGeral.questoesResolvidasIds || !questoesFiltradas) {
        if(totalQuestoesTemaSpan) totalQuestoesTemaSpan.textContent = questoesFiltradas?.length || 0;
        if(questoesResolvidasTemaSpan) questoesResolvidasTemaSpan.textContent = 0;
        if(acertosTemaSpan) acertosTemaSpan.textContent = 0;
        if(incorretasTemaSpan) incorretasTemaSpan.textContent = 0;
        return;
    }

    const resolvidasNesteTema = questoesFiltradas.filter(q => q && q.id && progressoGeral.questoesResolvidasIds.has(q.id));

    let acertosNesteTema = 0;
    let incorretasNesteTema = 0;

    resolvidasNesteTema.forEach(q => {
         if (q && q.id && progressoGeral.respostasUsuario[q.id]) {
            const respostaUsuario = progressoGeral.respostasUsuario[q.id].toUpperCase();
            const respostaCorreta = q.respostaCorreta ? q.respostaCorreta.toUpperCase() : null;
             if (respostaCorreta && respostaUsuario === respostaCorreta) {
                acertosNesteTema++;
            } else if (respostaCorreta) {
                incorretasNesteTema++;
            }
         }
    });

    if(totalQuestoesTemaSpan) totalQuestoesTemaSpan.textContent = questoesFiltradas.length;
    if(questoesResolvidasTemaSpan) questoesResolvidasTemaSpan.textContent = resolvidasNesteTema.length;
    if(acertosTemaSpan) acertosTemaSpan.textContent = acertosNesteTema;
    if(incorretasTemaSpan) incorretasTemaSpan.textContent = incorretasNesteTema;
}



function filtrarEExibir(indiceParaIniciar = 0) {
    const filtroValor = modoRefazerErradas ? "__refazer_erradas__" : (filtroTema ? filtroTema.value : 'todos');

    if (filtroValor === "__refazer_erradas__") {
        questoesFiltradas = [...(progressoGeral.questoesErradas || [])];
        indiceQuestaoAtual = 0;
        if (statusBateriaSpan) statusBateriaSpan.textContent = "[Refazendo Erradas] ";
        if (document.getElementById('filtros-navegacao')) document.getElementById('filtros-navegacao').style.display = 'none';
    } else {
        temaSelecionado = filtroValor;
        if (temaSelecionado === 'todos') {
            questoesFiltradas = [...todasQuestoes];
        } else {
            questoesFiltradas = todasQuestoes.filter(q => q.tema === temaSelecionado);
        }

        indiceQuestaoAtual = indiceParaIniciar >= 0 ? indiceParaIniciar : (progressoGeral.ultimoIndicePorTema?.[temaSelecionado] || 0);
        if (indiceQuestaoAtual >= questoesFiltradas.length) {
             indiceQuestaoAtual = 0;
        }


        if (statusBateriaSpan) statusBateriaSpan.textContent = "";
        if (document.getElementById('filtros-navegacao')) document.getElementById('filtros-navegacao').style.display = 'flex';

        progressoGeral.temaSelecionado = temaSelecionado;
    }

    exibirQuestao();
    exibirOpcaoRefazerErradas();
}



function exibirOpcaoRefazerErradas() {
    if (!questoesErradasContainer || !erradasContentDiv || !numQuestoesErradasSpan || !iniciarRefazerBtn) return;

    const numErradas = progressoGeral.questoesErradas ? progressoGeral.questoesErradas.length : 0;

    if (numErradas > 0) {
        numQuestoesErradasSpan.textContent = numErradas;
        iniciarRefazerBtn.disabled = false;
        questoesErradasContainer.style.display = 'block';
         const isContentVisible = erradasContentDiv.style.display === 'block';
         if (!isContentVisible) {
             // Opcional: abrir automaticamente
         }
    } else {
        numQuestoesErradasSpan.textContent = '0';
        iniciarRefazerBtn.disabled = true;
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
        temaOriginalAntesRefazer = temaSelecionado;
    }
    modoRefazerErradas = true;
    if (filtroTema) filtroTema.disabled = true;
    filtrarEExibir();
}

function atualizarFiltroTemas() {
    if (!filtroTema) return;

    const valorSelecionadoAnteriormente = filtroTema.value;

    // Limpa completamente o select, incluindo a opção "Todas as Matérias"
    filtroTema.innerHTML = '';

    // Recria a opção padrão "Todas as Matérias"
    const todasMateriasOpt = document.createElement('option');
    todasMateriasOpt.value = 'todos';
    todasMateriasOpt.textContent = 'Todas as Matérias';
    filtroTema.appendChild(todasMateriasOpt);

    // --- MODIFICAÇÃO: Separa os temas em Simulados (#), NRs e Tópicos ---
    const temasSimulados = [];
    const temasNRs = [];
    const temasTopicos = []; // Renomeado de temasOutros para temasTopicos
    const temasUnicos = [...new Set(todasQuestoes.map(q => q?.tema).filter(Boolean))];

    temasUnicos.forEach(tema => {
        if (tema.startsWith("#")) { // Identifica Simulados pelo '#'
            temasSimulados.push(tema);
        } else if (tema.startsWith("NR")) { // Identifica NRs
            temasNRs.push(tema);
        } else { // O restante são Tópicos Específicos
            temasTopicos.push(tema);
        }
    });

    // --- Ordenação (Opcional, mas recomendado) ---
    temasSimulados.sort((a, b) => a.localeCompare(b)); // Ordena Simulados alfabeticamente
    temasNRs.sort((a, b) => { // Ordena NRs numericamente
        const numA = parseInt(a.match(/\d+/)?.[0] || 0);
        const numB = parseInt(b.match(/\d+/)?.[0] || 0);
        return numA - numB;
    });
    temasTopicos.sort((a, b) => a.localeCompare(b)); // Ordena Tópicos alfabeticamente

    // --- Cria e adiciona os optgroups NA ORDEM DESEJADA ---

    // 1. Grupo Simulados
    if (temasSimulados.length > 0) {
        const optgroupSimulados = document.createElement('optgroup');
        optgroupSimulados.label = '--- Simulados ---'; // Título do grupo
        temasSimulados.forEach(tema => {
            const option = document.createElement('option');
            option.value = tema;
            option.textContent = tema;
            optgroupSimulados.appendChild(option);
        });
        filtroTema.appendChild(optgroupSimulados);
    }

    // 2. Grupo Normas Regulamentadoras
    if (temasNRs.length > 0) {
        const optgroupNRs = document.createElement('optgroup');
        optgroupNRs.label = '--- Normas Regulamentadoras ---'; // Título do grupo
        temasNRs.forEach(tema => {
            const option = document.createElement('option');
            option.value = tema;
            option.textContent = tema;
            optgroupNRs.appendChild(option);
        });
        filtroTema.appendChild(optgroupNRs);
    }

    // 3. Grupo Tópicos Específicos
    if (temasTopicos.length > 0) {
        const optgroupTopicos = document.createElement('optgroup');
        optgroupTopicos.label = '--- Tópicos Específicos ---'; // Título do grupo
        temasTopicos.forEach(tema => {
            const option = document.createElement('option');
            option.value = tema;
            option.textContent = tema;
            optgroupTopicos.appendChild(option);
        });
        filtroTema.appendChild(optgroupTopicos);
    }
    // --- FIM DA CRIAÇÃO DOS GRUPOS ---

    // Restaura a seleção anterior, se ainda existir
    let valorEncontrado = false;
    for (let i = 0; i < filtroTema.options.length; i++) {
        if (filtroTema.options[i].value === valorSelecionadoAnteriormente) {
            valorEncontrado = true;
            break;
        }
    }

    if (valorEncontrado) {
        filtroTema.value = valorSelecionadoAnteriormente;
    } else {
        filtroTema.value = 'todos'; // Volta para o padrão se o valor antigo sumiu
        temaSelecionado = 'todos';
         if (progressoGeral) progressoGeral.temaSelecionado = 'todos';
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
        if(alternativa3Input) alternativa3Input.value = '';
        if(alternativa4Input) alternativa4Input.value = '';
        if(alternativa5Input) alternativa5Input.value = '';
         if(respostaCorretaInput) respostaCorretaInput.placeholder = 'A (Certo) ou B (Errado)';
    } else { // ME
        alternativasMultiplaEscolhaDiv.style.display = 'block';
        alternativasCertoErradoDiv.style.display = 'none';
        if(alternativa1Input) { alternativa1Input.value = ''; alternativa1Input.readOnly = false; }
        if(alternativa2Input) { alternativa2Input.value = ''; alternativa2Input.readOnly = false; }
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
    const alternativasValidasCE = ['A', 'B'];

    if (tipoQuestao === 'ME') {
        if (!novaAlternativa1 || !novaAlternativa2 || !novaAlternativa3 || !novaAlternativa4 || !novaAlternativa5) {
            alert("Para Múltipla Escolha (A-E), preencha todas as alternativas.");
            return;
        }
        if (!alternativasValidasME.includes(novaRespostaCorreta)) {
            alert("Resposta Correta inválida para Múltipla Escolha. Use A, B, C, D ou E.");
            return;
        }
    } else { // CE
        novaAlternativa1 = 'Certo';
        novaAlternativa2 = 'Errado';
        novaAlternativa3 = novaAlternativa4 = novaAlternativa5 = '';

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

    // Tenta obter o identificador do usuário (nome ou número de inscrição)
    let autorNome = 'Usuário Local';
    if (auth && auth.currentUser && userIdentifierDisplaySpan) {
        autorNome = userIdentifierDisplaySpan.textContent || (auth.currentUser.email || 'Usuário Logado');
    }

    const novaQuestao = {
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
        autor: autorNome, // Usa o nome/identificador buscado
        tipo: tipoQuestao
    };

    todasQuestoes.push(novaQuestao);
    if (!progressoGeral.questoesAdicionadasUsuario) {
        progressoGeral.questoesAdicionadasUsuario = [];
    }
    progressoGeral.questoesAdicionadasUsuario.push(novaQuestao);

    atualizarFiltroTemas();
    salvarProgresso();

    alert("Questão adicionada com sucesso!");
    limparFormularioQuestao();
    if(formularioQuestaoDiv) formularioQuestaoDiv.style.display = 'none';

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
        if(arquivoQuestoesInput) arquivoQuestoesInput.value = '';
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
             // Tenta obter o identificador do usuário (nome ou número de inscrição)
            let autorImport = 'Importado Local';
            if (auth && auth.currentUser && userIdentifierDisplaySpan) {
                autorImport = userIdentifierDisplaySpan.textContent || (auth.currentUser.email || 'Usuário Logado');
            }


            novasQuestoes.forEach((nq, index) => {
                 if (!nq || typeof nq !== 'object' || !nq.tema || !nq.pergunta || !nq.respostaCorreta) {
                    ignoradas++;
                    questoesInvalidas.push({index: index + 1, reason: "Estrutura básica inválida (falta tema, pergunta ou resposta)"});
                    return;
                 }

                const tipoInferido = (!nq.alternativa3 && !nq.alternativa4 && !nq.alternativa5 && nq.alternativa1 && nq.alternativa2) ? 'CE' : 'ME';
                const tipoQuestao = nq.tipo || tipoInferido;

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
                    autor: nq.autor || autorImport, // Usa nome do usuário logado ou 'Importado Local'
                    tipo: tipoQuestao
                };

                if (tipoQuestao === 'CE') {
                    if (!questaoParaAdd.alternativa1 || !questaoParaAdd.alternativa2) {
                         ignoradas++;
                         questoesInvalidas.push({index: index + 1, reason: "Questão CE sem alternativa1 ou alternativa2"});
                         return;
                    }
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
                else if (tipoQuestao === 'ME') {
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
                    if (!nq.alternativa3) questaoParaAdd.alternativa3 = '';
                    if (!nq.alternativa4) questaoParaAdd.alternativa4 = '';
                    if (!nq.alternativa5) questaoParaAdd.alternativa5 = '';
                }
                 else {
                     ignoradas++;
                      questoesInvalidas.push({index: index + 1, reason: `Tipo de questão inválido ou não reconhecido: ${tipoQuestao}`});
                     return;
                 }


                todasQuestoes.push(questaoParaAdd);
                if (!progressoGeral.questoesAdicionadasUsuario) {
                    progressoGeral.questoesAdicionadasUsuario = [];
                }
                progressoGeral.questoesAdicionadasUsuario.push(questaoParaAdd);
                adicionadas++;

            });

            if (adicionadas > 0) {
                atualizarFiltroTemas();
                salvarProgresso();
                if(mensagemCarregamentoDiv) {
                     mensagemCarregamentoDiv.textContent = `${adicionadas} questões carregadas com sucesso!`;
                      if (ignoradas > 0) {
                         mensagemCarregamentoDiv.textContent += ` ${ignoradas} questões foram ignoradas por erros ou formato inválido.`;
                         console.warn("Detalhes das questões ignoradas:", questoesInvalidas);
                      }
                }
                filtrarEExibir();
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
            if(arquivoQuestoesInput) arquivoQuestoesInput.value = '';
        }
    };

    leitor.onerror = function() {
        console.error("Erro ao ler arquivo:", leitor.error);
        if(mensagemCarregamentoDiv) mensagemCarregamentoDiv.textContent = `Erro ao ler o arquivo. Verifique as permissões ou o arquivo selecionado.`;
        if(arquivoQuestoesInput) arquivoQuestoesInput.value = '';
    };

    leitor.readAsText(arquivo);
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
    }


    const isInitiallyOpen = contentDiv.style.display === 'block';
    if(iconSpan) iconSpan.textContent = isInitiallyOpen ? '-' : '+';

    toggleButton.addEventListener('click', () => {
        const isOpen = contentDiv.style.display === 'block';
        contentDiv.style.display = isOpen ? 'none' : 'block';
        if(iconSpan) iconSpan.textContent = isOpen ? '+' : '-';

        if (toggleId === 'admin-toggle' && progressoGeral) {
            progressoGeral.adminOpen = !isOpen;
        }
    });
}


// --- Função de Inicialização Geral ---
function inicializarApp() {
    console.log("App AFTec Simulador - Inicializando...");
    mapearElementosDOM();

    if (typeof questoes === 'undefined' || !Array.isArray(questoes)) {
        console.error("Variável 'questoes' não definida ou não é um array. Verifique questoes.js");
        if (perguntaTexto) perguntaTexto.textContent = "Erro: Nenhuma questão base carregada. Verifique o arquivo 'questoes.js'.";
        todasQuestoes = [];
    } else {
         todasQuestoes = [...questoes];
         todasQuestoes.forEach((q, index) => {
            if (q && !q.id) {
                const timestamp = Date.now();
                const randomPart = Math.random().toString(36).substring(2, 8);
                q.id = `q_base_${index}_${timestamp}_${randomPart}`;
            }
         });
    }


    if (auth) {
        setupAuthListeners();
    } else {
        console.log("Firebase Auth não disponível, operando em modo local/anônimo.");
        if(loginFormDiv) loginFormDiv.style.display = 'block';
        if(userInfoDiv) userInfoDiv.style.display = 'none';
        if(adminContent) adminContent.style.display = 'none';
        if(adicionarQuestaoBtn) adicionarQuestaoBtn.disabled = true;
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
                 if (progressoGeral) progressoGeral.temaSelecionado = temaSelecionado;
                 filtrarEExibir();
             }
        });
    }

    if (resetarProgressoBtn) {
        resetarProgressoBtn.addEventListener('click', () => {
            if (confirm('Tem certeza que deseja resetar TODO o progresso local e online (se logado)? Esta ação não pode ser desfeita.')) {
                resetarVariaveisDeEstadoQuiz(true);
                 filtrarEExibir();
                 atualizarContadoresGlobais();
                 exibirOpcaoRefazerErradas();
            }
        });
    }

    if (iniciarRefazerBtn) iniciarRefazerBtn.addEventListener('click', iniciarBateriaRefazer);

    if (adminToggle) setupCollapsible('admin-toggle', 'admin-content');
    if (document.getElementById('erradas-toggle')) setupCollapsible('erradas-toggle', 'erradas-content');

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
    if (tipoQuestaoSelect) tipoQuestaoSelect.addEventListener('change', ajustarFormAlternativas);

     if (carregarQuestoesBtn && arquivoQuestoesInput) {
        carregarQuestoesBtn.addEventListener('click', () => arquivoQuestoesInput.click());
        arquivoQuestoesInput.addEventListener('change', carregarQuestoesDeArquivoJSON);
     }

    const linkReportar = document.getElementById('link-reportar');
    if (linkReportar) {
        linkReportar.addEventListener('click', (event) => {
            event.preventDefault();
            if (questaoAtualObj && questaoAtualObj.id) {
                const tema = questaoAtualObj.tema || 'N/A';
                const id = questaoAtualObj.id;
                const pergunta = questaoAtualObj.pergunta.substring(0, 50) + "...";
                const confirmReport = confirm(`Reportar erro na questão atual?\n\nTema: ${tema}\nID: ${id}\nInício: ${pergunta}`);
                if (confirmReport) {
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
// Garante que o DOM esteja carregado antes de executar o script principal
document.addEventListener('DOMContentLoaded', inicializarApp);
