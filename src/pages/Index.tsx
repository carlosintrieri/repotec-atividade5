import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    Users, Hotel, Calendar, BarChart3, Plus, Trash2, User, UserPlus, LogIn, LogOut,
    TrendingUp, Waves, Car, Bed, Bath, Snowflake, Phone, MapPin, FileText, Search,
    Eye, CheckCircle, Clock, Baby
} from 'lucide-react';

// Interfaces TypeScript
interface Documento {
    id: number;
    numero: string;
    tipo: 'CPF' | 'RG' | 'Passaporte';
    dataExpedicao: Date;
}

interface Endereco {
    rua: string;
    bairro: string;
    cidade: string;
    estado: string;
    pais: string;
    codigoPostal: string;
}

interface Telefone {
    ddd: string;
    numero: string;
}

interface Cliente {
    id: number;
    nome: string;
    apelido: string;
    dataNascimento: Date;
    dataCadastro: Date;
    telefones: Telefone[];
    endereco?: Endereco;
    documentos: Documento[];
    dependentes: Cliente[];
    titular?: Cliente;
}

interface Acomodacao {
    id: number;
    tipo: string;
    nomeAcomodacao: string;
    camaSolteiro: number;
    camaCasal: number;
    suite: number;
    climatizacao: boolean;
    garagem: number;
    disponivel: boolean;
    imagem: string;
}

interface Hospedagem {
    id: number;
    cliente: Cliente;
    acomodacao: Acomodacao;
    dataCheckIn: Date;
    dataCheckOut?: Date;
    numeroQuarto: number;
    ativa: boolean;
}

// Imagens específicas para cada acomodação
const IMAGENS_ACOMODACOES = {
    'solteiro-simples': 'https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=800&auto=format&fit=crop&q=60',
    'casal-simples': 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800&auto=format&fit=crop&q=60',
    'familia-simples': 'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=800&auto=format&fit=crop&q=60',
    'familia-mais': 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&auto=format&fit=crop&q=60',
    'familia-super': 'https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=800&auto=format&fit=crop&q=60',
    'solteiro-mais': 'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800&auto=format&fit=crop&q=60'
};

// Classe API para comunicação com o backend MySQL
class AtlantisAPI {
    static BASE_URL = 'http://localhost:3001/api';

    static async carregarClientes() {
        try {
            const response = await fetch(`${this.BASE_URL}/clientes`);
            const data = await response.json();

            if (data.success) {
                return data.clientes.map((c: any) => ({
                    ...c,
                    dataNascimento: new Date(c.dataNascimento),
                    dataCadastro: new Date(c.dataCadastro),
                    documentos: c.documentos?.map((d: any) => ({
                        ...d,
                        dataExpedicao: new Date(d.dataExpedicao)
                    })) || [],
                    dependentes: c.dependentes?.map((dep: any) => ({
                        ...dep,
                        dataNascimento: new Date(dep.dataNascimento),
                        dataCadastro: new Date(dep.dataCadastro),
                        documentos: dep.documentos?.map((d: any) => ({
                            ...d,
                            dataExpedicao: new Date(d.dataExpedicao)
                        })) || []
                    })) || []
                }));
            }
            return [];
        } catch (error) {
            console.error('Erro ao carregar clientes:', error);
            return [];
        }
    }

