// backend/atlantisDB.js - CORREÇÃO APENAS DOS CAMPOS DO BANCO

import { sequelize, Cliente, Documento, Endereco, Telefone, Acomodacao, Hospedagem } from './database.js';

class AtlantisDB {

    // Inicializar banco
    static async inicializar() {
        try {
            await sequelize.authenticate();
            console.log('Conectado ao MySQL com Sequelize!');

            await sequelize.sync({ alter: true });
            console.log('Tabelas sincronizadas!');

            // Criar acomodações iniciais se não existirem
            const count = await Acomodacao.count();
            if (count === 0) {
                await this.criarAcomodacoesIniciais();
                console.log('Acomodações iniciais criadas!');
            }
        } catch (error) {
            console.error('Erro ao inicializar MySQL:', error);
            throw error;
        }
    }

    // Criar acomodações iniciais
    static async criarAcomodacoesIniciais() {
        const acomodacoes = [
            {
                tipo: 'solteiro-simples',
                nome_acomodacao: 'Solteiro Simples',
                cama_solteiro: 1,
                cama_casal: 0,
                suite: 1,
                climatizacao: true,
                garagem: 0,
                disponivel: true,
                imagem_url: 'https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=800&auto=format&fit=crop&q=60'
            },
            {
                tipo: 'casal-simples',
                nome_acomodacao: 'Casal Simples',
                cama_solteiro: 0,
                cama_casal: 1,
                suite: 1,
                climatizacao: true,
                garagem: 1,
                disponivel: true,
                imagem_url: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800&auto=format&fit=crop&q=60'
            },
            {
                tipo: 'familia-simples',
                nome_acomodacao: 'Família Simples',
                cama_solteiro: 2,
                cama_casal: 1,
                suite: 1,
                climatizacao: true,
                garagem: 1,
                disponivel: true,
                imagem_url: 'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=800&auto=format&fit=crop&q=60'
            },
            {
                tipo: 'familia-mais',
                nome_acomodacao: 'Família Mais',
                cama_solteiro: 5,
                cama_casal: 1,
                suite: 2,
                climatizacao: true,
                garagem: 2,
                disponivel: true,
                imagem_url: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&auto=format&fit=crop&q=60'
            },
            {
                tipo: 'familia-super',
                nome_acomodacao: 'Família Super',
                cama_solteiro: 6,
                cama_casal: 2,
                suite: 3,
                climatizacao: true,
                garagem: 2,
                disponivel: true,
                imagem_url: 'https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=800&auto=format&fit=crop&q=60'
            },
            {
                tipo: 'solteiro-mais',
                nome_acomodacao: 'Solteiro Mais',
                cama_solteiro: 0,
                cama_casal: 1,
                suite: 1,
                climatizacao: true,
                garagem: 1,
                disponivel: true,
                imagem_url: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800&auto=format&fit=crop&q=60'
            }
        ];

        await Acomodacao.bulkCreate(acomodacoes);
    }

    // === CLIENTES ===

