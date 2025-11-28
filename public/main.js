// @ts-nocheck
// Painel web da Pizzaria integrado à API Express/PostgreSQL
// O código mantém um estado mínimo em memória e sincroniza tudo via REST.
const API_BASE_URL = window.API_BASE_URL ?? 'http://localhost:3001/api';
const navButtons = Array.from(document.querySelectorAll('.nav-btn'));
const sections = Array.from(document.querySelectorAll('main .view'));
const feedbackBox = document.getElementById('feedback');
const clienteForm = document.getElementById('cliente-form');
const clienteCancel = document.getElementById('cliente-cancel');
const clienteTitle = document.querySelector('[data-cliente-form-title]');
const clientesTableBody = document.querySelector('#clientes-table tbody');
const produtoForm = document.getElementById('produto-form');
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
let clientes = [];
let produtos = [];
let pedidos = [];
let pedidoItensEmEdicao = [];
let feedbackTimeout;
function obterJsPDF() {
    const namespace = window.jspdf;
    return namespace?.jsPDF ?? null;
}
function trocarSecao(id) {
    navButtons.forEach(btn => btn.classList.toggle('active', btn.dataset.section === id));
    sections.forEach(sec => sec.classList.toggle('active', sec.id === id));
}
function mostrarFeedback(texto, tipo = 'success') {
    if (!feedbackBox)
        return;
    feedbackBox.textContent = texto;
    feedbackBox.classList.remove('success', 'error');
    feedbackBox.classList.add('visible', tipo);
    window.clearTimeout(feedbackTimeout);
    feedbackTimeout = window.setTimeout(() => feedbackBox.classList.remove('visible'), 3500);
}
async function requisicao(path, init) {
    const headers = { 'Accept': 'application/json' };
    if (init?.body && !(init.headers instanceof Headers)) {
        headers['Content-Type'] = 'application/json';
    }
    const resposta = await fetch(`${API_BASE_URL}${path}`, {
        ...init,
        headers: init?.headers ?? headers
    });
    if (!resposta.ok) {
        const detalhe = await resposta.text();
        throw new Error(detalhe || `Erro ${resposta.status}`);
    }
    if (resposta.status === 204) {
        return undefined;
    }
    const textoBruto = await resposta.text();
    if (!textoBruto.trim()) {
        return undefined;
    }
    try {
        return JSON.parse(textoBruto);
    }
    catch {
        return textoBruto;
    }
}
async function carregarDados() {
    const [clientesResp, produtosResp, pedidosResp] = await Promise.all([
        requisicao('/clientes'),
        requisicao('/produtos'),
        requisicao('/pedidos')
    ]);
    clientes = clientesResp;
    produtos = produtosResp;
    pedidos = pedidosResp;
}
function renderizarClientes() {
    if (!clientesTableBody)
        return;
    clientesTableBody.innerHTML = clientes
        .map(cliente => {
        const totalPedidos = pedidos.filter(p => p.cliente_id === cliente.id).length;
        return `
        <tr>
          <td>${cliente.id}</td>
          <td>${cliente.nome}</td>
          <td>${cliente.telefone ?? '-'}</td>
          <td>${cliente.endereco ?? '-'}</td>
          <td>${totalPedidos}</td>
          <td>
            <div class="actions">
              <button class="link-btn" data-action="editar" data-id="${cliente.id}">Editar</button>
              <button class="link-btn danger" data-action="remover" data-id="${cliente.id}">Excluir</button>
            </div>
          </td>
        </tr>
      `;
    })
        .join('');
}
function renderizarProdutos() {
    if (!produtosTableBody)
        return;
    produtosTableBody.innerHTML = produtos
        .map(produto => `
      <tr>
        <td>${produto.id}</td>
        <td>${produto.nome}</td>
        <td>${produto.categoria}</td>
        <td>${formatarMoeda(produto.preco)}</td>
        <td>${produto.ativo ? 'Ativo' : 'Inativo'}</td>
        <td>
          <div class="actions">
            <button class="link-btn" data-action="editar" data-id="${produto.id}">Editar</button>
            <button class="link-btn danger" data-action="remover" data-id="${produto.id}">Excluir</button>
          </div>
        </td>
      </tr>
    `)
        .join('');
}
function renderizarSelectsPedido() {
    if (pedidoCliente) {
        pedidoCliente.innerHTML = ['<option value="">Selecione...</option>', ...clientes.map(cliente => `<option value="${cliente.id}">${cliente.nome}</option>`)].join('');
    }
    if (pedidoProduto) {
        const ativos = produtos.filter(produto => produto.ativo);
        pedidoProduto.innerHTML = ['<option value="">Selecione...</option>', ...ativos.map(produto => `<option value="${produto.id}">${produto.nome}</option>`)].join('');
    }
    if (historicoSelect) {
        historicoSelect.innerHTML = ['<option value="">Selecione...</option>', ...clientes.map(cliente => `<option value="${cliente.id}">${cliente.nome}</option>`)].join('');
    }
}
function renderizarPedidoItens() {
    if (!pedidoItensBody)
        return;
    pedidoItensBody.innerHTML = pedidoItensEmEdicao
        .map((item, index) => {
        const produto = produtos.find(p => p.id === item.produto_id);
        const nomeProduto = produto?.nome ?? 'Produto removido';
        const categoria = produto?.categoria ?? '-';
        const subtotal = (produto?.preco ?? 0) * item.quantidade;
        return `
        <tr>
          <td>${nomeProduto}</td>
          <td>${categoria}</td>
          <td>${item.quantidade}</td>
          <td>${formatarMoeda(subtotal)}</td>
          <td><button class="link-btn danger" data-index="${index}">Remover</button></td>
        </tr>
      `;
    })
        .join('');
    const resumo = calcularResumoPedido();
    if (totalBrutoSpan)
        totalBrutoSpan.textContent = formatarMoeda(resumo.totalBruto);
    if (totalDescontoSpan)
        totalDescontoSpan.textContent = formatarMoeda(resumo.desconto);
    if (totalLiquidoSpan)
        totalLiquidoSpan.textContent = formatarMoeda(resumo.totalLiquido);
    if (totalObservacao)
        totalObservacao.textContent = resumo.observacao;
}
function renderizarPedidos() {
    if (!pedidosTableBody)
        return;
    pedidosTableBody.innerHTML = pedidos
        .map(pedido => {
        const cliente = clientes.find(c => c.id === pedido.cliente_id);
        const itens = pedido.itens ?? [];
        const quantidade = itens.reduce((total, item) => total + item.quantidade, 0);
        const detalhesItens = itens
            .map(item => {
            const produto = produtos.find(p => p.id === item.produto_id);
            return `${item.quantidade}x ${produto?.nome ?? 'Produto'}`;
        })
            .join(', ');
        return `
        <tr>
          <td>#${pedido.id}</td>
          <td>${formatarData(pedido.data_pedido)}</td>
          <td>${cliente?.nome ?? 'Cliente removido'}</td>
          <td>${quantidade} item(s)<br><small>${detalhesItens || 'Sem itens vinculados'}</small></td>
          <td>${formatarMoeda(pedido.total_liquido)}</td>
          <td>${pedido.forma_pagamento}</td>
          <td>${pedido.codigo_fiscal ?? '-'}</td>
          <td>
            <div class="actions">
              <button class="link-btn" data-action="pdf" data-id="${pedido.id}">Gerar NF</button>
              <button class="link-btn danger" data-action="remover" data-id="${pedido.id}">Excluir</button>
            </div>
          </td>
        </tr>
      `;
    })
        .join('');
}
function renderizarRelatorios() {
    if (!relatorioDiaBody || !relatorioMesBody)
        return;
    const pedidosComItens = pedidos.filter(p => (p.itens?.length ?? 0) > 0);
    const agrupadoDia = new Map();
    const agrupadoMes = new Map();
    pedidosComItens.forEach(pedido => {
        const data = new Date(pedido.data_pedido);
        const dia = data.toLocaleDateString('pt-BR');
        const mes = `${String(data.getMonth() + 1).padStart(2, '0')}/${data.getFullYear()}`;
        const quantidade = pedido.itens?.reduce((total, item) => total + item.quantidade, 0) ?? 0;
        agrupadoDia.set(dia, (agrupadoDia.get(dia) ?? 0) + quantidade);
        agrupadoMes.set(mes, (agrupadoMes.get(mes) ?? 0) + quantidade);
    });
    relatorioDiaBody.innerHTML = Array.from(agrupadoDia.entries())
        .sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime())
        .map(([dia, total]) => `<tr><td>${dia}</td><td>${total}</td></tr>`)
        .join('');
    relatorioMesBody.innerHTML = Array.from(agrupadoMes.entries())
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([mes, total]) => `<tr><td>${mes}</td><td>${total}</td></tr>`)
        .join('');
}
function renderizarHistorico() {
    if (!historicoSelect || !historicoLista)
        return;
    const selecionado = Number(historicoSelect.value);
    if (!selecionado) {
        historicoLista.innerHTML = '<p class="muted">Selecione um cliente para visualizar o histórico.</p>';
        return;
    }
    const pedidosCliente = pedidos
        .filter(p => p.cliente_id === selecionado)
        .sort((a, b) => new Date(b.data_pedido).getTime() - new Date(a.data_pedido).getTime());
    if (pedidosCliente.length === 0) {
        historicoLista.innerHTML = '<p class="muted">Este cliente ainda não possui pedidos.</p>';
        return;
    }
    historicoLista.innerHTML = pedidosCliente
        .map(pedido => {
        const itensDetalhes = (pedido.itens ?? [])
            .map(item => {
            const produto = produtos.find(p => p.id === item.produto_id);
            return `<li>${item.quantidade}x ${produto?.nome ?? 'Produto'} (${formatarMoeda((produto?.preco ?? 0) * item.quantidade)})</li>`;
        })
            .join('');
        return `
        <article class="timeline__item">
          <header>
            <h3>Pedido #${pedido.id}</h3>
            <span>${formatarData(pedido.data_pedido)}</span>
          </header>
          <ul>${itensDetalhes || '<li>Sem itens vinculados</li>'}</ul>
          <footer>
            <strong>Total:</strong> ${formatarMoeda(pedido.total_liquido)} · ${pedido.forma_pagamento}
          </footer>
        </article>
      `;
    })
        .join('');
}
function calcularResumoPedido() {
    const totais = pedidoItensEmEdicao.reduce((acc, item) => {
        const produto = produtos.find(p => p.id === item.produto_id);
        const preco = produto?.preco ?? 0;
        return {
            quantidadeTotal: acc.quantidadeTotal + item.quantidade,
            totalBruto: acc.totalBruto + preco * item.quantidade
        };
    }, { quantidadeTotal: 0, totalBruto: 0 });
    const desconto = totais.totalBruto >= 200 ? totais.totalBruto * 0.1 : 0;
    const observacao = desconto > 0 ? 'Desconto automático de 10% aplicado em pedidos acima de R$ 200,00.' : '';
    return {
        quantidadeTotal: totais.quantidadeTotal,
        totalBruto: totais.totalBruto,
        desconto,
        totalLiquido: totais.totalBruto - desconto,
        observacao
    };
}
function formatarMoeda(valor) {
    return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}