    static async salvarCliente(dadosCliente: any) {
        try {
            console.log('Dados enviados:', dadosCliente);

            // Validar dados antes de enviar
            if (!dadosCliente.nome || !dadosCliente.apelido || !dadosCliente.dataNascimento) {
                throw new Error('Campos obrigatórios não preenchidos');
            }

            const response = await fetch(`${this.BASE_URL}/clientes`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dadosCliente)
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Erro HTTP:', response.status, errorText);
                throw new Error(`Erro HTTP ${response.status}: ${errorText}`);
            }

            const data = await response.json();
            console.log('Resposta do backend:', data);

            if (data.success) {
                return data.clienteId;
            }
            throw new Error(data.error || 'Erro ao salvar cliente');
        } catch (error) {
            console.error('Erro completo:', error);
            throw error;
        }
    }
    static async removerCliente(clienteId: number) {
        try {
            const response = await fetch(`${this.BASE_URL}/clientes/${clienteId}`, {
                method: 'DELETE'
            });

            const data = await response.json();
            if (!data.success) {
                throw new Error(data.error || 'Erro ao remover cliente');
            }
        } catch (error) {
            console.error('Erro ao remover cliente:', error);
            throw error;
        }
    }

    static async carregarAcomodacoes() {
        try {
            const response = await fetch(`${this.BASE_URL}/acomodacoes`);
            const data = await response.json();

            if (data.success) {
                return data.acomodacoes;
            }
            return [];
        } catch (error) {
            console.error('Erro ao carregar acomodações:', error);
            return [];
        }
    }

    static async atualizarDisponibilidadeAcomodacao(acomodacaoId: number, disponivel: boolean) {
        try {
            const response = await fetch(`${this.BASE_URL}/acomodacoes/${acomodacaoId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ disponivel })
            });

            const data = await response.json();
            if (!data.success) {
                throw new Error(data.error || 'Erro ao atualizar acomodação');
            }
        } catch (error) {
            console.error('Erro ao atualizar acomodação:', error);
            throw error;
        }
    }

    static async carregarHospedagens() {
        try {
            const response = await fetch(`${this.BASE_URL}/hospedagens`);
            const data = await response.json();

            if (data.success) {
                return data.hospedagens.map((h: any) => ({
                    ...h,
                    dataCheckIn: new Date(h.dataCheckIn),
                    dataCheckOut: h.dataCheckOut ? new Date(h.dataCheckOut) : undefined
                }));
            }
            return [];
        } catch (error) {
            console.error('Erro ao carregar hospedagens:', error);
            return [];
        }
    }

    static async salvarHospedagem(dadosHospedagem: any) {
        try {
            const response = await fetch(`${this.BASE_URL}/hospedagens`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dadosHospedagem)
            });

            const data = await response.json();
            if (data.success) {
                return data.hospedagemId;
            }
            throw new Error(data.error || 'Erro ao salvar hospedagem');
        } catch (error) {
            console.error('Erro ao salvar hospedagem:', error);
            throw error;
        }
    }

    static async realizarCheckout(hospedagemId: number) {
        try {
            const response = await fetch(`${this.BASE_URL}/hospedagens/${hospedagemId}/checkout`, {
                method: 'PUT'
            });

            const data = await response.json();
            if (!data.success) {
                throw new Error(data.error || 'Erro no check-out');
            }
        } catch (error) {
            console.error('Erro no check-out:', error);
            throw error;
        }
    }
}
const AtlantisWaterPark = () => {
    // Estados principais
    const [activeTab, setActiveTab] = useState('dashboard');
    const [clientes, setClientes] = useState<Cliente[]>([]);
    const [acomodacoes, setAcomodacoes] = useState<Acomodacao[]>([]);
    const [hospedagens, setHospedagens] = useState<Hospedagem[]>([]);
    const [showModal, setShowModal] = useState(false);
    const [modalType, setModalType] = useState('');
    const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null);
    const [documentosTemp, setDocumentosTemp] = useState<Documento[]>([]);
    const [loading, setLoading] = useState(false);

    // Estados individuais do formulário (CORREÇÃO DO PROBLEMA DOS INPUTS)
    const [nome, setNome] = useState('');
    const [apelido, setApelido] = useState('');
    const [dataNascimento, setDataNascimento] = useState('');
    const [rua, setRua] = useState('');
    const [bairro, setBairro] = useState('');
    const [cidade, setCidade] = useState('');
    const [estado, setEstado] = useState('');
    const [pais, setPais] = useState('Brasil');
    const [cep, setCep] = useState('');
    const [ddd, setDdd] = useState('');
    const [telefone, setTelefone] = useState('');
    const [clienteId, setClienteId] = useState('');
    const [acomodacaoId, setAcomodacaoId] = useState('');

    // Carregar dados do MySQL ao inicializar
    // Carregar dados do MySQL ao inicializar
    useEffect(() => {
        carregarDadosIniciais();
    }, []);

    // Inicializar acomodações com imagens se não existirem no banco
    useEffect(() => {
        if (acomodacoes.length === 0) {
            const acomodacoesIniciais: Acomodacao[] = [
                {
                    id: 1, tipo: 'solteiro-simples', nomeAcomodacao: 'Solteiro Simples',
                    camaSolteiro: 1, camaCasal: 0, suite: 1, climatizacao: true, garagem: 0,
                    disponivel: true, imagem: IMAGENS_ACOMODACOES['solteiro-simples']
                },
                {
                    id: 2, tipo: 'casal-simples', nomeAcomodacao: 'Casal Simples',
                    camaSolteiro: 0, camaCasal: 1, suite: 1, climatizacao: true, garagem: 1,
                    disponivel: true, imagem: IMAGENS_ACOMODACOES['casal-simples']
                },
                {
                    id: 3, tipo: 'familia-simples', nomeAcomodacao: 'Família Simples',
                    camaSolteiro: 2, camaCasal: 1, suite: 1, climatizacao: true, garagem: 1,
                    disponivel: true, imagem: IMAGENS_ACOMODACOES['familia-simples']
                },
                {
                    id: 4, tipo: 'familia-mais', nomeAcomodacao: 'Família Mais',
                    camaSolteiro: 5, camaCasal: 1, suite: 2, climatizacao: true, garagem: 2,
                    disponivel: true, imagem: IMAGENS_ACOMODACOES['familia-mais']
                },
                {
                    id: 5, tipo: 'familia-super', nomeAcomodacao: 'Família Super',
                    camaSolteiro: 6, camaCasal: 2, suite: 3, climatizacao: true, garagem: 2,
                    disponivel: true, imagem: IMAGENS_ACOMODACOES['familia-super']
                },
                {
                    id: 6, tipo: 'solteiro-mais', nomeAcomodacao: 'Solteiro Mais',
                    camaSolteiro: 0, camaCasal: 1, suite: 1, climatizacao: true, garagem: 1,
                    disponivel: true, imagem: IMAGENS_ACOMODACOES['solteiro-mais']
                }
            ];
            setAcomodacoes(acomodacoesIniciais);
        }
    }, [acomodacoes.length]);
    // Função para carregar todos os dados do banco
    const carregarDadosIniciais = async () => {
        setLoading(true);
        try {
            const [clientesData, acomodacoesData, hospedagensData] = await Promise.all([
                AtlantisAPI.carregarClientes(),
                AtlantisAPI.carregarAcomodacoes(),
                AtlantisAPI.carregarHospedagens()
            ]);

            setClientes(clientesData);
            setAcomodacoes(acomodacoesData);
            setHospedagens(hospedagensData);
        } catch (error) {
            console.error('Erro ao carregar dados:', error);
            alert('Erro ao carregar dados do servidor. Verifique se o backend está rodando.');
        } finally {
            setLoading(false);
        }
    };

    // Função para limpar formulário (CORRIGIDA)
    const limparFormulario = useCallback(() => {
        setNome('');
        setApelido('');
        setDataNascimento('');
        setRua('');
        setBairro('');
        setCidade('');
        setEstado('');
        setPais('Brasil');
        setCep('');
        setDdd('');
        setTelefone('');
        setClienteId('');
        setAcomodacaoId('');
        setDocumentosTemp([]);
        setSelectedCliente(null);
    }, []);

    // Adicionar documento
    const adicionarDocumento = useCallback((tipo: 'CPF' | 'RG' | 'Passaporte') => {
        const numero = prompt(`Digite o número do ${tipo}:`);
        if (numero && numero.trim()) {
            const novoDoc: Documento = {
                id: Date.now(),
                numero: numero.trim(),
                tipo,
                dataExpedicao: new Date()
            };
            setDocumentosTemp(prev => [...prev, novoDoc]);
            alert(`${tipo} ${numero} adicionado com sucesso!`);
        }
    }, []);

    // Remover documento temporário
    const removerDocumento = useCallback((docId: number) => {
        setDocumentosTemp(prev => prev.filter(doc => doc.id !== docId));
    }, []);

    // Adicionar cliente titular - INTEGRADO AO MYSQL
    const adicionarCliente = async (cliente: Omit<Cliente, 'id' | 'dataCadastro' | 'dependentes'>) => {
        setLoading(true);
        try {
            const dadosCliente = {
                nome: cliente.nome,
                apelido: cliente.apelido,
                dataNascimento: cliente.dataNascimento.toISOString().split('T')[0],
                telefones: cliente.telefones,
                endereco: cliente.endereco,
                documentos: cliente.documentos.map(doc => ({
                    numero: doc.numero,
                    tipo: doc.tipo,
                    dataExpedicao: doc.dataExpedicao.toISOString().split('T')[0]
                }))
            };

            const clienteId = await AtlantisAPI.salvarCliente(dadosCliente);

            // Recarregar dados do banco
            await carregarDadosIniciais();

            alert(`Cliente ${cliente.nome} cadastrado com sucesso! ID: ${clienteId}`);
        } catch (error) {
            console.error('Erro ao cadastrar cliente:', error);
            alert('Erro ao cadastrar cliente no banco de dados.');
        } finally {
            setLoading(false);
        }
    };

    // Adicionar dependente - INTEGRADO AO MYSQL
    const adicionarDependente = async (dependente: Omit<Cliente, 'id' | 'dataCadastro' | 'dependentes'>, titularId: number) => {
        const titular = clientes.find(c => c.id === titularId);
        if (!titular) return;

        setLoading(true);
        try {
            const dadosDependente = {
                nome: dependente.nome,
                apelido: dependente.apelido,
                dataNascimento: dependente.dataNascimento.toISOString().split('T')[0],
                telefones: dependente.telefones,
                endereco: dependente.endereco,
                documentos: dependente.documentos.map(doc => ({
                    numero: doc.numero,
                    tipo: doc.tipo,
                    dataExpedicao: doc.dataExpedicao.toISOString().split('T')[0]
                })),
                titular: { id: titularId }
            };

            const dependenteId = await AtlantisAPI.salvarCliente(dadosDependente);

            // Recarregar dados do banco
            await carregarDadosIniciais();

            alert(`Dependente ${dependente.nome} vinculado a ${titular.nome}! ID: ${dependenteId}`);
        } catch (error) {
            console.error('Erro ao cadastrar dependente:', error);
            alert('Erro ao cadastrar dependente no banco de dados.');
        } finally {
            setLoading(false);
        }
    };

    // Check-in - INTEGRADO AO MYSQL
    const realizarCheckIn = async (clienteIdParam: number, acomodacaoIdParam: number) => {
        const cliente = clientes.find(c => c.id === clienteIdParam);
        const acomodacao = acomodacoes.find(a => a.id === acomodacaoIdParam);

        if (cliente && acomodacao && acomodacao.disponivel) {
            setLoading(true);
            try {
                const dadosHospedagem = {
                    cliente: { id: clienteIdParam },
                    acomodacao: { id: acomodacaoIdParam },
                    dataCheckIn: new Date().toISOString(),
                    numeroQuarto: Math.floor(Math.random() * 900) + 100,
                    ativa: true
                };

                const hospedagemId = await AtlantisAPI.salvarHospedagem(dadosHospedagem);

                // Atualizar disponibilidade da acomodação
                await AtlantisAPI.atualizarDisponibilidadeAcomodacao(acomodacaoIdParam, false);

                // Recarregar dados do banco
                await carregarDadosIniciais();

                alert(`Check-in realizado! ${cliente.nome} - Quarto ${dadosHospedagem.numeroQuarto} - ID: ${hospedagemId}`);
            } catch (error) {
                console.error('Erro no check-in:', error);
                alert('Erro ao realizar check-in no banco de dados.');
            } finally {
                setLoading(false);
            }
        }
    };

    // Check-out - INTEGRADO AO MYSQL
    const realizarCheckOut = async (hospedagemId: number) => {
        const hospedagem = hospedagens.find(h => h.id === hospedagemId);
        if (!hospedagem) return;

        setLoading(true);
        try {
            await AtlantisAPI.realizarCheckout(hospedagemId);

            // Atualizar disponibilidade da acomodação
            await AtlantisAPI.atualizarDisponibilidadeAcomodacao(hospedagem.acomodacao.id, true);

            // Recarregar dados do banco
            await carregarDadosIniciais();

            alert(`Check-out realizado! ${hospedagem.cliente.nome} finalizou a hospedagem.`);
        } catch (error) {
            console.error('Erro no check-out:', error);
            alert('Erro ao realizar check-out no banco de dados.');
        } finally {
            setLoading(false);
        }
    };

    // Remover cliente - INTEGRADO AO MYSQL
    const removerCliente = async (clienteIdParam: number) => {
        const cliente = clientes.find(c => c.id === clienteIdParam);
        if (!cliente) return;

        if (confirm(`Tem certeza que deseja remover ${cliente.nome}? Esta ação não pode ser desfeita.`)) {
            setLoading(true);
            try {
                await AtlantisAPI.removerCliente(clienteIdParam);

                // Recarregar dados do banco
                await carregarDadosIniciais();

                alert(`Cliente ${cliente.nome} removido com sucesso!`);
            } catch (error) {
                console.error('Erro ao remover cliente:', error);
                alert('Erro ao remover cliente do banco de dados.');
            } finally {
                setLoading(false);
            }
        }
    };

    // Finalizar cadastro com validação e integração MySQL
    const finalizarCadastro = async () => {
        if (!nome || !apelido || !dataNascimento) {
            alert('Preencha nome, apelido e data de nascimento!');
            return;
        }

        if (documentosTemp.length === 0) {
            alert('Adicione pelo menos um documento!');
            return;
        }

        const documentosInvalidos = documentosTemp.filter(doc => !doc.numero.trim());
        if (documentosInvalidos.length > 0) {
            alert('Todos os documentos devem ter números válidos!');
            return;
        }

        if (!ddd || !telefone) {
            alert('Adicione o telefone!');
            return;
        }

        const dadosCliente = {
            nome: nome,
            apelido: apelido,
            dataNascimento: new Date(dataNascimento),
            telefones: [{ ddd: ddd, numero: telefone }],
            endereco: rua ? {
                rua: rua,
                bairro: bairro || '',
                cidade: cidade || '',
                estado: estado || '',
                pais: pais || 'Brasil',
                codigoPostal: cep || ''
            } : undefined,
            documentos: documentosTemp
        };

        if (modalType === 'cliente-titular') {
            await adicionarCliente(dadosCliente);
        } else if (modalType === 'dependente' && selectedCliente) {
            await adicionarDependente(dadosCliente, selectedCliente.id);
        }

        // Fechar modal e limpar formulário
        setShowModal(false);
        setModalType('');
        limparFormulario();
    };
    // Componente Dashboard
    const Dashboard = () => {
        const totalClientes = clientes.length;
        const hospedagensAtivas = hospedagens.filter(h => h.ativa).length;
        const hospedagensFinalizadas = hospedagens.filter(h => !h.ativa).length;
        const taxaOcupacao = acomodacoes.length > 0 ? Math.round((hospedagensAtivas / acomodacoes.length) * 100) : 0;

        if (loading) {
            return (
                <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                        <p className="text-gray-600">Carregando dados do MySQL...</p>
                    </div>
                </div>
            );
        }

        return (
            <div className="space-y-6 md:space-y-8">
                {/* Hero Section */}
                <div className="relative h-64 md:h-96 rounded-3xl overflow-hidden shadow-2xl">
                    <img
                        src="https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=1200&auto=format&fit=crop&q=80"
                        alt="Atlantis Water Park Resort"
                        className="absolute inset-0 w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-600/60 to-cyan-500/40"></div>
                    <div className="absolute inset-0 bg-black/30"></div>
                    <div className="relative z-10 h-full flex items-center justify-center text-center text-white p-4">
                        <div className="space-y-4">
                            <div className="flex items-center justify-center space-x-2 md:space-x-4">
                                <Waves size={32} className="text-white animate-bounce md:hidden" />
                                <Waves size={48} className="text-white animate-bounce hidden md:block" />
                                <h1 className="text-2xl md:text-5xl font-bold drop-shadow-lg">Atlantis Water Park</h1>
                                <Waves size={32} className="text-white animate-bounce md:hidden" />
                                <Waves size={48} className="text-white animate-bounce hidden md:block" />
                            </div>
                            <p className="text-sm md:text-xl opacity-90 drop-shadow-md">Sistema Completo de Gestão de Resort</p>
                        </div>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
                    <div className="bg-white rounded-xl p-4 md:p-6 shadow-lg border border-blue-100">
                        <div className="flex items-center space-x-2 md:space-x-4">
                            <div className="p-2 md:p-3 bg-blue-100 rounded-full">
                                <Users className="h-4 w-4 md:h-8 md:w-8 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-xs md:text-sm font-medium text-gray-600">Total Clientes</p>
                                <p className="text-xl md:text-3xl font-bold text-blue-600">{totalClientes}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl p-4 md:p-6 shadow-lg border border-green-100">
                        <div className="flex items-center space-x-2 md:space-x-4">
                            <div className="p-2 md:p-3 bg-green-100 rounded-full">
                                <Hotel className="h-4 w-4 md:h-8 md:w-8 text-green-600" />
                            </div>
                            <div>
                                <p className="text-xs md:text-sm font-medium text-gray-600">Acomodações</p>
                                <p className="text-xl md:text-3xl font-bold text-green-600">{acomodacoes.length}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl p-4 md:p-6 shadow-lg border border-yellow-100">
                        <div className="flex items-center space-x-2 md:space-x-4">
                            <div className="p-2 md:p-3 bg-yellow-100 rounded-full">
                                <CheckCircle className="h-4 w-4 md:h-8 md:w-8 text-yellow-600" />
                            </div>
                            <div>
                                <p className="text-xs md:text-sm font-medium text-gray-600">Hospedagens Ativas</p>
                                <p className="text-xl md:text-3xl font-bold text-yellow-600">{hospedagensAtivas}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl p-4 md:p-6 shadow-lg border border-purple-100">
                        <div className="flex items-center space-x-2 md:space-x-4">
                            <div className="p-2 md:p-3 bg-purple-100 rounded-full">
                                <TrendingUp className="h-4 w-4 md:h-8 md:w-8 text-purple-600" />
                            </div>
                            <div>
                                <p className="text-xs md:text-sm font-medium text-gray-600">Taxa Ocupação</p>
                                <p className="text-xl md:text-3xl font-bold text-purple-600">{taxaOcupacao}%</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Admin Panel */}
                <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                    <div className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white p-4 md:p-6">
                        <h3 className="text-lg md:text-xl font-bold flex items-center space-x-2">
                            <BarChart3 className="h-5 w-5 md:h-6 md:w-6" />
                            <span>Painel Administrativo do Resort</span>
                        </h3>
                    </div>
                    <div className="p-4 md:p-6 space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 text-sm md:text-lg">
                            <div className="flex items-center space-x-2">
                                <Hotel className="h-4 w-4 md:h-5 md:w-5 text-blue-600" />
                                <span>Total de acomodações: <strong>{acomodacoes.length}</strong></span>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Users className="h-4 w-4 md:h-5 md:w-5 text-green-600" />
                                <span>Total de clientes: <strong>{totalClientes}</strong></span>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Calendar className="h-4 w-4 md:h-5 md:w-5 text-yellow-600" />
                                <span>Total de hospedagens: <strong>{hospedagens.length}</strong></span>
                            </div>
                            <div className="flex items-center space-x-2">
                                <CheckCircle className="h-4 w-4 md:h-5 md:w-5 text-green-600" />
                                <span>Hospedagens ativas: <strong className="text-green-600">{hospedagensAtivas}</strong></span>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Clock className="h-4 w-4 md:h-5 md:w-5 text-red-600" />
                                <span>Hospedagens finalizadas: <strong className="text-red-600">{hospedagensFinalizadas}</strong></span>
                            </div>
                            <div className="flex items-center space-x-2">
                                <TrendingUp className="h-4 w-4 md:h-5 md:w-5 text-purple-600" />
                                <span>Taxa de ocupação: <strong className="text-purple-600">{taxaOcupacao}%</strong></span>
                            </div>
                        </div>

                        {/* Seção de Documentos */}
                        {clientes.some(c => c.documentos && c.documentos.length > 0) && (
                            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                                <h4 className="font-bold text-gray-800 mb-3 flex items-center">
                                    <FileText className="h-5 w-5 mr-2" />
                                    Documentos Cadastrados no Sistema
                                </h4>
                                <div className="space-y-2 max-h-48 overflow-y-auto">
                                    {clientes.map(cliente =>
                                        cliente.documentos?.map(doc => (
                                            <div key={`${cliente.id}-${doc.id}`} className="flex justify-between items-center bg-white p-3 rounded border shadow-sm">
                                                <span className="text-sm">
                                                    <strong>{cliente.nome}</strong> - {doc.tipo}: <span className="font-mono text-blue-600">{doc.numero}</span>
                                                </span>
                                                <span className="text-xs text-gray-500">
                                                    {new Date(doc.dataExpedicao).toLocaleDateString('pt-BR')}
                                                </span>
                                            </div>
                                        ))
                                    )}
                                </div>
                                <div className="mt-3 text-sm text-gray-600">
                                    <strong>Total de documentos:</strong> {clientes.reduce((total, c) => total + (c.documentos?.length || 0), 0)}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Ações Rápidas */}
                <div className="bg-white rounded-xl shadow-lg p-4 md:p-6">
                    <h3 className="text-lg md:text-xl font-bold text-blue-600 mb-4 md:mb-6 flex items-center space-x-2">
                        <Plus className="h-5 w-5 md:h-6 md:w-6" />
                        <span>Ações Rápidas</span>
                    </h3>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                        <button
                            onClick={() => { setModalType('cliente-titular'); setShowModal(true); }}
                            className="h-16 md:h-20 bg-gradient-to-r from-blue-500 to-cyan-400 text-white rounded-lg hover:shadow-lg transition-all flex items-center justify-center space-x-1 md:space-x-2 text-sm md:text-base"
                            disabled={loading}
                        >
                            <UserPlus className="h-4 w-4 md:h-5 md:w-5" />
                            <span>Novo Cliente</span>
                        </button>

                        <button
                            onClick={() => { setModalType('dependente'); setShowModal(true); }}
                            className="h-16 md:h-20 bg-gradient-to-r from-green-500 to-emerald-400 text-white rounded-lg hover:shadow-lg transition-all flex items-center justify-center space-x-1 md:space-x-2 text-sm md:text-base"
                            disabled={loading}
                        >
                            <Baby className="h-4 w-4 md:h-5 md:w-5" />
                            <span>Dependente</span>
                        </button>

                        <button
                            onClick={() => { setModalType('checkin'); setShowModal(true); }}
                            className="h-16 md:h-20 bg-gradient-to-r from-yellow-500 to-orange-400 text-white rounded-lg hover:shadow-lg transition-all flex items-center justify-center space-x-1 md:space-x-2 text-sm md:text-base"
                            disabled={loading}
                        >
                            <LogIn className="h-4 w-4 md:h-5 md:w-5" />
                            <span>Check-in</span>
                        </button>

                        <button
                            onClick={() => setActiveTab('hospedagens')}
                            className="h-16 md:h-20 bg-gradient-to-r from-purple-500 to-pink-400 text-white rounded-lg hover:shadow-lg transition-all flex items-center justify-center space-x-1 md:space-x-2 text-sm md:text-base"
                        >
                            <Eye className="h-4 w-4 md:h-5 md:w-5" />
                            <span>Ver Hospedagens</span>
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    // Gestão de Clientes
    const GestaoClientes = () => (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:justify-between md:items-center space-y-4 md:space-y-0">
                <h2 className="text-xl md:text-2xl font-bold text-gray-800">Gestão de Clientes</h2>
                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                    <button
                        onClick={() => { setModalType('cliente-titular'); setShowModal(true); }}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-all flex items-center justify-center space-x-2"
                        disabled={loading}
                    >
                        <Plus className="h-4 w-4" />
                        <span>Novo Cliente</span>
                    </button>
                    <button
                        onClick={() => { setModalType('listar-titulares'); setShowModal(true); }}
                        className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-all flex items-center justify-center space-x-2"
                    >
                        <Search className="h-4 w-4" />
                        <span>Listar Titulares</span>
                    </button>
                    <button
                        onClick={() => { setModalType('listar-dependentes'); setShowModal(true); }}
                        className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-all flex items-center justify-center space-x-2"
                    >
                        <Baby className="h-4 w-4" />
                        <span>Dependentes</span>
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contato</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Documentos</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dependentes</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {clientes.filter(c => !c.titular).map((cliente) => (
                                <tr key={cliente.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-4">
                                        <div className="flex items-center space-x-3">
                                            <div className="flex-shrink-0 h-8 w-8 md:h-10 md:w-10 bg-blue-100 rounded-full flex items-center justify-center">
                                                <User className="h-4 w-4 md:h-5 md:w-5 text-blue-600" />
                                            </div>
                                            <div>
                                                <div className="text-sm font-medium text-gray-900">{cliente.nome}</div>
                                                <div className="text-sm text-gray-500">{cliente.apelido}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-4">
                                        <div className="text-sm text-gray-900">
                                            {cliente.telefones.length > 0
                                                ? `(${cliente.telefones[0].ddd}) ${cliente.telefones[0].numero}`
                                                : 'Sem telefone'
                                            }
                                        </div>
                                        <div className="text-sm text-gray-500">
                                            {cliente.endereco?.cidade || 'Sem endereço'}
                                        </div>
                                    </td>
                                    <td className="px-4 py-4">
                                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                                            {cliente.documentos?.length || 0} documento(s)
                                        </span>
                                    </td>
                                    <td className="px-4 py-4">
                                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                                            {cliente.dependentes.length} dependente(s)
                                        </span>
                                    </td>
                                    <td className="px-4 py-4">
                                        <button
                                            onClick={() => removerCliente(cliente.id)}
                                            className="text-red-600 hover:text-red-800 transition-colors"
                                            disabled={loading}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );

    // Gestão de Acomodações
    const GestaoAcomodacoes = () => {
        const isAcomodacaoOcupada = (acomodacaoId: number) => {
            return hospedagens.some(h => h.acomodacao.id === acomodacaoId && h.ativa);
        };

        return (
            <div className="space-y-6">
                <div className="flex flex-col md:flex-row md:justify-between md:items-center space-y-4 md:space-y-0">
                    <h2 className="text-xl md:text-2xl font-bold text-gray-800">Tipos de Acomodações Disponíveis</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {acomodacoes.map((acomodacao) => {
                        const ocupada = isAcomodacaoOcupada(acomodacao.id);

                        return (
                            <div key={acomodacao.id} className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all">
                                <div className="relative h-48">
                                    <img
                                        src={acomodacao.imagem}
                                        alt={acomodacao.nomeAcomodacao}
                                        className="w-full h-full object-cover"
                                    />
                                    <div className={`absolute top-3 right-3 px-3 py-1 rounded-full text-white font-semibold text-sm ${ocupada ? 'bg-red-500' : 'bg-green-500'}`}>
                                        {ocupada ? 'Ocupada' : 'Disponível'}
                                    </div>
                                </div>
                                <div className="p-6">
                                    <h3 className="text-lg font-bold text-gray-800 mb-3">{acomodacao.id} - {acomodacao.nomeAcomodacao}</h3>
                                    <div className="grid grid-cols-2 gap-2 text-sm text-gray-600 mb-4">
                                        <div className="flex items-center space-x-1">
                                            <Bed className="h-4 w-4" />
                                            <span>{acomodacao.camaSolteiro} cama solteiro</span>
                                        </div>
                                        <div className="flex items-center space-x-1">
                                            <Bed className="h-4 w-4" />
                                            <span>{acomodacao.camaCasal} cama casal</span>
                                        </div>
                                        <div className="flex items-center space-x-1">
                                            <Bath className="h-4 w-4" />
                                            <span>{acomodacao.suite} suíte</span>
                                        </div>
                                        <div className="flex items-center space-x-1">
                                            <Car className="h-4 w-4" />
                                            <span>{acomodacao.garagem} garagem</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between text-sm">
                                        <span className={`px-2 py-1 rounded-full flex items-center space-x-1 ${acomodacao.climatizacao ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>
                                            <Snowflake className="h-3 w-3" />
                                            <span>{acomodacao.climatizacao ? 'Climatizado' : 'Sem clima'}</span>
                                        </span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    // Gestão de Hospedagens
    const GestaoHospedagens = () => (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:justify-between md:items-center space-y-4 md:space-y-0">
                <h2 className="text-xl md:text-2xl font-bold text-gray-800">Gestão de Hospedagens</h2>
                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                    <button
                        onClick={() => { setModalType('checkin'); setShowModal(true); }}
                        className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-all flex items-center justify-center space-x-2"
                        disabled={loading}
                    >
                        <LogIn className="h-4 w-4" />
                        <span>Check-in</span>
                    </button>
                    <button
                        onClick={() => { setModalType('hospedagens-ocupadas'); setShowModal(true); }}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-all flex items-center justify-center space-x-2"
                    >
                        <Eye className="h-4 w-4" />
                        <span>Ver Ocupadas</span>
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acomodação</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quarto</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Check-in</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {hospedagens.map((hospedagem) => (
                                <tr key={hospedagem.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-4">
                                        <div className="flex items-center space-x-3">
                                            <div className="flex-shrink-0 h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                                                <User className="h-4 w-4 text-blue-600" />
                                            </div>
                                            <div>
                                                <div className="text-sm font-medium text-gray-900">{hospedagem.cliente.nome}</div>
                                                <div className="text-sm text-gray-500">{hospedagem.cliente.apelido}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-4 text-sm text-gray-900">
                                        {hospedagem.acomodacao.nomeAcomodacao}
                                    </td>
                                    <td className="px-4 py-4 text-sm font-mono text-gray-900">
                                        #{hospedagem.numeroQuarto}
                                    </td>
                                    <td className="px-4 py-4 text-sm text-gray-900">
                                        {hospedagem.dataCheckIn.toLocaleDateString('pt-BR')}
                                    </td>
                                    <td className="px-4 py-4">
                                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${hospedagem.ativa ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                            {hospedagem.ativa ? 'Ativa' : 'Finalizada'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-4">
                                        {hospedagem.ativa && (
                                            <button
                                                onClick={() => realizarCheckOut(hospedagem.id)}
                                                className="bg-red-600 text-white px-3 py-1 rounded text-xs hover:bg-red-700 transition-all flex items-center space-x-1"
                                                disabled={loading}
                                            >
                                                <LogOut className="h-3 w-3" />
                                                <span>Check-out</span>
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
    // Componente isolado para formulário de cliente
    const FormularioCliente = ({ modalType, onSubmit, onCancel, selectedCliente, clientes, setSelectedCliente }) => {
        const [formNome, setFormNome] = useState('');
        const [formApelido, setFormApelido] = useState('');
        const [formDataNascimento, setFormDataNascimento] = useState('');
        const [formRua, setFormRua] = useState('');
        const [formBairro, setFormBairro] = useState('');
        const [formCidade, setFormCidade] = useState('');
        const [formEstado, setFormEstado] = useState('');
        const [formPais, setFormPais] = useState('Brasil');
        const [formCep, setFormCep] = useState('');
        const [formDdd, setFormDdd] = useState('');
        const [formTelefone, setFormTelefone] = useState('');
        const [formDocumentosTemp, setFormDocumentosTemp] = useState([]);

        const adicionarDocumento = (tipo) => {
            const numero = prompt(`Digite o número do ${tipo}:`);
            if (numero && numero.trim()) {
                const novoDoc = {
                    id: Date.now(),
                    numero: numero.trim(),
                    tipo,
                    dataExpedicao: new Date()
                };
                setFormDocumentosTemp(prev => [...prev, novoDoc]);
                alert(`${tipo} ${numero} adicionado com sucesso!`);
            }
        };

        const removerDocumento = (docId) => {
            setFormDocumentosTemp(prev => prev.filter(doc => doc.id !== docId));
        };

        const handleSubmit = () => {
            if (!formNome || !formApelido || !formDataNascimento) {
                alert('Preencha nome, apelido e data de nascimento!');
                return;
            }

            if (formDocumentosTemp.length === 0) {
                alert('Adicione pelo menos um documento!');
                return;
            }

            if (!formDdd || !formTelefone) {
                alert('Adicione o telefone!');
                return;
            }

            const dadosCliente = {
                nome: formNome,
                apelido: formApelido,
                dataNascimento: new Date(formDataNascimento),
                telefones: [{ ddd: formDdd, numero: formTelefone }],
                endereco: formRua ? {
                    rua: formRua,
                    bairro: formBairro || '',
                    cidade: formCidade || '',
                    estado: formEstado || '',
                    pais: formPais || 'Brasil',
                    codigoPostal: formCep || ''
                } : undefined,
                documentos: formDocumentosTemp
            };

            onSubmit(dadosCliente, selectedCliente?.id);
        };

        return (
            <div className="space-y-4">
                <h3 className="text-lg font-bold text-gray-800 mb-4">
                    {modalType === 'cliente-titular' ? 'Cadastrar Cliente Titular' : 'Cadastrar Dependente'}
                </h3>

                {modalType === 'dependente' && (
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Selecionar Cliente Titular:
                        </label>
                        <select
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            value={selectedCliente?.id || ''}
                            onChange={(e) => {
                                const cliente = clientes.find(c => c.id === parseInt(e.target.value));
                                setSelectedCliente(cliente || null);
                            }}
                        >
                            <option value="">Selecione um titular...</option>
                            {clientes.filter(c => !c.titular).map(c => (
                                <option key={c.id} value={c.id}>{c.nome} ({c.apelido})</option>
                            ))}
                        </select>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input
                        type="text"
                        placeholder="Nome completo *"
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        value={formNome}
                        onChange={(e) => setFormNome(e.target.value)}
                    />
                    <input
                        type="text"
                        placeholder="Apelido *"
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        value={formApelido}
                        onChange={(e) => setFormApelido(e.target.value)}
                    />
                    <input
                        type="date"
                        title="Data de nascimento"
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        value={formDataNascimento}
                        onChange={(e) => setFormDataNascimento(e.target.value)}
                    />
                </div>

                <div className="space-y-3">
                    <h4 className="font-medium text-gray-700">Endereço (opcional):</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <input
                            type="text"
                            placeholder="Rua"
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            value={formRua}
                            onChange={(e) => setFormRua(e.target.value)}
                        />
                        <input
                            type="text"
                            placeholder="Bairro"
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            value={formBairro}
                            onChange={(e) => setFormBairro(e.target.value)}
                        />
                        <input
                            type="text"
                            placeholder="Cidade"
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            value={formCidade}
                            onChange={(e) => setFormCidade(e.target.value)}
                        />
                        <input
                            type="text"
                            placeholder="Estado"
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            value={formEstado}
                            onChange={(e) => setFormEstado(e.target.value)}
                        />
                        <input
                            type="text"
                            placeholder="País"
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            value={formPais}
                            onChange={(e) => setFormPais(e.target.value)}
                        />
                        <input
                            type="text"
                            placeholder="Código postal"
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            value={formCep}
                            onChange={(e) => setFormCep(e.target.value)}
                        />
                    </div>
                </div>

                <div className="space-y-3">
                    <h4 className="font-medium text-gray-700 flex items-center">
                        <FileText className="h-4 w-4 mr-2" />
                        Cadastrar Documentos:
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <button type="button" onClick={() => adicionarDocumento('CPF')} className="w-full bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 transition-all text-sm font-medium">
                            Cadastrar CPF
                        </button>
                        <button type="button" onClick={() => adicionarDocumento('RG')} className="w-full bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 transition-all text-sm font-medium">
                            Cadastrar RG
                        </button>
                        <button type="button" onClick={() => adicionarDocumento('Passaporte')} className="w-full bg-purple-600 text-white px-4 py-3 rounded-lg hover:bg-purple-700 transition-all text-sm font-medium">
                            Cadastrar Passaporte
                        </button>
                    </div>

                    {formDocumentosTemp.length > 0 && (
                        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                            <p className="text-sm font-medium text-green-800 mb-2">Documentos adicionados:</p>
                            <div className="space-y-2">
                                {formDocumentosTemp.map(doc => (
                                    <div key={doc.id} className="flex justify-between items-center text-sm text-green-700 bg-white p-2 rounded border">
                                        <span>{doc.tipo}: {doc.numero}</span>
                                        <button onClick={() => removerDocumento(doc.id)} className="text-red-500 hover:text-red-700">
                                            <Trash2 className="h-3 w-3" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {formDocumentosTemp.length > 0 && (
                    <div className="space-y-3">
                        <h4 className="font-medium text-gray-700 flex items-center">
                            <Phone className="h-4 w-4 mr-2" />
                            Cadastrar Telefone:
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <input
                                type="text"
                                placeholder="DDD (ex: 11) *"
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                value={formDdd}
                                onChange={(e) => setFormDdd(e.target.value)}
                            />
                            <input
                                type="text"
                                placeholder="Número do telefone *"
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                value={formTelefone}
                                onChange={(e) => setFormTelefone(e.target.value)}
                            />
                        </div>
                    </div>
                )}

                <div className="flex space-x-3 pt-4">
                    <button
                        onClick={handleSubmit}
                        className="flex-1 bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-700 transition-all font-medium"
                    >
                        Salvar
                    </button>
                    <button
                        onClick={onCancel}
                        className="flex-1 bg-gray-500 text-white p-3 rounded-lg hover:bg-gray-600 transition-all font-medium"
                    >
                        Cancelar
                    </button>
                </div>
            </div>
        );
    };

    // Modal principal simplificado
    const Modal = () => {
        if (!showModal) return null;

        const handleFormSubmit = async (dadosCliente, titularId) => {
            if (modalType === 'cliente-titular') {
                await adicionarCliente(dadosCliente);
            } else if (modalType === 'dependente' && titularId) {
                await adicionarDependente(dadosCliente, titularId);
            }
            setShowModal(false);
            setModalType('');
            setSelectedCliente(null);
        };

        const handleFormCancel = () => {
            setShowModal(false);
            setModalType('');
            setSelectedCliente(null);
        };

        const renderModalContent = () => {
            switch (modalType) {
                case 'cliente-titular':
                case 'dependente':
                    return (
                        <FormularioCliente
                            modalType={modalType}
                            onSubmit={handleFormSubmit}
                            onCancel={handleFormCancel}
                            selectedCliente={selectedCliente}
                            clientes={clientes}
                            setSelectedCliente={setSelectedCliente}
                        />
                    );

                case 'checkin':
                    return (
                        <div className="space-y-4">
                            <h3 className="text-lg font-bold text-gray-800 mb-4">Realizar Check-in</h3>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Cliente:</label>
                                <select
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    value={clienteId}
                                    onChange={(e) => setClienteId(e.target.value)}
                                >
                                    <option value="">Selecione um cliente...</option>
                                    {clientes.map(c => (
                                        <option key={c.id} value={c.id}>{c.nome} ({c.apelido})</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Acomodação:</label>
                                <select
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    value={acomodacaoId}
                                    onChange={(e) => setAcomodacaoId(e.target.value)}
                                >
                                    <option value="">Selecione uma acomodação...</option>
                                    {acomodacoes.filter(a => a.disponivel).map(a => (
                                        <option key={a.id} value={a.id}>{a.id} - {a.nomeAcomodacao}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex space-x-3 pt-4">
                                <button
                                    onClick={() => {
                                        if (clienteId && acomodacaoId) {
                                            realizarCheckIn(parseInt(clienteId), parseInt(acomodacaoId));
                                            setShowModal(false);
                                            setModalType('');
                                            limparFormulario();
                                        } else {
                                            alert('Selecione cliente e acomodação!');
                                        }
                                    }}
                                    className="flex-1 bg-green-600 text-white p-3 rounded-lg hover:bg-green-700 transition-all font-medium"
                                    disabled={loading}
                                >
                                    {loading ? 'Realizando Check-in...' : 'Realizar Check-in'}
                                </button>
                                <button
                                    onClick={handleFormCancel}
                                    className="flex-1 bg-gray-500 text-white p-3 rounded-lg hover:bg-gray-600 transition-all font-medium"
                                >
                                    Cancelar
                                </button>
                            </div>
                        </div>
                    );

                case 'listar-titulares':
                    return (
                        <div className="space-y-4">
                            <h3 className="text-lg font-bold text-gray-800 mb-4">Clientes Titulares</h3>
                            <div className="max-h-96 overflow-y-auto space-y-2">
                                {clientes.filter(c => !c.titular).map(cliente => (
                                    <div key={cliente.id} className="bg-gray-50 p-4 rounded-lg border">
                                        <div className="font-medium text-lg">{cliente.nome} ({cliente.apelido})</div>
                                        <div className="text-sm text-gray-600">Nascimento: {cliente.dataNascimento.toLocaleDateString('pt-BR')}</div>
                                        <div className="text-sm text-gray-600">Dependentes: {cliente.dependentes.length}</div>
                                        <div className="text-sm text-gray-600">Telefone: {cliente.telefones.length > 0 ? `(${cliente.telefones[0].ddd}) ${cliente.telefones[0].numero}` : 'Não informado'}</div>
                                        <div className="text-sm text-gray-600">Documentos: {cliente.documentos?.length || 0}</div>
                                    </div>
                                ))}
                            </div>
                            <button onClick={() => setShowModal(false)} className="w-full bg-gray-500 text-white p-3 rounded-lg hover:bg-gray-600 transition-all">Fechar</button>
                        </div>
                    );

                case 'listar-dependentes':
                    return (
                        <div className="space-y-4">
                            <h3 className="text-lg font-bold text-gray-800 mb-4">Dependentes por Titular</h3>
                            <div className="max-h-96 overflow-y-auto space-y-2">
                                {clientes.filter(c => c.titular).map(dependente => (
                                    <div key={dependente.id} className="bg-gray-50 p-4 rounded-lg border">
                                        <div className="font-medium text-lg">{dependente.nome} ({dependente.apelido})</div>
                                        <div className="text-sm text-gray-600">Titular: {dependente.titular?.nome}</div>
                                        <div className="text-sm text-gray-600">Nascimento: {dependente.dataNascimento.toLocaleDateString('pt-BR')}</div>
                                        <div className="text-sm text-gray-600">Documentos: {dependente.documentos?.length || 0}</div>
                                    </div>
                                ))}
                            </div>
                            <button onClick={() => setShowModal(false)} className="w-full bg-gray-500 text-white p-3 rounded-lg hover:bg-gray-600 transition-all">Fechar</button>
                        </div>
                    );

                case 'hospedagens-ocupadas':
                    return (
                        <div className="space-y-4">
                            <h3 className="text-lg font-bold text-gray-800 mb-4">Hospedagens Ocupadas</h3>
                            <div className="max-h-96 overflow-y-auto space-y-2">
                                {hospedagens.filter(h => h.ativa).map(hospedagem => (
                                    <div key={hospedagem.id} className="bg-gray-50 p-4 rounded-lg border">
                                        <div className="font-medium text-lg">{hospedagem.cliente.nome} - Quarto #{hospedagem.numeroQuarto}</div>
                                        <div className="text-sm text-gray-600">Acomodação: {hospedagem.acomodacao.nomeAcomodacao}</div>
                                        <div className="text-sm text-gray-600">Check-in: {hospedagem.dataCheckIn.toLocaleDateString('pt-BR')}</div>
                                    </div>
                                ))}
                            </div>
                            <button onClick={() => setShowModal(false)} className="w-full bg-gray-500 text-white p-3 rounded-lg hover:bg-gray-600 transition-all">Fechar</button>
                        </div>
                    );

                default:
                    return null;
            }
        };

        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                    <div className="p-6">{renderModalContent()}</div>
                </div>
            </div>
        );
    };

    // Layout principal com navegação responsiva
    const navigation = [
        { id: 'dashboard', name: 'Dashboard', icon: BarChart3 },
        { id: 'clientes', name: 'Clientes', icon: Users },
        { id: 'acomodacoes', name: 'Acomodações', icon: Hotel },
        { id: 'hospedagens', name: 'Hospedagens', icon: Calendar },
    ];

    return (
        <div className="min-h-screen bg-gray-100">
            <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center space-x-3">
                            <Waves className="h-6 w-6 md:h-8 md:w-8 text-blue-600" />
                            <div>
                                <h1 className="text-lg md:text-xl font-bold text-gray-900">Atlantis Water Park</h1>
                                <p className="text-xs md:text-sm text-gray-500">Sistema de Gestão de Resort</p>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            <div className="flex">
                <nav className="bg-white shadow-sm w-64 min-h-screen sticky top-16 hidden md:block">
                    <div className="p-4 space-y-2">
                        {navigation.map((item) => {
                            const Icon = item.icon;
                            return (
                                <button
                                    key={item.id}
                                    onClick={() => setActiveTab(item.id)}
                                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all ${activeTab === item.id ? 'bg-blue-100 text-blue-700 border-r-2 border-blue-500' : 'text-gray-600 hover:bg-gray-100'}`}
                                >
                                    <Icon className="h-5 w-5" />
                                    <span className="font-medium">{item.name}</span>
                                </button>
                            );
                        })}
                    </div>
                </nav>

                <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40">
                    <div className="flex">
                        {navigation.map((item) => {
                            const Icon = item.icon;
                            return (
                                <button
                                    key={item.id}
                                    onClick={() => setActiveTab(item.id)}
                                    className={`flex-1 flex flex-col items-center py-2 ${activeTab === item.id ? 'text-blue-600' : 'text-gray-400'}`}
                                >
                                    <Icon className="h-5 w-5" />
                                    <span className="text-xs mt-1">{item.name}</span>
                                </button>
                            );
                        })}
                    </div>
                </nav>

                <main className="flex-1 p-4 md:p-8 pb-20 md:pb-8">
                    {activeTab === 'dashboard' && <Dashboard />}
                    {activeTab === 'clientes' && <GestaoClientes />}
                    {activeTab === 'acomodacoes' && <GestaoAcomodacoes />}
                    {activeTab === 'hospedagens' && <GestaoHospedagens />}
                </main>
            </div>

            <Modal />
        </div>
    );
};

export default AtlantisWaterPark;