    static async salvarCliente(dadosCliente) {
        const transaction = await sequelize.transaction();
        try {
            const { nome, apelido, dataNascimento, telefones, endereco, documentos, titular } = dadosCliente;

            console.log('Recebendo dados:', dadosCliente); // Log para debug

            const cliente = await Cliente.create({
                nome,
                apelido,
                data_nascimento: dataNascimento,
                titular_id: titular?.id || null
            }, { transaction });

            // ========== CORREÇÃO: DETERMINAR NOMES PARA OS CAMPOS EXTRAS ==========
            let clienteNome = nome;
            let titularId = null;
            let titularNome = null;
            let dependenteNome = null;

            if (titular?.id) {
                // Este é um dependente - buscar nome do titular do banco
                const titularCompleto = await Cliente.findByPk(titular.id, { transaction });
                if (!titularCompleto) {
                    throw new Error('Titular não encontrado');
                }

                titularId = titular.id;
                titularNome = titularCompleto.nome; // ✅ PEGA DO BANCO
                dependenteNome = nome;
                console.log(`>>> DEPENDENTE: ${nome} do titular ${titularCompleto.nome}`);
            } else {
                // Este é um titular
                titularId = null;
                titularNome = nome; // O titular é ele mesmo
                dependenteNome = null;
                console.log(`>>> TITULAR: ${nome}`);
            }

            // Salvar documentos COM OS CAMPOS EXTRAS ✅
            if (documentos?.length) {
                await Documento.bulkCreate(
                    documentos.map(doc => ({
                        numero: doc.numero,
                        tipo: doc.tipo,
                        data_expedicao: doc.dataExpedicao || doc.data_expedicao,
                        cliente_id: cliente.id,
                        // ✅ CAMPOS EXTRAS PREENCHIDOS:
                        cliente_nome: clienteNome,
                        titular_id: titularId,
                        titular_nome: titularNome,
                        dependente_nome: dependenteNome
                    })),
                    { transaction }
                );
                console.log(`✅ ${documentos.length} documento(s) salvos com nomes`);
            }

            // Salvar telefones COM OS CAMPOS EXTRAS ✅
            if (telefones?.length) {
                await Telefone.bulkCreate(
                    telefones.map(tel => ({
                        ddd: tel.ddd,
                        numero: tel.numero,
                        cliente_id: cliente.id,
                        // ✅ CAMPOS EXTRAS PREENCHIDOS:
                        cliente_nome: clienteNome,
                        titular_id: titularId,
                        titular_nome: titularNome,
                        dependente_nome: dependenteNome
                    })),
                    { transaction }
                );
                console.log(`✅ ${telefones.length} telefone(s) salvos com nomes`);
            }

            // Salvar endereço COM OS CAMPOS EXTRAS ✅
            if (endereco?.rua) {
                await Endereco.create({
                    rua: endereco.rua,
                    bairro: endereco.bairro,
                    cidade: endereco.cidade,
                    estado: endereco.estado,
                    pais: endereco.pais,
                    codigo_postal: endereco.codigoPostal || endereco.codigo_postal,
                    cliente_id: cliente.id,
                    // ✅ CAMPOS EXTRAS PREENCHIDOS:
                    cliente_nome: clienteNome,
                    titular_id: titularId,
                    titular_nome: titularNome,
                    dependente_nome: dependenteNome
                }, { transaction });
                console.log('✅ Endereço salvo com nomes');
            }

            await transaction.commit();
            console.log(`✅ Cliente ${nome} salvo com sucesso!`);
            return cliente.id;
        } catch (error) {
            await transaction.rollback();
            console.error('Erro no banco:', error); // Log para debug
            throw error;
        }
    }

    static async carregarClientes() {
        const clientes = await Cliente.findAll({
            include: [
                { model: Documento, as: 'documentos' },
                { model: Endereco, as: 'endereco' },
                { model: Telefone, as: 'telefones' },
                { model: Cliente, as: 'dependentes' }
            ]
        });

        // Processar dados em paralelo
        const clientesProcessados = await Promise.all(
            clientes.map(async (c) => {
                const titular = c.titular_id ? await Cliente.findByPk(c.titular_id) : null;

                return {
                    id: c.id,
                    nome: c.nome,
                    apelido: c.apelido,
                    dataNascimento: c.data_nascimento,
                    dataCadastro: c.data_cadastro,
                    telefones: c.telefones?.map(t => ({
                        ddd: t.ddd,
                        numero: t.numero
                    })) || [],
                    endereco: c.endereco ? {
                        rua: c.endereco.rua,
                        bairro: c.endereco.bairro,
                        cidade: c.endereco.cidade,
                        estado: c.endereco.estado,
                        pais: c.endereco.pais,
                        codigoPostal: c.endereco.codigo_postal
                    } : undefined,
                    documentos: c.documentos?.map(d => ({
                        id: d.id,
                        numero: d.numero,
                        tipo: d.tipo,
                        dataExpedicao: d.data_expedicao
                    })) || [],
                    dependentes: c.dependentes?.map(dep => ({
                        id: dep.id,
                        nome: dep.nome,
                        apelido: dep.apelido,
                        dataNascimento: dep.data_nascimento,
                        dataCadastro: dep.data_cadastro
                    })) || [],
                    titular: titular ? { id: titular.id, nome: titular.nome } : undefined
                };
            })
        );

        return clientesProcessados;
    }

