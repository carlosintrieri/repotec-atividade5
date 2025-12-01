// backend/server.js - Servidor Node.js com Express (ES Modules)

import express from 'express';
import cors from 'cors';
import AtlantisDB from './atlantisDB.js';

const app = express();
const PORT = 3001;

// === MIDDLEWARES ===
app.use(cors({
    origin: (origin, callback) => {
        // Permite qualquer porta localhost (8080, 8081, etc.)
        if (!origin || origin.startsWith("http://localhost")) {
            callback(null, true);
        } else {
            callback(new Error("CORS bloqueado: origem não permitida"));
        }
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true
}));

app.use(express.json());

// === INICIALIZAR BANCO ===
AtlantisDB.inicializar()
    .then(() => console.log('✅ Sistema Atlantis Water Park inicializado com sucesso!'))
    .catch(error => console.error('❌ Erro ao inicializar sistema:', error));


// ============================
// === ROTAS DE CLIENTES ====
// ============================

// GET /api/clientes - Listar todos os clientes
app.get('/api/clientes', async (req, res) => {
    try {
        const clientes = await AtlantisDB.carregarClientes();
        res.json({ success: true, clientes });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// POST /api/clientes - Criar novo cliente
app.post('/api/clientes', async (req, res) => {
    try {
        const clienteId = await AtlantisDB.salvarCliente(req.body);
        res.json({
            success: true,
            clienteId,
            message: 'Cliente salvo com sucesso!'
        });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
});

// DELETE /api/clientes/:id - Remover cliente
app.delete('/api/clientes/:id', async (req, res) => {
    try {
        await AtlantisDB.removerCliente(parseInt(req.params.id));
        res.json({ success: true, message: 'Cliente removido!' });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
});


// ============================
// === ROTAS DE ACOMODAÇÕES ===
// ============================

// GET /api/acomodacoes - Listar acomodações
app.get('/api/acomodacoes', async (req, res) => {
    try {
        const acomodacoes = await AtlantisDB.carregarAcomodacoes();
        res.json({ success: true, acomodacoes });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// PUT /api/acomodacoes/:id - Atualizar disponibilidade
app.put('/api/acomodacoes/:id', async (req, res) => {
    try {
        const { disponivel } = req.body;
        await AtlantisDB.atualizarDisponibilidadeAcomodacao(parseInt(req.params.id), disponivel);
        res.json({ success: true, message: 'Disponibilidade atualizada!' });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
});

// GET /api/acomodacoes/clientes - Consultar todos os clientes por acomodação
app.get('/api/acomodacoes/clientes', async (req, res) => {
    try {
        const resultado = await AtlantisDB.consultarClientesPorAcomodacao();
        res.json({
            success: true,
            data: resultado,
            total: resultado.length,
            timestamp: new Date()
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// GET /api/acomodacoes/:id/clientes - Consultar clientes de uma acomodação específica
app.get('/api/acomodacoes/:id/clientes', async (req, res) => {
    try {
        const acomodacaoId = parseInt(req.params.id);
        const resultado = await AtlantisDB.consultarAcomodacaoEspecifica(acomodacaoId);
        res.json({ success: true, data: resultado, timestamp: new Date() });
    } catch (error) {
        res.status(404).json({ success: false, error: error.message });
    }
});


// ===============================
// === RELATÓRIOS DE OCUPAÇÃO ===
// ===============================

// GET /api/relatorios/ocupacao - Relatório geral
app.get('/api/relatorios/ocupacao', async (req, res) => {
    try {
        const dados = await AtlantisDB.consultarClientesPorAcomodacao();

        const estatisticas = {
            totalAcomodacoes: dados.length,
            acomodacoesOcupadas: dados.filter(d => d.ocupacao.ocupada).length,
            acomodacoesLivres: dados.filter(d => !d.ocupacao.ocupada).length,
            totalClientesAtivos: dados.reduce((t, d) => t + d.ocupacao.quantidadeAtual, 0),
            totalHistoricoHospedagens: dados.reduce((t, d) => t + d.ocupacao.totalHistorico, 0),
            taxaOcupacao: dados.length > 0
                ? Math.round((dados.filter(d => d.ocupacao.ocupada).length / dados.length) * 100)
                : 0
        };

        const rankingAcomodacoes = dados
            .sort((a, b) => b.ocupacao.totalGeral - a.ocupacao.totalGeral)
            .slice(0, 5)
            .map(d => ({
                nome: d.acomodacao.nome,
                tipo: d.acomodacao.tipo,
                totalHospedagens: d.ocupacao.totalGeral,
                status: d.ocupacao.ocupada ? 'OCUPADA' : 'LIVRE'
            }));

        res.json({
            success: true,
            estatisticas,
            rankingAcomodacoes,
            detalhes: dados,
            timestamp: new Date()
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});


// ============================
// === ROTAS DE HOSPEDAGENS ===
// ============================

// GET /api/hospedagens - Listar hospedagens
app.get('/api/hospedagens', async (req, res) => {
    try {
        const hospedagens = await AtlantisDB.carregarHospedagens();
        res.json({ success: true, hospedagens });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// POST /api/hospedagens - Criar nova hospedagem
app.post('/api/hospedagens', async (req, res) => {
    try {
        const hospedagemId = await AtlantisDB.salvarHospedagem(req.body);
        res.json({ success: true, hospedagemId, message: 'Check-in realizado!' });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
});

// PUT /api/hospedagens/:id/checkout - Realizar checkout
app.put('/api/hospedagens/:id/checkout', async (req, res) => {
    try {
        await AtlantisDB.atualizarHospedagem(parseInt(req.params.id), {
            data_check_out: new Date(),
            ativa: false
        });
        res.json({ success: true, message: 'Check-out realizado!' });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
});


// ============================
// === ROTA DE TESTE ===
// ============================

app.get('/api/test', (req, res) => {
    res.json({
        success: true,
        message: 'API Atlantis Water Park funcionando!',
        timestamp: new Date()
    });
});

// ============================
// === TRATAMENTO DE ERROS ===
// ============================

app.use((error, req, res, next) => {
    res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
    });
});

// ============================
// === INICIAR SERVIDOR =======
// ============================

app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando na porta ${PORT}`);
    console.log(`📍 API disponível em: http://localhost:${PORT}/api`);
});
