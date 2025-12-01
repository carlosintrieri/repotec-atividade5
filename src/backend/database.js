// backend/database.js - Configuração MySQL e Models Sequelize (ES Modules)

import { Sequelize, DataTypes } from 'sequelize';

// Configuração MySQL
const sequelize = new Sequelize({
    dialect: 'mysql',
    host: 'localhost',
    username: 'root',
    password: 'Carlos1313*',
    database: 'atlantis_water_park',
    logging: false,
    define: {
        timestamps: true,
        underscored: true
    }
});

// Model Cliente
const Cliente = sequelize.define('Cliente', {
    nome: { type: DataTypes.STRING(100), allowNull: false },
    apelido: { type: DataTypes.STRING(50), allowNull: false },
    data_nascimento: { type: DataTypes.DATEONLY, allowNull: false },
    data_cadastro: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    titular_id: { type: DataTypes.INTEGER, allowNull: true },
    ativo: { type: DataTypes.BOOLEAN, defaultValue: true }
}, {
    tableName: 'clientes'
});

// Model Documento - COM CAMPOS DE TITULARES/DEPENDENTES
const Documento = sequelize.define('Documento', {
    numero: { type: DataTypes.STRING(20), allowNull: false },
    tipo: { type: DataTypes.ENUM('CPF', 'RG', 'Passaporte'), allowNull: false },
    data_expedicao: { type: DataTypes.DATEONLY, defaultValue: DataTypes.NOW },
    cliente_id: { type: DataTypes.INTEGER, allowNull: false },
    // NOVOS CAMPOS PARA APARECER NO WORKBENCH:
    cliente_nome: { type: DataTypes.STRING(100), allowNull: true },
    titular_id: { type: DataTypes.INTEGER, allowNull: true },
    titular_nome: { type: DataTypes.STRING(100), allowNull: true },
    dependente_nome: { type: DataTypes.STRING(100), allowNull: true }
}, {
    tableName: 'documentos'
});

// Model Endereco - COM CAMPOS DE TITULARES/DEPENDENTES
const Endereco = sequelize.define('Endereco', {
    rua: { type: DataTypes.STRING(200), allowNull: false },
    bairro: { type: DataTypes.STRING(100) },
    cidade: { type: DataTypes.STRING(100) },
    estado: { type: DataTypes.STRING(2) },
    pais: { type: DataTypes.STRING(50), defaultValue: 'Brasil' },
    codigo_postal: { type: DataTypes.STRING(10) },
    cliente_id: { type: DataTypes.INTEGER, allowNull: false, unique: true },
    // NOVOS CAMPOS PARA APARECER NO WORKBENCH:
    cliente_nome: { type: DataTypes.STRING(100), allowNull: true },
    titular_id: { type: DataTypes.INTEGER, allowNull: true },
    titular_nome: { type: DataTypes.STRING(100), allowNull: true },
    dependente_nome: { type: DataTypes.STRING(100), allowNull: true }
}, {
    tableName: 'enderecos'
});

// Model Telefone - COM CAMPOS DE TITULARES/DEPENDENTES
const Telefone = sequelize.define('Telefone', {
    ddd: { type: DataTypes.STRING(2), allowNull: false },
    numero: { type: DataTypes.STRING(15), allowNull: false },
    cliente_id: { type: DataTypes.INTEGER, allowNull: false },
    principal: { type: DataTypes.BOOLEAN, defaultValue: false },
    // NOVOS CAMPOS PARA APARECER NO WORKBENCH:
    cliente_nome: { type: DataTypes.STRING(100), allowNull: true },
    titular_id: { type: DataTypes.INTEGER, allowNull: true },
    titular_nome: { type: DataTypes.STRING(100), allowNull: true },
    dependente_nome: { type: DataTypes.STRING(100), allowNull: true }
}, {
    tableName: 'telefones'
});

// Model Acomodacao
const Acomodacao = sequelize.define('Acomodacao', {
    tipo: { type: DataTypes.STRING(50), allowNull: false },
    nome_acomodacao: { type: DataTypes.STRING(100), allowNull: false },
    cama_solteiro: { type: DataTypes.INTEGER, defaultValue: 0 },
    cama_casal: { type: DataTypes.INTEGER, defaultValue: 0 },
    suite: { type: DataTypes.INTEGER, defaultValue: 1 },
    climatizacao: { type: DataTypes.BOOLEAN, defaultValue: true },
    garagem: { type: DataTypes.INTEGER, defaultValue: 0 },
    disponivel: { type: DataTypes.BOOLEAN, defaultValue: true },
    imagem_url: { type: DataTypes.TEXT }
}, {
    tableName: 'acomodacoes'
});

// Model Hospedagem - COM CAMPOS DE TITULARES/DEPENDENTES
const Hospedagem = sequelize.define('Hospedagem', {
    cliente_id: { type: DataTypes.INTEGER, allowNull: false },
    acomodacao_id: { type: DataTypes.INTEGER, allowNull: false },
    data_check_in: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    data_check_out: { type: DataTypes.DATE },
    numero_quarto: { type: DataTypes.INTEGER, allowNull: false },
    ativa: { type: DataTypes.BOOLEAN, defaultValue: true },
    // NOVOS CAMPOS PARA APARECER NO WORKBENCH:
    cliente_nome: { type: DataTypes.STRING(100), allowNull: true },
    titular_id: { type: DataTypes.INTEGER, allowNull: true },
    titular_nome: { type: DataTypes.STRING(100), allowNull: true },
    dependente_nome: { type: DataTypes.STRING(100), allowNull: true },
    acomodacao_nome: { type: DataTypes.STRING(100), allowNull: true }
}, {
    tableName: 'hospedagens'
});

// Relacionamentos
Cliente.hasMany(Cliente, { as: 'dependentes', foreignKey: 'titular_id' });
Cliente.belongsTo(Cliente, { as: 'titular', foreignKey: 'titular_id' });
Cliente.hasMany(Documento, { as: 'documentos', foreignKey: 'cliente_id', onDelete: 'CASCADE' });
Cliente.hasOne(Endereco, { as: 'endereco', foreignKey: 'cliente_id', onDelete: 'CASCADE' });
Cliente.hasMany(Telefone, { as: 'telefones', foreignKey: 'cliente_id', onDelete: 'CASCADE' });
Cliente.hasMany(Hospedagem, { as: 'hospedagens', foreignKey: 'cliente_id' });

Documento.belongsTo(Cliente, { as: 'cliente', foreignKey: 'cliente_id' });
Endereco.belongsTo(Cliente, { as: 'cliente', foreignKey: 'cliente_id' });
Telefone.belongsTo(Cliente, { as: 'cliente', foreignKey: 'cliente_id' });

Acomodacao.hasMany(Hospedagem, { as: 'hospedagens', foreignKey: 'acomodacao_id' });
Hospedagem.belongsTo(Cliente, { as: 'cliente', foreignKey: 'cliente_id' });
Hospedagem.belongsTo(Acomodacao, { as: 'acomodacao', foreignKey: 'acomodacao_id' });

export {
    sequelize,
    Cliente,
    Documento,
    Endereco,
    Telefone,
    Acomodacao,
    Hospedagem
};