    static async removerCliente(clienteId) {
        await Cliente.destroy({ where: { id: clienteId } });
    }

    // === ACOMODAÇÕES ===

    static async carregarAcomodacoes() {
        const acomodacoes = await Acomodacao.findAll();

        return acomodacoes.map(a => ({
            id: a.id,
            tipo: a.tipo,
            nomeAcomodacao: a.nome_acomodacao,
            camaSolteiro: a.cama_solteiro,
            camaCasal: a.cama_casal,
            suite: a.suite,
            climatizacao: a.climatizacao,
            garagem: a.garagem,
            disponivel: a.disponivel,
            imagem: a.imagem_url
        }));
    }

    static async atualizarDisponibilidadeAcomodacao(acomodacaoId, disponivel) {
        await Acomodacao.update(
            { disponivel },
            { where: { id: acomodacaoId } }
        );
    }

    // === CONSULTAS DE ACOMODAÇÕES ===

    static async consultarClientesPorAcomodacao() {
        try {
            console.log('🔍 Consultando clientes por acomodação...');

            // Buscar todas as acomodações com suas hospedagens
            const acomodacoes = await Acomodacao.findAll({
                include: [
                    {
                        model: Hospedagem,
                        as: 'hospedagens',
                        include: [
                            {
                                model: Cliente,
                                as: 'cliente',
                                include: [
                                    { model: Documento, as: 'documentos' },
                                    { model: Telefone, as: 'telefones' }
                                ]
                            }
                        ]
                    }
                ]
            });

            const resultado = acomodacoes.map(acomodacao => {
                // Separar hospedagens ativas e históricas
                const hospedagensAtivas = acomodacao.hospedagens.filter(h => h.ativa);
                const historicoHospedagens = acomodacao.hospedagens.filter(h => !h.ativa);

                // Processar clientes atuais (hospedagens ativas)
                const clientesAtuais = hospedagensAtivas.map(h => ({
                    id: h.cliente.id,
                    nome: h.cliente.nome,
                    apelido: h.cliente.apelido,
                    tipo: h.cliente.titular_id ? 'dependente' : 'titular',
                    dataCheckIn: h.data_check_in,
                    numeroQuarto: h.numero_quarto,
                    telefones: h.cliente.telefones?.map(t => `(${t.ddd}) ${t.numero}`).join(', ') || '',
                    documentos: h.cliente.documentos?.map(d => `${d.tipo}: ${d.numero}`).join(', ') || '',
                    diasHospedado: Math.ceil((new Date() - new Date(h.data_check_in)) / (1000 * 60 * 60 * 24))
                }));

                // Processar histórico de clientes
                const historicoClientes = historicoHospedagens.map(h => ({
                    id: h.cliente.id,
                    nome: h.cliente.nome,
                    apelido: h.cliente.apelido,
                    tipo: h.cliente.titular_id ? 'dependente' : 'titular',
                    dataCheckIn: h.data_check_in,
                    dataCheckOut: h.data_check_out,
                    numeroQuarto: h.numero_quarto,
                    telefones: h.cliente.telefones?.map(t => `(${t.ddd}) ${t.numero}`).join(', ') || '',
                    documentos: h.cliente.documentos?.map(d => `${d.tipo}: ${d.numero}`).join(', ') || '',
                    diasHospedado: h.data_check_out ?
                        Math.ceil((new Date(h.data_check_out) - new Date(h.data_check_in)) / (1000 * 60 * 60 * 24)) :
                        0
                }));

                return {
                    acomodacao: {
                        id: acomodacao.id,
                        tipo: acomodacao.tipo,
                        nome: acomodacao.nome_acomodacao,
                        camaSolteiro: acomodacao.cama_solteiro,
                        camaCasal: acomodacao.cama_casal,
                        suite: acomodacao.suite,
                        climatizacao: acomodacao.climatizacao,
                        garagem: acomodacao.garagem,
                        disponivel: acomodacao.disponivel,
                        imagem: acomodacao.imagem_url
                    },
                    ocupacao: {
                        ocupada: clientesAtuais.length > 0,
                        quantidadeAtual: clientesAtuais.length,
                        totalHistorico: historicoClientes.length,
                        totalGeral: hospedagensAtivas.length + historicoHospedagens.length
                    },
                    clientesAtuais,
                    historicoClientes
                };
            });

            console.log(`✅ Consulta concluída: ${resultado.length} acomodações analisadas`);
            return resultado;

        } catch (error) {
            console.error('❌ Erro ao consultar clientes por acomodação:', error);
            throw error;
        }
    }

