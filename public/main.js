// ============================================================================
//  Painel web da Pizzaria Sabor & Arte (arquivo único para fácil estudo)
//  - Define os tipos usados pela aplicação
//  - Controla o estado salvo no localStorage
//  - Manipula o DOM para formulários, tabelas e relatórios
//  Cada bloco possui comentários explicativos para acelerar futuras mudanças.
// ============================================================================
// --------------------------- Seletores do DOM ------------------------------
// Guarda as referências aos elementos da interface. Qualquer alteração no HTML
// deve ser refletida aqui, evitando buscas repetidas com querySelector.
const STORAGE_KEY = 'pizzaria-web-state-v1';
const navButtons = Array.from(document.querySelectorAll('.nav-btn'));
const sections = Array.from(document.querySelectorAll('main .view'));
const feedbackBox = document.getElementById('feedback');
let feedbackTimeout;
const clienteForm = document.getElementById('cliente-form');
const clienteNome = document.getElementById('cliente-nome');
const clienteTelefone = document.getElementById('cliente-telefone');
const clienteEndereco = document.getElementById('cliente-endereco');
const clienteCancel = document.getElementById('cliente-cancel');
const clienteTitle = document.querySelector('[data-cliente-form-title]');
const clientesTableBody = document.querySelector('#clientes-table tbody');
const produtoForm = document.getElementById('produto-form');
const produtoNome = document.getElementById('produto-nome');
const produtoCategoria = document.getElementById('produto-categoria');
const produtoPreco = document.getElementById('produto-preco');
const produtoAtivo = document.getElementById('produto-ativo');
const produtoCancel = document.getElementById('produto-cancel');
const produtoTitle = document.querySelector('[data-produto-form-title]');
const produtosTableBody = document.querySelector('#produtos-table tbody');
const pedidoForm = document.getElementById('pedido-form');
const pedidoCliente = document.getElementById('pedido-cliente');
const pedidoProduto = document.getElementById('pedido-produto');
const pedidoQuantidade = document.getElementById('pedido-quantidade');
const pedidoAddItem = document.getElementById('pedido-add-item');
const pedidoForma = document.getElementById('pedido-forma');
const pedidoReset = document.getElementById('pedido-reset');
const pedidoItensBody = document.querySelector('#pedido-itens tbody');
const pedidosTableBody = document.querySelector('#pedidos-table tbody');
const totalBrutoSpan = document.querySelector('[data-total-bruto]');
const totalDescontoSpan = document.querySelector('[data-total-desconto]');
const totalLiquidoSpan = document.querySelector('[data-total-liquido]');
const totalObservacao = document.querySelector('[data-total-observacao]');
const relatorioDiaBody = document.querySelector('#relatorio-dia tbody');
const relatorioMesBody = document.querySelector('#relatorio-mes tbody');
const historicoSelect = document.getElementById('historico-cliente-select');
const historicoLista = document.getElementById('historico-lista');
const resetDadosBtn = document.getElementById('reset-dados');
const limparDadosBtn = document.getElementById('limpar-dados');
// --------------------------- Estado e variáveis ----------------------------
// Recupera os dados já salvos e prepara o array temporário dos itens do pedido
// que o usuário está montando na tela de Pedidos.
let state = carregarEstado();
let pedidoItens = [];
// ---------------------------- Navegação geral ------------------------------
// Liga os botões da barra superior às respectivas seções e mantém o histórico
// e os formulários reagindo às ações do usuário.
navButtons.forEach(btn => {
    btn.addEventListener('click', () => trocarSecao(btn.dataset.section || 'clientes'));
});
historicoSelect.addEventListener('change', () => renderHistoricoLista());
pedidoAddItem.addEventListener('click', adicionarItemAoPedido);
pedidoReset.addEventListener('click', () => {
    pedidoItens = [];
    renderPedidoItens();
    renderTotaisPedido();
});
clienteForm.addEventListener('submit', salvarCliente);
clienteCancel.addEventListener('click', cancelarEdicaoCliente);
clientesTableBody.addEventListener('click', tratarAcoesClientes);
produtoForm.addEventListener('submit', salvarProduto);
produtoCancel.addEventListener('click', cancelarEdicaoProduto);
produtosTableBody.addEventListener('click', tratarAcoesProdutos);
pedidoForm.addEventListener('submit', finalizarPedido);
pedidoItensBody.addEventListener('click', tratarAcoesItensPedido);
pedidosTableBody.addEventListener('click', tratarAcoesPedidos);
pedidoForma.addEventListener('change', renderTotaisPedido);
// ----------------------- Botões de dados de exemplo ------------------------
// Permitem restaurar os dados iniciais ou limpar tudo rapidamente.
resetDadosBtn.addEventListener('click', () => {
    state = gerarEstadoPadrao();
    pedidoItens = [];
    salvarEstado();
    renderTudo();
    mostrarFeedback('Dados de exemplo carregados novamente.');
});
limparDadosBtn.addEventListener('click', () => {
    state = gerarEstadoVazio();
    pedidoItens = [];
    salvarEstado();
    renderTudo();
    mostrarFeedback('Todos os dados foram limpos.');
});
renderTudo();
mostrarFeedback('Sistema carregado. Aproveite!', 'success');
// ============================================================================
//  Funções de estado e armazenamento em localStorage
// ============================================================================
// Cria um conjunto de dados de exemplo para popular a aplicação na primeira execução
function gerarEstadoPadrao() {
    return {
        clientes: [
            { id: 1, nome: 'Ana Silva', telefone: '(11) 98888-0000', endereco: 'Rua das Flores, 123', historicoPedidosIds: [] },
            { id: 2, nome: 'Bruno Costa', telefone: '(11) 97777-1111', endereco: 'Av. Central, 456', historicoPedidosIds: [] }
        ],
        produtos: [
            { id: 1, nome: 'Pizza Marguerita', categoria: 'Pizza', preco: 39.9, ativo: true },
            { id: 2, nome: 'Refrigerante 2L', categoria: 'Refrigerante', preco: 12.5, ativo: true },
            { id: 3, nome: 'Pizza Chocolate', categoria: 'Sobremesa', preco: 42.0, ativo: true }
        ],
        pedidos: [],
        nextClienteId: 3,
        nextProdutoId: 4,
        nextPedidoId: 1
    };
}
// Utilizado quando o usuário deseja começar do zero
function gerarEstadoVazio() {
    return {
        clientes: [],
        produtos: [],
        pedidos: [],
        nextClienteId: 1,
        nextProdutoId: 1,
        nextPedidoId: 1
    };
}
// Lê o estado salvo no navegador, garantindo valores padrão em caso de erro
function carregarEstado() {
    const salvo = localStorage.getItem(STORAGE_KEY);
    if (!salvo) {
        const padrao = gerarEstadoPadrao();
        localStorage.setItem(STORAGE_KEY, JSON.stringify(padrao));
        return padrao;
    }
    try {
        const bruto = JSON.parse(salvo);
        return {
            clientes: bruto.clientes || [],
            produtos: bruto.produtos || [],
            pedidos: bruto.pedidos || [],
            nextClienteId: bruto.nextClienteId || 1,
            nextProdutoId: bruto.nextProdutoId || 1,
            nextPedidoId: bruto.nextPedidoId || 1
        };
    }
    catch (erro) {
        console.error('Erro ao ler dados salvos, usando padrão.', erro);
        return gerarEstadoPadrao();
    }
}
// Persiste o estado atual no localStorage
function salvarEstado() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}
// ============================================================================
//  Navegação e feedback visual
// ============================================================================
// Alterna a visibilidade das seções de acordo com o botão clicado
function trocarSecao(id) {
    navButtons.forEach(btn => btn.classList.toggle('active', btn.dataset.section === id));
    sections.forEach(sec => sec.classList.toggle('active', sec.id === id));
}
// Exibe mensagens temporárias na barra de feedback
function mostrarFeedback(texto, tipo = 'success') {
    feedbackBox.textContent = texto;
    feedbackBox.classList.remove('success', 'error');
    feedbackBox.classList.add('visible', tipo);
    window.clearTimeout(feedbackTimeout);
    feedbackTimeout = window.setTimeout(() => feedbackBox.classList.remove('visible'), 3000);
}
// ============================================================================
//  CRUD de Clientes
// ============================================================================
// Trata o envio do formulário de clientes (cria ou edita registros)
function salvarCliente(evento) {
    evento.preventDefault();
    const nome = clienteNome.value.trim();
    if (!nome) {
        mostrarFeedback('O nome é obrigatório para cadastrar um cliente.', 'error');
        return;
    }
    const telefone = clienteTelefone.value.trim();
    const endereco = clienteEndereco.value.trim();
    const editId = clienteForm.dataset.editId ? Number(clienteForm.dataset.editId) : undefined;
    if (editId) {
        const existente = state.clientes.find(c => c.id === editId);
        if (existente) {
            existente.nome = nome;
            existente.telefone = telefone;
            existente.endereco = endereco;
            mostrarFeedback('Cliente atualizado com sucesso.');
        }
    }
    else {
        state.clientes.push({
            id: state.nextClienteId++,
            nome,
            telefone,
            endereco,
            historicoPedidosIds: []
        });
        mostrarFeedback('Novo cliente cadastrado.');
    }
    salvarEstado();
    renderClientes();
    renderPedidoSelects();
    renderHistoricoSelect();
    clienteForm.reset();
    clienteForm.dataset.editId = '';
    clienteCancel.classList.add('hidden');
    clienteTitle.textContent = 'Novo cliente';
}
// Restaura o formulário de clientes para o estado inicial
function cancelarEdicaoCliente() {
    clienteForm.reset();
    clienteForm.dataset.editId = '';
    clienteCancel.classList.add('hidden');
    clienteTitle.textContent = 'Novo cliente';
}
// Detecta cliques nos botões de editar/remover dentro da tabela de clientes
function tratarAcoesClientes(evento) {
    const alvo = evento.target;
    if (!alvo.dataset.action)
        return;
    const id = Number(alvo.dataset.id);
    if (alvo.dataset.action === 'editar') {
        const cliente = state.clientes.find(c => c.id === id);
        if (!cliente)
            return;
        clienteNome.value = cliente.nome;
        clienteTelefone.value = cliente.telefone;
        clienteEndereco.value = cliente.endereco;
        clienteForm.dataset.editId = String(cliente.id);
        clienteCancel.classList.remove('hidden');
        clienteTitle.textContent = 'Editar cliente';
    }
    if (alvo.dataset.action === 'remover') {
        state.clientes = state.clientes.filter(c => c.id !== id);
        state.pedidos = state.pedidos.filter(p => p.clienteId !== id);
        salvarEstado();
        renderTudo();
        mostrarFeedback('Cliente removido.');
    }
}
// ============================================================================
//  CRUD de Produtos
// ============================================================================
// Controla o envio do formulário de produtos (criação ou edição)
function salvarProduto(evento) {
    evento.preventDefault();
    const nome = produtoNome.value.trim();
    const categoria = produtoCategoria.value || 'Outro';
    const preco = Number(produtoPreco.value);
    const ativo = produtoAtivo.checked;
    if (!nome || !produtoCategoria.value || isNaN(preco)) {
        mostrarFeedback('Preencha nome, categoria e preço do produto.', 'error');
        return;
    }
    const editId = produtoForm.dataset.editId ? Number(produtoForm.dataset.editId) : undefined;
    if (editId) {
        const existente = state.produtos.find(p => p.id === editId);
        if (existente) {
            existente.nome = nome;
            existente.categoria = categoria;
            existente.preco = preco;
            existente.ativo = ativo;
            mostrarFeedback('Produto atualizado com sucesso.');
        }
    }
    else {
        state.produtos.push({ id: state.nextProdutoId++, nome, categoria, preco, ativo });
        mostrarFeedback('Produto cadastrado.');
    }
    salvarEstado();
    renderProdutos();
    renderPedidoSelects();
    produtoForm.reset();
    produtoAtivo.checked = true;
    produtoForm.dataset.editId = '';
    produtoCancel.classList.add('hidden');
    produtoTitle.textContent = 'Novo produto';
}
// Restaura o formulário de produtos para o estado padrão
function cancelarEdicaoProduto() {
    produtoForm.reset();
    produtoAtivo.checked = true;
    produtoForm.dataset.editId = '';
    produtoCancel.classList.add('hidden');
    produtoTitle.textContent = 'Novo produto';
}
// Acompanha cliques nos botões da tabela de produtos
function tratarAcoesProdutos(evento) {
    const alvo = evento.target;
    if (!alvo.dataset.action)
        return;
    const id = Number(alvo.dataset.id);
    if (alvo.dataset.action === 'editar') {
        const produto = state.produtos.find(p => p.id === id);
        if (!produto)
            return;
        produtoNome.value = produto.nome;
        produtoCategoria.value = produto.categoria;
        produtoPreco.value = String(produto.preco);
        produtoAtivo.checked = produto.ativo;
        produtoForm.dataset.editId = String(produto.id);
        produtoCancel.classList.remove('hidden');
        produtoTitle.textContent = 'Editar produto';
    }
    if (alvo.dataset.action === 'remover') {
        state.produtos = state.produtos.filter(p => p.id !== id);
        pedidoItens = pedidoItens.filter(item => item.produtoId !== id);
        state.pedidos.forEach(p => {
            p.itens = p.itens.filter(item => item.produtoId !== id);
        });
        salvarEstado();
        renderTudo();
        mostrarFeedback('Produto removido.');
    }
}
// ============================================================================
//  Montagem de pedidos (itens, totais e finalização)
// ============================================================================
// Insere ou acumula itens na lista temporária do pedido em andamento
function adicionarItemAoPedido() {
    const produtoId = Number(pedidoProduto.value);
    const quantidade = Number(pedidoQuantidade.value);
    if (!produtoId || quantidade <= 0) {
        mostrarFeedback('Escolha um produto e informe a quantidade.', 'error');
        return;
    }
    const produto = state.produtos.find(p => p.id === produtoId && p.ativo);
    if (!produto) {
        mostrarFeedback('Produto inativo ou inexistente.', 'error');
        return;
    }
    const existente = pedidoItens.find(item => item.produtoId === produtoId);
    if (existente) {
        existente.quantidade += quantidade;
    }
    else {
        pedidoItens.push({ produtoId, quantidade });
    }
    pedidoQuantidade.value = '1';
    renderPedidoItens();
    renderTotaisPedido();
}
// Permite remover itens individuais antes de finalizar o pedido
function tratarAcoesItensPedido(evento) {
    const alvo = evento.target;
    if (!alvo.dataset.index)
        return;
    const indice = Number(alvo.dataset.index);
    pedidoItens.splice(indice, 1);
    renderPedidoItens();
    renderTotaisPedido();
}
// Valida os dados e transforma os itens em um pedido definitivo
function finalizarPedido(evento) {
    evento.preventDefault();
    if (pedidoItens.length === 0) {
        mostrarFeedback('Adicione pelo menos um item ao pedido.', 'error');
        return;
    }
    const clienteId = Number(pedidoCliente.value);
    if (!clienteId) {
        mostrarFeedback('Escolha um cliente para o pedido.', 'error');
        return;
    }
    const forma = pedidoForma.value || 'Dinheiro';
    const resumo = calcularResumoPedido(pedidoItens, forma);
    const novoPedido = {
        id: state.nextPedidoId++,
        clienteId,
        itens: pedidoItens.map(item => ({ ...item })),
        dataISO: new Date().toISOString(),
        formaPagamento: forma,
        totalBruto: Number(resumo.totalBruto.toFixed(2)),
        desconto: Number(resumo.desconto.toFixed(2)),
        totalLiquido: Number(resumo.totalLiquido.toFixed(2)),
        observacao: resumo.observacao,
        codigoFiscal: gerarCodigoFiscal()
    };
    state.pedidos.push(novoPedido);
    const cliente = state.clientes.find(c => c.id === clienteId);
    if (cliente)
        cliente.historicoPedidosIds.push(novoPedido.id);
    salvarEstado();
    pedidoItens = [];
    pedidoForm.reset();
    pedidoQuantidade.value = '1';
    renderTudo();
    mostrarFeedback('Pedido registrado com sucesso!');
}
// ============================================================================
//  Renderização de tabelas, relatórios e histórico
// ============================================================================
// Ouve cliques nos botões de cada pedido (excluir ou gerar PDF)
function tratarAcoesPedidos(evento) {
    const alvo = evento.target;
    if (!alvo.dataset.action)
        return;
    const id = Number(alvo.dataset.id);
    if (alvo.dataset.action === 'remover') {
        state.pedidos = state.pedidos.filter(p => p.id !== id);
        state.clientes.forEach(c => {
            c.historicoPedidosIds = c.historicoPedidosIds.filter(pid => pid !== id);
        });
        salvarEstado();
        renderTudo();
        mostrarFeedback('Pedido excluído.');
    }
    if (alvo.dataset.action === 'pdf') {
        emitirComprovanteFiscal(id);
    }
}
// Atualiza a tabela de clientes na view
function renderClientes() {
    if (state.clientes.length === 0) {
        clientesTableBody.innerHTML = '<tr><td class="empty" colspan="6">Cadastre seus primeiros clientes.</td></tr>';
        return;
    }
    clientesTableBody.innerHTML = state.clientes
        .map(cliente => `
      <tr>
        <td>${cliente.id}</td>
        <td>${cliente.nome}</td>
        <td>${cliente.telefone || '-'}</td>
        <td>${cliente.endereco || '-'}</td>
        <td>${cliente.historicoPedidosIds.length}</td>
        <td class="actions">
          <button type="button" class="link-btn" data-action="editar" data-id="${cliente.id}">Editar</button>
          <button type="button" class="link-btn danger" data-action="remover" data-id="${cliente.id}">Excluir</button>
        </td>
      </tr>
    `)
        .join('');
}
// Atualiza a tabela de produtos exibida na interface
function renderProdutos() {
    if (state.produtos.length === 0) {
        produtosTableBody.innerHTML = '<tr><td class="empty" colspan="6">Nenhum produto cadastrado ainda.</td></tr>';
        return;
    }
    produtosTableBody.innerHTML = state.produtos
        .map(produto => `
      <tr>
        <td>${produto.id}</td>
        <td>${produto.nome}</td>
        <td>${produto.categoria}</td>
        <td>${formatarMoeda(produto.preco)}</td>
        <td><span class="tag ${produto.ativo ? 'active' : 'inactive'}">${produto.ativo ? 'Ativo' : 'Inativo'}</span></td>
        <td class="actions">
          <button type="button" class="link-btn" data-action="editar" data-id="${produto.id}">Editar</button>
          <button type="button" class="link-btn danger" data-action="remover" data-id="${produto.id}">Excluir</button>
        </td>
      </tr>
    `)
        .join('');
}
// Mantém a lista de clientes/produtos nos selects atualizada
function renderPedidoSelects() {
    pedidoCliente.innerHTML = '<option value="">Selecione...</option>' + state.clientes
        .map(cliente => `<option value="${cliente.id}">${cliente.nome}</option>`)
        .join('');
    const produtosAtivos = state.produtos.filter(p => p.ativo);
    pedidoProduto.innerHTML = '<option value="">Selecione...</option>' + produtosAtivos
        .map(produto => `<option value="${produto.id}">${produto.nome} (${formatarMoeda(produto.preco)})</option>`)
        .join('');
}
// Desenha a tabela dos itens temporários do pedido atual
function renderPedidoItens() {
    if (pedidoItens.length === 0) {
        pedidoItensBody.innerHTML = '<tr><td class="empty" colspan="5">Nenhum item adicionado ainda.</td></tr>';
        return;
    }
    pedidoItensBody.innerHTML = pedidoItens
        .map((item, index) => {
        const produto = state.produtos.find(p => p.id === item.produtoId);
        const total = produto ? produto.preco * item.quantidade : 0;
        return `
        <tr>
          <td>${produto?.nome || 'Produto removido'}</td>
          <td>${produto?.categoria || '-'}</td>
          <td>${item.quantidade}</td>
          <td>${formatarMoeda(total)}</td>
          <td>
            <button type="button" class="link-btn danger" data-index="${index}">Remover</button>
          </td>
        </tr>
      `;
    })
        .join('');
}
// Recalcula totais sempre que itens ou forma de pagamento mudam
function renderTotaisPedido() {
    const forma = pedidoForma.value || 'Dinheiro';
    const resumo = calcularResumoPedido(pedidoItens, forma);
    totalBrutoSpan.textContent = formatarMoeda(resumo.totalBruto);
    totalDescontoSpan.textContent = formatarMoeda(resumo.desconto);
    totalLiquidoSpan.textContent = formatarMoeda(resumo.totalLiquido);
    totalObservacao.textContent = resumo.observacao || '';
}
// Exibe a tabela com todos os pedidos já registrados
function renderPedidosTabela() {
    if (state.pedidos.length === 0) {
        pedidosTableBody.innerHTML = '<tr><td class="empty" colspan="8">Nenhum pedido registrado.</td></tr>';
        return;
    }
    pedidosTableBody.innerHTML = state.pedidos
        .slice()
        .reverse()
        .map(pedido => {
        const cliente = state.clientes.find(c => c.id === pedido.clienteId);
        const itensTexto = pedido.itens
            .map(item => {
            const produto = state.produtos.find(p => p.id === item.produtoId);
            return produto ? `${item.quantidade}x ${produto.nome}` : `${item.quantidade}x [Produto removido]`;
        })
            .join(', ');
        return `
        <tr>
          <td>${pedido.id}</td>
          <td>${formatarDataCurta(pedido.dataISO)}</td>
          <td>${cliente?.nome || 'Cliente removido'}</td>
          <td>${itensTexto}</td>
          <td>${formatarMoeda(pedido.totalLiquido)}</td>
          <td>${pedido.formaPagamento}</td>
          <td>${pedido.codigoFiscal}</td>
          <td class="actions">
            <button type="button" class="link-btn" data-action="pdf" data-id="${pedido.id}">Gerar NF</button>
            <button type="button" class="link-btn danger" data-action="remover" data-id="${pedido.id}">Excluir</button>
          </td>
        </tr>
      `;
    })
        .join('');
}
// Gera as tabelas de pizzas vendidas por dia e por mês
function renderRelatorios() {
    const porDia = new Map();
    const porMes = new Map();
    state.pedidos.forEach(pedido => {
        const data = new Date(pedido.dataISO);
        const dia = formatarDataCurta(pedido.dataISO);
        const mes = `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}`;
        const pizzas = pedido.itens.reduce((total, item) => {
            const produto = state.produtos.find(p => p.id === item.produtoId);
            return produto && produto.categoria === 'Pizza' ? total + item.quantidade : total;
        }, 0);
        porDia.set(dia, (porDia.get(dia) || 0) + pizzas);
        porMes.set(mes, (porMes.get(mes) || 0) + pizzas);
    });
    relatorioDiaBody.innerHTML = porDia.size === 0
        ? '<tr><td class="empty" colspan="2">Sem dados de vendas ainda.</td></tr>'
        : Array.from(porDia.entries())
            .sort(([a], [b]) => (a > b ? -1 : 1))
            .map(([dia, quantidade]) => `<tr><td>${dia}</td><td>${quantidade}</td></tr>`)
            .join('');
    relatorioMesBody.innerHTML = porMes.size === 0
        ? '<tr><td class="empty" colspan="2">Sem dados de vendas ainda.</td></tr>'
        : Array.from(porMes.entries())
            .sort(([a], [b]) => (a > b ? -1 : 1))
            .map(([mes, quantidade]) => `<tr><td>${mes}</td><td>${quantidade}</td></tr>`)
            .join('');
}
// Atualiza o dropdown que permite selecionar um cliente no histórico
function renderHistoricoSelect() {
    historicoSelect.innerHTML = '<option value="">Selecione...</option>' + state.clientes
        .map(cliente => `<option value="${cliente.id}">${cliente.nome}</option>`)
        .join('');
}
// Monta a timeline com os pedidos do cliente selecionado
function renderHistoricoLista() {
    const clienteId = Number(historicoSelect.value);
    if (!clienteId) {
        historicoLista.innerHTML = '<p class="muted">Escolha um cliente para ver o histórico.</p>';
        return;
    }
    const pedidosCliente = state.pedidos
        .filter(p => p.clienteId === clienteId)
        .sort((a, b) => (a.dataISO > b.dataISO ? -1 : 1));
    if (pedidosCliente.length === 0) {
        historicoLista.innerHTML = '<p class="muted">Este cliente ainda não tem pedidos.</p>';
        return;
    }
    historicoLista.innerHTML = pedidosCliente
        .map(pedido => {
        const itens = pedido.itens.map(item => {
            const produto = state.produtos.find(p => p.id === item.produtoId);
            return produto ? `${item.quantidade}x ${produto.nome}` : `${item.quantidade}x [Produto removido]`;
        }).join(', ');
        return `
        <div class="card">
          <strong>${formatarDataCompleta(pedido.dataISO)}</strong>
          <span>${itens}</span>
          <span>Total pago: ${formatarMoeda(pedido.totalLiquido)} (${pedido.formaPagamento})</span>
          ${pedido.observacao ? `<span class="muted">${pedido.observacao}</span>` : ''}
        </div>
      `;
    })
        .join('');
}
// Helper que chama todos os renderizadores quando algo muda no estado
function renderTudo() {
    renderClientes();
    renderProdutos();
    renderPedidoSelects();
    renderPedidoItens();
    renderTotaisPedido();
    renderPedidosTabela();
    renderRelatorios();
    renderHistoricoSelect();
    renderHistoricoLista();
}
// Aplica as regras de desconto e retorna o resumo financeiro do pedido
function calcularResumoPedido(itens, forma) {
    let totalBruto = 0;
    let totalPizzas = 0;
    let valorPizzas = 0;
    itens.forEach(item => {
        const produto = state.produtos.find(p => p.id === item.produtoId);
        if (!produto)
            return;
        const subtotal = produto.preco * item.quantidade;
        totalBruto += subtotal;
        if (produto.categoria === 'Pizza') {
            totalPizzas += item.quantidade;
            valorPizzas += subtotal;
        }
    });
    let desconto = 0;
    const observacoes = [];
    if (totalPizzas >= 3) {
        desconto += valorPizzas * 0.1;
        observacoes.push('Promoção 3+ pizzas (10%)');
    }
    const hoje = new Date();
    if (hoje.getDay() === 3 && valorPizzas > 0) {
        desconto += valorPizzas * 0.05;
        observacoes.push('Quarta da Pizza (5%)');
    }
    if (forma === 'Pix' && totalBruto > 100) {
        desconto += totalBruto * 0.02;
        observacoes.push('PIX acima de 100 (2%)');
    }
    const totalLiquido = Math.max(totalBruto - desconto, 0);
    return {
        totalBruto,
        desconto,
        totalLiquido,
        observacao: observacoes.join(' | ')
    };
}
// Formata números como moeda brasileira
function formatarMoeda(valor) {
    return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}