function formatarData(iso) {
    const data = new Date(iso);
    return `${data.toLocaleDateString('pt-BR')} ${data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
}
function resetarFormularioCliente() {
    if (!clienteForm || !clienteCancel || !clienteTitle)
        return;
    clienteForm.reset();
    delete clienteForm.dataset.editId;
    clienteCancel.classList.add('hidden');
    clienteTitle.textContent = 'Novo cliente';
}
function resetarFormularioProduto() {
    if (!produtoForm || !produtoCancel || !produtoTitle)
        return;
    produtoForm.reset();
    delete produtoForm.dataset.editId;
    produtoCancel.classList.add('hidden');
    produtoTitle.textContent = 'Novo produto';
}
function limparItensPedido() {
    pedidoItensEmEdicao = [];
    if (pedidoQuantidade)
        pedidoQuantidade.value = '1';
    renderizarPedidoItens();
}
function emitirComprovanteFiscal(id) {
    const JsPDF = obterJsPDF();
    if (!JsPDF) {
        mostrarFeedback('Biblioteca de geração de PDF não carregada.', 'error');
        return;
    }
    const pedido = pedidos.find(p => p.id === id);
    if (!pedido) {
        mostrarFeedback('Pedido não encontrado para gerar NF.', 'error');
        return;
    }
    const cliente = clientes.find(c => c.id === pedido.cliente_id);
    const doc = new JsPDF();
    const pageSize = doc.internal?.pageSize;
    const larguraPagina = typeof pageSize?.getWidth === 'function' ? pageSize.getWidth() : 210;
    const alturaPagina = typeof pageSize?.getHeight === 'function' ? pageSize.getHeight() : 297;
    const margem = 22;
    const larguraUtil = larguraPagina - margem * 2;
    const cores = {
        cabecalho: { r: 59, g: 29, b: 13 },
        textoCabecalho: { r: 255, g: 235, b: 211 },
        destaque: { r: 245, g: 199, b: 127 },
        textoBase: { r: 44, g: 21, b: 11 },
        acento: { r: 242, g: 92, b: 41 },
        linha: { r: 220, g: 170, b: 120 },
        muted: { r: 150, g: 120, b: 100 }
    };
    const toRGB = (cor) => [cor.r, cor.g, cor.b];
    let y = margem;
    const dividirTexto = (texto, largura) => {
        if (!texto?.trim?.())
            return [];
        if (doc.splitTextToSize)
            return doc.splitTextToSize(texto, largura);
        return [texto];
    };
    const garantirEspaco = (altura) => {
        if (y + altura > alturaPagina - margem) {
            doc.addPage();
            y = margem;
            doc.setTextColor(...toRGB(cores.textoBase));
            doc.setFont('helvetica', 'normal');
        }
    };
    doc.setFillColor(...toRGB(cores.cabecalho));
    doc.rect(0, 0, larguraPagina, 60, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...toRGB(cores.textoCabecalho));
    doc.setFontSize(20);
    doc.text('Pizzaria Sabor & Arte', larguraPagina / 2, 28, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.text('Comprovante Fiscal Digital (Modelo de Teste)', larguraPagina / 2, 40, { align: 'center' });
    doc.text(`Código Fiscal: ${pedido.codigo_fiscal ?? 'Gerado automaticamente'}`, larguraPagina / 2, 51, { align: 'center' });
    y = 78;
    doc.setTextColor(...toRGB(cores.textoBase));
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('Dados do Pedido', margem, y);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(formatarData(pedido.data_pedido), larguraPagina - margem, y, { align: 'right' });
    y += 8;
    const dadosPedido = [
        `Pedido nº ${pedido.id}`,
        `Cliente: ${cliente?.nome ?? 'Cliente removido'}`,
        `Contato: ${cliente?.telefone ?? 'Não informado'}`
    ];
    if (cliente?.endereco) {
        dadosPedido.push(...dividirTexto(`Endereço: ${cliente.endereco}`, larguraUtil));
    }
    dadosPedido.forEach(linha => {
        garantirEspaco(6);
        doc.text(linha, margem, y);
        y += 6;
    });
    y += 6;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('Itens do Pedido', margem, y);
    y += 8;
    const tabelaLargura = larguraUtil;
    const colunaDescricao = margem + 6;
    const colunaQuantidade = margem + tabelaLargura * 0.72;
    const colunaTotal = margem + tabelaLargura * 0.95;
    garantirEspaco(14);
    doc.setFillColor(...toRGB(cores.destaque));
    doc.setDrawColor(...toRGB(cores.destaque));
    doc.roundedRect(margem, y, tabelaLargura, 12, 3, 3, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(...toRGB(cores.textoBase));
    doc.text('Descrição', colunaDescricao, y + 8);
    doc.text('Qtd.', colunaQuantidade, y + 8, { align: 'center' });
    doc.text('Total (R$)', colunaTotal, y + 8, { align: 'right' });
    y += 18;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(...toRGB(cores.textoBase));
    const itens = pedido.itens ?? [];
    if (itens.length === 0) {
        garantirEspaco(10);
        doc.text('Nenhum item vinculado.', colunaDescricao, y);
        y += 10;
    }
    else {
        itens.forEach(item => {
            const produto = produtos.find(p => p.id === item.produto_id);
            const descricao = produto?.nome ?? 'Produto removido';
            const linhasDescricao = dividirTexto(descricao, colunaQuantidade - colunaDescricao - 8);
            const subtotal = (item.preco_unitario ?? produto?.preco ?? 0) * item.quantidade;
            const alturaLinha = linhasDescricao.length * 6;
            garantirEspaco(alturaLinha + 4);
            linhasDescricao.forEach((linhaTexto, indice) => {
                doc.text(linhaTexto, colunaDescricao, y + indice * 6);
                if (indice === 0) {
                    doc.text(String(item.quantidade), colunaQuantidade, y, { align: 'center' });
                    doc.text(formatarMoeda(subtotal), colunaTotal, y, { align: 'right' });
                }
            });
            y += alturaLinha + 2;
            doc.setDrawColor(...toRGB(cores.linha));
            doc.line(margem, y, margem + tabelaLargura, y);
            y += 4;
        });
    }
    y += 4;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('Resumo Financeiro', margem, y);
    y += 8;
    const formaPagamento = pedido.forma_pagamento === 'Cartao' ? 'Cartão' : pedido.forma_pagamento;
    const linhasResumo = [
        { label: 'Forma de pagamento:', valor: formaPagamento, destaque: false },
        { label: 'Total bruto:', valor: formatarMoeda(pedido.total_bruto), destaque: false },
        { label: 'Descontos aplicados:', valor: formatarMoeda(pedido.desconto), destaque: false },
        { label: 'Total a pagar:', valor: formatarMoeda(pedido.total_liquido), destaque: true }
    ];
    linhasResumo.forEach(linha => {
        garantirEspaco(6);
        doc.setFont('helvetica', linha.destaque ? 'bold' : 'normal');
        doc.setTextColor(...toRGB(linha.destaque ? cores.acento : cores.textoBase));
        doc.text(linha.label, margem, y);
        doc.text(linha.valor, margem + tabelaLargura, y, { align: 'right' });
        y += 6;
    });
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...toRGB(cores.textoBase));
    const observacaoPedido = (pedido.observacao ?? '').trim();
    if (observacaoPedido) {
        const observacoes = dividirTexto(`Observações: ${observacaoPedido}`, larguraUtil);
        observacoes.forEach(linha => {
            garantirEspaco(6);
            doc.text(linha, margem, y);
            y += 6;
        });
    }
    garantirEspaco(14);
    doc.setDrawColor(...toRGB(cores.linha));
    doc.line(margem, y + 4, margem + tabelaLargura, y + 4);
    y += 12;
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(9);
    doc.setTextColor(...toRGB(cores.muted));
    doc.text('Documento gerado automaticamente para fins acadêmicos. Não possui validade fiscal.', larguraPagina / 2, y, { align: 'center' });
    y += 8;
    doc.setFont('helvetica', 'normal');
    doc.text('Pizzaria Sabor & Arte · Rua das Delícias, 123 · São Paulo/SP', larguraPagina / 2, y, { align: 'center' });
    doc.save(`pedido-${pedido.id}.pdf`);
    mostrarFeedback('Comprovante gerado.');
}
async function inicializar() {
    try {
        await carregarDados();
        renderizarClientes();
        renderizarProdutos();
        renderizarSelectsPedido();
        renderizarPedidos();
        renderizarRelatorios();
        renderizarHistorico();
    }
    catch (erro) {
        console.error(erro);
        mostrarFeedback('Não foi possível carregar dados do servidor.', 'error');
    }
}
navButtons.forEach(botao => {
    botao.addEventListener('click', () => {
        if (!botao.dataset.section)
            return;
        trocarSecao(botao.dataset.section);
    });
});
clientesTableBody?.addEventListener('click', async (evento) => {
    const botao = evento.target.closest('button[data-action]');
    if (!botao)
        return;
    const id = Number(botao.dataset.id);
    if (!id)
        return;
    if (botao.dataset.action === 'editar' && clienteForm) {
        const cliente = clientes.find(c => c.id === id);
        if (!cliente)
            return;
        (clienteForm.querySelector('#cliente-nome') ?? { value: '' }).value = cliente.nome;
        (clienteForm.querySelector('#cliente-telefone') ?? { value: '' }).value = cliente.telefone ?? '';
        (clienteForm.querySelector('#cliente-endereco') ?? { value: '' }).value = cliente.endereco ?? '';
        clienteForm.dataset.editId = String(cliente.id);
        clienteCancel?.classList.remove('hidden');
        if (clienteTitle)
            clienteTitle.textContent = 'Editar cliente';
    }
    if (botao.dataset.action === 'remover') {
        if (!confirm('Deseja realmente excluir este cliente?'))
            return;
        try {
            await requisicao(`/clientes/${id}`, { method: 'DELETE' });
            await inicializar();
            mostrarFeedback('Cliente excluído com sucesso.');
        }
        catch (erro) {
            console.error(erro);
            mostrarFeedback('Não foi possível excluir o cliente.', 'error');
        }
    }
});
produtosTableBody?.addEventListener('click', async (evento) => {
    const botao = evento.target.closest('button[data-action]');
    if (!botao)
        return;
    const id = Number(botao.dataset.id);
    if (!id)
        return;
    if (botao.dataset.action === 'editar' && produtoForm) {
        const produto = produtos.find(p => p.id === id);
        if (!produto)
            return;
        (produtoForm.querySelector('#produto-nome') ?? { value: '' }).value = produto.nome;
        (produtoForm.querySelector('#produto-categoria') ?? { value: '' }).value = produto.categoria;
        (produtoForm.querySelector('#produto-preco') ?? { value: '' }).value = String(produto.preco);
        const ativoCheckbox = produtoForm.querySelector('#produto-ativo');
        if (ativoCheckbox)
            ativoCheckbox.checked = produto.ativo;
        produtoForm.dataset.editId = String(produto.id);
        produtoCancel?.classList.remove('hidden');
        if (produtoTitle)
            produtoTitle.textContent = 'Editar produto';
    }
    if (botao.dataset.action === 'remover') {
        if (!confirm('Excluir definitivamente o produto?'))
            return;
        try {
            await requisicao(`/produtos/${id}`, { method: 'DELETE' });
            await inicializar();
            mostrarFeedback('Produto removido.');
        }
        catch (erro) {
            console.error(erro);
            mostrarFeedback('Não foi possível remover o produto.', 'error');
        }
    }
});
pedidosTableBody?.addEventListener('click', async (evento) => {
    const botao = evento.target.closest('button[data-action]');
    if (!botao)
        return;
    const id = Number(botao.dataset.id);
    if (!id)
        return;
    if (botao.dataset.action === 'pdf') {
        emitirComprovanteFiscal(id);
        return;
    }
    if (botao.dataset.action === 'remover') {
        if (!confirm('Confirmar exclusão do pedido?'))
            return;
        try {
            await requisicao(`/pedidos/${id}`, { method: 'DELETE' });
            await inicializar();
            mostrarFeedback('Pedido excluído.');
        }
        catch (erro) {
            console.error(erro);
            mostrarFeedback('Não foi possível excluir o pedido.', 'error');
        }
    }
});
pedidoItensBody?.addEventListener('click', evento => {
    const botao = evento.target.closest('button[data-index]');
    if (!botao?.dataset.index)
        return;
    const indice = Number(botao.dataset.index);
    pedidoItensEmEdicao.splice(indice, 1);
    renderizarPedidoItens();
});
clienteForm?.addEventListener('submit', async (evento) => {
    evento.preventDefault();
    const formData = new FormData(clienteForm);
    const payload = {
        nome: String(formData.get('nome') ?? '').trim(),
        telefone: String(formData.get('telefone') ?? '').trim() || null,
        endereco: String(formData.get('endereco') ?? '').trim() || null
    };
    if (!payload.nome) {
        mostrarFeedback('Informe o nome do cliente.', 'error');
        return;
    }
    const editId = clienteForm.dataset.editId;
    try {
        if (editId) {
            await requisicao(`/clientes/${editId}`, {
                method: 'PUT',
                body: JSON.stringify(payload)
            });
            mostrarFeedback('Cliente atualizado com sucesso.');
        }
        else {
            await requisicao('/clientes', {
                method: 'POST',
                body: JSON.stringify(payload)
            });
            mostrarFeedback('Cliente cadastrado.');
        }
        resetarFormularioCliente();
        await inicializar();
    }
    catch (erro) {
        console.error(erro);
        mostrarFeedback('Falha ao salvar cliente.', 'error');
    }
});
clienteCancel?.addEventListener('click', () => {
    resetarFormularioCliente();
});
produtoForm?.addEventListener('submit', async (evento) => {
    evento.preventDefault();
    const formData = new FormData(produtoForm);
    const payload = {
        nome: String(formData.get('nome') ?? '').trim(),
        categoria: formData.get('categoria') ?? 'Outro',
        preco: Number(formData.get('preco') ?? 0),
        ativo: formData.get('ativo') === 'on'
    };
    if (!payload.nome || !payload.categoria || Number.isNaN(payload.preco)) {
        mostrarFeedback('Informe nome, categoria e preço do produto.', 'error');
        return;
    }
    const editId = produtoForm.dataset.editId;
    try {
        if (editId) {
            await requisicao(`/produtos/${editId}`, {
                method: 'PUT',
                body: JSON.stringify(payload)
            });
            mostrarFeedback('Produto atualizado.');
        }
        else {
            await requisicao('/produtos', {
                method: 'POST',
                body: JSON.stringify(payload)
            });
            mostrarFeedback('Produto cadastrado.');
        }
        resetarFormularioProduto();
        await inicializar();
    }
    catch (erro) {
        console.error(erro);
        mostrarFeedback('Falha ao salvar produto.', 'error');
    }
});
produtoCancel?.addEventListener('click', () => {
    resetarFormularioProduto();
});
pedidoAddItem?.addEventListener('click', () => {
    if (!pedidoProduto || !pedidoQuantidade)
        return;
    const produtoId = Number(pedidoProduto.value);
    const quantidade = Number(pedidoQuantidade.value);
    if (!produtoId || quantidade <= 0) {
        mostrarFeedback('Escolha um produto ativo e informe a quantidade.', 'error');
        return;
    }
    const existente = pedidoItensEmEdicao.find(item => item.produto_id === produtoId);
    if (existente) {
        existente.quantidade += quantidade;
    }
    else {
        pedidoItensEmEdicao.push({ produto_id: produtoId, quantidade });
    }
    pedidoQuantidade.value = '1';
    renderizarPedidoItens();
});
pedidoForm?.addEventListener('submit', async (evento) => {
    evento.preventDefault();
    if (pedidoItensEmEdicao.length === 0) {
        mostrarFeedback('Adicione pelo menos um item ao pedido.', 'error');
        return;
    }
    if (!pedidoCliente || !pedidoForma)
        return;
    const clienteId = Number(pedidoCliente.value);
    if (!clienteId) {
        mostrarFeedback('Selecione um cliente.', 'error');
        return;
    }
    const formaPagamento = pedidoForma.value || 'Dinheiro';
    const resumo = calcularResumoPedido();
    const itens = pedidoItensEmEdicao.map(item => {
        const produto = produtos.find(p => p.id === item.produto_id);
        return {
            produto_id: item.produto_id,
            quantidade: item.quantidade,
            preco_unitario: produto?.preco ?? 0
        };
    });
    const payload = {
        cliente_id: clienteId,
        forma_pagamento: formaPagamento,
        total_bruto: Number(resumo.totalBruto.toFixed(2)),
        desconto: Number(resumo.desconto.toFixed(2)),
        total_liquido: Number(resumo.totalLiquido.toFixed(2)),
        observacao: resumo.observacao || null,
        itens
    };
    try {
        await requisicao('/pedidos', {
            method: 'POST',
            body: JSON.stringify(payload)
        });
        pedidoForm.reset();
        limparItensPedido();
        await inicializar();
        mostrarFeedback('Pedido registrado com sucesso.');
    }
    catch (erro) {
        console.error(erro);
        mostrarFeedback('Não foi possível registrar o pedido.', 'error');
    }
});
pedidoReset?.addEventListener('click', () => {
    limparItensPedido();
});
historicoSelect?.addEventListener('change', () => {
    renderizarHistorico();
});
resetDadosBtn?.addEventListener('click', () => {
    mostrarFeedback('A base de dados é reinicializada via scripts SQL no servidor.', 'error');
});
limparDadosBtn?.addEventListener('click', () => {
    mostrarFeedback('Para limpar tudo utilize os comandos do backend.', 'error');
});
void inicializar();
export {};