    static async consultarAcomodacaoEspecifica(acomodacaoId) {
        try {
            console.log(`🔍 Consultando acomodação específica ID: ${acomodacaoId}`);

            const acomodacao = await Acomodacao.findByPk(acomodacaoId, {
                include: [
                    {
                        model: Hospedagem,
                        as: 'hospedagens',
                        include: [
                            {
                                model: Cliente,
                                as: 'cliente',
                                include: [
                                    { model: Documento, as: 'documentos' },
                                    { model: Telefone, as: 'telefones' },
                                    { model: Endereco, as: 'endereco' }
                                ]
                            }
                        ]
                    }
                ]
            });

            if (!acomodacao) {
                throw new Error('Acomodação não encontrada');
            }

            // Processar todas as hospedagens desta acomodação
            const hospedagensDetalhadas = acomodacao.hospedagens.map(h => ({
                hospedagem: {
                    id: h.id,
                    dataCheckIn: h.data_check_in,
                    dataCheckOut: h.data_check_out,
                    numeroQuarto: h.numero_quarto,
                    ativa: h.ativa,
                    status: h.ativa ? '🟢 ATIVO' : '🔴 FINALIZADO'
                },
                cliente: {
                    id: h.cliente.id,
                    nome: h.cliente.nome,
                    apelido: h.cliente.apelido,
                    tipo: h.cliente.titular_id ? '👶 Dependente' : '👑 Titular',
                    dataNascimento: h.cliente.data_nascimento,
                    telefones: h.cliente.telefones?.map(t => ({
                        ddd: t.ddd,
                        numero: t.numero,
                        formatado: `(${t.ddd}) ${t.numero}`
                    })) || [],
                    endereco: h.cliente.endereco ? {
                        completo: `${h.cliente.endereco.rua}, ${h.cliente.endereco.cidade}/${h.cliente.endereco.estado}`,
                        rua: h.cliente.endereco.rua,
                        cidade: h.cliente.endereco.cidade,
                        estado: h.cliente.endereco.estado
                    } : null,
                    documentos: h.cliente.documentos?.map(d => ({
                        tipo: d.tipo,
                        numero: d.numero,
                        formatado: `${d.tipo}: ${d.numero}`
                    })) || []
                }
            }));

            // Ordenar por data de check-in (mais recente primeiro)
            hospedagensDetalhadas.sort((a, b) => new Date(b.hospedagem.dataCheckIn) - new Date(a.hospedagem.dataCheckIn));

            const resultado = {
                acomodacao: {
                    id: acomodacao.id,
                    tipo: acomodacao.tipo,
                    nome: acomodacao.nome_acomodacao,
                    camaSolteiro: acomodacao.cama_solteiro,
                    camaCasal: acomodacao.cama_casal,
                    suite: acomodacao.suite,
                    climatizacao: acomodacao.climatizacao,
                    garagem: acomodacao.garagem,
                    disponivel: acomodacao.disponivel,
                    imagem: acomodacao.imagem_url
                },
                estatisticas: {
                    totalHospedagens: hospedagensDetalhadas.length,
                    hospedagensAtivas: hospedagensDetalhadas.filter(h => h.hospedagem.ativa).length,
                    hospedagensFinalizadas: hospedagensDetalhadas.filter(h => !h.hospedagem.ativa).length,
                    ocupacaoAtual: hospedagensDetalhadas.filter(h => h.hospedagem.ativa).length > 0 ? '🟢 OCUPADA' : '🟡 LIVRE'
                },
                hospedagens: hospedagensDetalhadas
            };

            console.log(`✅ Acomodação ${acomodacao.nome_acomodacao}: ${hospedagensDetalhadas.length} hospedagem(ns) encontrada(s)`);
            return resultado;

        } catch (error) {
            console.error('❌ Erro ao consultar acomodação específica:', error);
            throw error;
        }
    }