// Formata datas ISO para dd/mm
function formatarDataCurta(iso) {
    const data = new Date(iso);
    return `${data.getDate().toString().padStart(2, '0')}/${(data.getMonth() + 1)
        .toString()
        .padStart(2, '0')}`;
}
// Formata datas ISO para uma string longa legível
function formatarDataCompleta(iso) {
    const data = new Date(iso);
    return data.toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}
// Gera um código fiscal fictício para exibir nos comprovantes
function gerarCodigoFiscal() {
    const numero = Math.floor(Math.random() * 9000) + 1000;
    return `NF-${numero}`;
}
// Monta um PDF estilizado com os dados do pedido selecionado
function emitirComprovanteFiscal(pedidoId) {
    const pedido = state.pedidos.find(p => p.id === pedidoId);
    if (!pedido) {
        mostrarFeedback('Pedido não encontrado para gerar o PDF.', 'error');
        return;
    }
    const cliente = state.clientes.find(c => c.id === pedido.clienteId);
    const construtor = window.jspdf?.jsPDF;
    if (!construtor) {
        console.error('jsPDF não disponível em window.jspdf');
        mostrarFeedback('Biblioteca de PDF não carregada. Verifique a internet.', 'error');
        return;
    }
    const doc = new construtor({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageWidth = 210;
    const marginX = 18;
    const contentWidth = pageWidth - marginX * 2;
    doc.setFillColor?.(58, 24, 10);
    doc.rect?.(0, 0, pageWidth, 42, 'F');
    doc.setTextColor?.(255, 238, 225);
    doc.setFont?.('helvetica', 'bold');
    doc.setFontSize(20);
    doc.text('Pizzaria Sabor & Arte', pageWidth / 2, 18, { align: 'center' });
    doc.setFontSize(12);
    doc.text('Comprovante Fiscal Digital (Modelo de Teste)', pageWidth / 2, 27, { align: 'center' });
    doc.setTextColor?.(255, 230, 208);
    doc.text(`Código Fiscal: ${pedido.codigoFiscal}`, pageWidth / 2, 35, { align: 'center' });
    let cursorY = 54;
    doc.setTextColor?.(64, 35, 20);
    doc.setFont?.('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('Dados do Pedido', marginX, cursorY);
    cursorY += 6;
    doc.setFont?.('helvetica', 'normal');
    doc.text(`Pedido nº ${pedido.id}`, marginX, cursorY);
    doc.text(formatarDataCompleta(pedido.dataISO), marginX + contentWidth - 1, cursorY, { align: 'right' });
    cursorY += 6;
    doc.text(`Cliente: ${cliente?.nome || 'Cliente removido'}`, marginX, cursorY);
    cursorY += 6;
    doc.text(`Contato: ${cliente?.telefone || '-'}`, marginX, cursorY);
    cursorY += 6;
    doc.text(`Endereço: ${cliente?.endereco || '-'}`, marginX, cursorY);
    cursorY += 10;
    doc.setFont?.('helvetica', 'bold');
    doc.text('Itens do Pedido', marginX, cursorY);
    cursorY += 4;
    const colDescricao = contentWidth * 0.55;
    const colQtd = contentWidth * 0.15;
    const colValor = contentWidth * 0.3;
    const headerY = cursorY;
    doc.setFillColor?.(255, 213, 148);
    doc.setDrawColor?.(212, 141, 90);
    doc.roundedRect?.(marginX, headerY, contentWidth, 8, 2, 2, 'F');
    doc.setFont?.('helvetica', 'bold');
    doc.setTextColor?.(70, 30, 12);
    doc.text('Descrição', marginX + 4, headerY + 5.5);
    doc.text('Qtd.', marginX + colDescricao + colQtd / 2, headerY + 5.5, { align: 'center' });
    doc.text('Total (R$)', marginX + colDescricao + colQtd + colValor - 4, headerY + 5.5, { align: 'right' });
    cursorY = headerY + 12;
    doc.setFont?.('helvetica', 'normal');
    doc.setTextColor?.(92, 56, 34);
    pedido.itens.forEach(item => {
        const produto = state.produtos.find(p => p.id === item.produtoId);
        const nomeProduto = produto?.nome || 'Produto removido';
        const subtotal = (produto?.preco || 0) * item.quantidade;
        doc.text(nomeProduto, marginX + 4, cursorY);
        doc.text(String(item.quantidade), marginX + colDescricao + colQtd / 2, cursorY, { align: 'center' });
        doc.text(formatarMoeda(subtotal), marginX + colDescricao + colQtd + colValor - 4, cursorY, { align: 'right' });
        doc.setDrawColor?.(222, 173, 130);
        doc.line?.(marginX, cursorY + 3, marginX + contentWidth, cursorY + 3);
        cursorY += 8;
    });
    cursorY += 2;
    doc.setFont?.('helvetica', 'bold');
    doc.setTextColor?.(77, 39, 21);
    doc.text('Resumo Financeiro', marginX, cursorY);
    cursorY += 6;
    doc.setFont?.('helvetica', 'normal');
    doc.setTextColor?.(92, 56, 34);
    doc.text('Forma de pagamento:', marginX, cursorY);
    doc.text(pedido.formaPagamento, marginX + contentWidth - 1, cursorY, { align: 'right' });
    cursorY += 6;
    doc.text('Total bruto:', marginX, cursorY);
    doc.text(formatarMoeda(pedido.totalBruto), marginX + contentWidth - 1, cursorY, { align: 'right' });
    cursorY += 6;
    const descontoAplicado = pedido.desconto > 0;
    if (descontoAplicado) {
        doc.text('Descontos aplicados:', marginX, cursorY);
        doc.text(`-${formatarMoeda(pedido.desconto)}`, marginX + contentWidth - 1, cursorY, { align: 'right' });
        cursorY += 6;
    }
    else {
        doc.text('Descontos aplicados:', marginX, cursorY);
        doc.text('Nenhum', marginX + contentWidth - 1, cursorY, { align: 'right' });
        cursorY += 6;
    }
    doc.setFont?.('helvetica', 'bold');
    doc.setTextColor?.(210, 83, 34);
    doc.text('Total a pagar:', marginX, cursorY);
    doc.text(formatarMoeda(pedido.totalLiquido), marginX + contentWidth - 1, cursorY, { align: 'right' });
    cursorY += 8;
    if (descontoAplicado) {
        const boxY = cursorY;
        doc.setFillColor?.(255, 232, 210);
        doc.setDrawColor?.(210, 140, 95);
        doc.roundedRect?.(marginX, boxY, contentWidth, pedido.observacao ? 16 : 12, 2, 2, 'F');
        doc.setFont?.('helvetica', 'bold');
        doc.setTextColor?.(120, 60, 30);
        doc.text(`Desconto aplicado: -${formatarMoeda(pedido.desconto)}`, marginX + 4, boxY + 6);
        if (pedido.observacao) {
            doc.setFont?.('helvetica', 'normal');
            doc.text(pedido.observacao, marginX + 4, boxY + 11.5, { maxWidth: contentWidth - 8 });
        }
        cursorY = boxY + (pedido.observacao ? 22 : 16);
    }
    if (!descontoAplicado) {
        cursorY += 10;
    }
    if (pedido.observacao && !descontoAplicado) {
        doc.setFont?.('helvetica', 'bold');
        doc.setTextColor?.(77, 39, 21);
        doc.text('Observações:', marginX, cursorY);
        cursorY += 6;
        doc.setFont?.('helvetica', 'normal');
        doc.setTextColor?.(92, 56, 34);
        doc.text(pedido.observacao, marginX, cursorY, { maxWidth: contentWidth });
        cursorY += 10;
    }
    doc.setDrawColor?.(205, 145, 100);
    doc.line?.(marginX, cursorY, marginX + contentWidth, cursorY);
    cursorY += 8;
    doc.setFont?.('helvetica', 'italic');
    doc.setTextColor?.(160, 120, 95);
    doc.text('Documento gerado automaticamente para fins acadêmicos. Não possui validade fiscal.', pageWidth / 2, cursorY, {
        align: 'center'
    });
    cursorY += 12;
    doc.setFont?.('helvetica', 'normal');
    doc.setTextColor?.(210, 170, 140);
    doc.text('Pizzaria Sabor & Arte · Rua das Delícias, 123 · São Paulo/SP', pageWidth / 2, cursorY, { align: 'center' });
    doc.save(`pedido-${pedido.id}.pdf`);
    mostrarFeedback('Nota fiscal de teste gerada.', 'success');
}
export {};