    // === HOSPEDAGENS ===

    static async salvarHospedagem(dadosHospedagem) {
        try {
            // Buscar dados completos do cliente
            const cliente = await Cliente.findByPk(dadosHospedagem.cliente.id);
            if (!cliente) {
                throw new Error('Cliente não encontrado');
            }

            // Buscar dados completos da acomodação
            const acomodacao = await Acomodacao.findByPk(dadosHospedagem.acomodacao.id);
            if (!acomodacao) {
                throw new Error('Acomodação não encontrada');
            }

            // ========== CORREÇÃO: DETERMINAR NOMES PARA HOSPEDAGEM ==========
            let clienteNome = cliente.nome;
            let titularId = null;
            let titularNome = null;
            let dependenteNome = null;

            if (cliente.titular_id) {
                // Este cliente é um dependente
                const titular = await Cliente.findByPk(cliente.titular_id);
                titularId = titular.id;
                titularNome = titular.nome; // ✅ PEGA DO BANCO
                dependenteNome = cliente.nome;
                console.log(`>>> HOSPEDAGEM DEPENDENTE: ${cliente.nome} do titular ${titular.nome}`);
            } else {
                // Este cliente é um titular
                titularId = null;
                titularNome = cliente.nome;
                dependenteNome = null;
                console.log(`>>> HOSPEDAGEM TITULAR: ${cliente.nome}`);
            }

            const hospedagem = await Hospedagem.create({
                cliente_id: cliente.id,
                acomodacao_id: acomodacao.id,
                data_check_in: dadosHospedagem.dataCheckIn,
                data_check_out: dadosHospedagem.dataCheckOut,
                numero_quarto: dadosHospedagem.numeroQuarto,
                ativa: dadosHospedagem.ativa,
                // ✅ CAMPOS EXTRAS PREENCHIDOS:
                cliente_nome: clienteNome,
                titular_id: titularId,
                titular_nome: titularNome,
                dependente_nome: dependenteNome,
                acomodacao_nome: acomodacao.nome_acomodacao
            });

            console.log('✅ Hospedagem salva com nomes!');
            return hospedagem.id;
        } catch (error) {
            console.error('❌ Erro ao salvar hospedagem:', error);
            throw error;
        }
    }

    static async carregarHospedagens() {
        const hospedagens = await Hospedagem.findAll({
            include: [
                { model: Cliente, as: 'cliente' },
                { model: Acomodacao, as: 'acomodacao' }
            ]
        });

        return hospedagens.map(h => ({
            id: h.id,
            cliente: {
                id: h.cliente.id,
                nome: h.cliente.nome,
                apelido: h.cliente.apelido
            },
            acomodacao: {
                id: h.acomodacao.id,
                tipo: h.acomodacao.tipo,
                nomeAcomodacao: h.acomodacao.nome_acomodacao
            },
            dataCheckIn: h.data_check_in,
            dataCheckOut: h.data_check_out,
            numeroQuarto: h.numero_quarto,
            ativa: h.ativa
        }));
    }

    static async atualizarHospedagem(hospedagemId, dados) {
        await Hospedagem.update(dados, { where: { id: hospedagemId } });
    }
}

export default AtlantisDB;