const express = require("express");
const fs = require("fs");
const cors = require("cors");
const morgan = require("morgan");
const path = require("path");

const app = express();

// Configuração de middlewares
app.use(express.json());
app.use(morgan("dev"));

// Configuração do CORS
const corsOptions = {
    origin: "http://localhost:3000",
    optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));

// Funções utilitárias
const carregarArquivoJson = (arquivo) => {
    try {
        if (!fs.existsSync(arquivo)) {
            fs.writeFileSync(arquivo, JSON.stringify({}), "utf8");
        }
        const conteudo = fs.readFileSync(arquivo, "utf8");
        return conteudo.trim() ? JSON.parse(conteudo) : {};
    } catch (error) {
        console.error(`Erro ao carregar o arquivo ${arquivo}:`, error);
        return {};
    }
};

const obterCaminhoArquivoBanco = (banco) => {
    return path.resolve(__dirname, `ocorrencias${banco}.json`);
};

// Validação de senha padrão
const validarSenha = (senha) => {
    const senhaConfig = carregarArquivoJson(path.resolve(__dirname, "senhaConfig.json"));
    return senha === senhaConfig.senhaPadrao;
};

// Rotas
app.post("/adicionar-ocorrencia", (req, res) => {
    try {
        const { banco, chave, descricao, senha } = req.body;

        if (!validarSenha(senha)) {
            return res.status(403).json({ error: "Senha inválida!" });
        }

        if (!banco || !chave || !descricao) {
            return res.status(400).json({ error: "Banco, chave e descrição são obrigatórios." });
        }

        const arquivo = obterCaminhoArquivoBanco(banco);
        const dados = carregarArquivoJson(arquivo);

        if (dados[chave]) {
            return res.status(400).json({ error: "Ocorrência já existe!" });
        }

        dados[chave] = descricao;
        fs.writeFileSync(arquivo, JSON.stringify(dados, null, 2), "utf8");
        res.status(200).json({ message: "Ocorrência adicionada com sucesso!" });
    } catch (error) {
        console.error("Erro ao adicionar ocorrência:", error);
        res.status(500).json({ error: "Erro interno ao adicionar a ocorrência." });
    }
});

app.get("/consultar-ocorrencia", (req, res) => {
    try {
        const { banco, chave } = req.query;

        if (!banco || !chave) {
            return res.status(400).json({ error: "Banco e chave são obrigatórios para consulta." });
        }

        const arquivo = obterCaminhoArquivoBanco(banco);

        const dados = carregarArquivoJson(arquivo);

        const descricao = dados[chave];
        if (!descricao) {
            return res.status(404).json({ error: "Ocorrência não encontrada." });
        }

        res.status(200).json({ chave, descricao });
    } catch (error) {
        console.error("Erro ao consultar ocorrência:", error);
        res.status(500).json({ error: "Erro interno ao consultar a ocorrência." });
    }
});


app.get("/comandos", (req, res) => {
    try {
        const caminhoArquivo = path.resolve(__dirname, "comandos.json");
        const comandos = carregarArquivoJson(caminhoArquivo);

        const comandosArray = Array.isArray(comandos)
            ? comandos
            : Object.entries(comandos).map(([numero, descricao]) => ({
                  numero,
                  descricao,
              }));

        res.status(200).json(comandosArray);
    } catch (error) {
        console.error("Erro ao carregar comandos:", error);
        res.status(500).json({ error: "Erro ao carregar comandos bancários." });
    }
});

app.get("/todas-ocorrencias", (req, res) => {
    try {
        const { banco } = req.query;

        if (!banco) {
            return res.status(400).json({ error: "Banco é obrigatório." });
        }

        const arquivo = obterCaminhoArquivoBanco(banco);
        const ocorrencias = carregarArquivoJson(arquivo);

        res.status(200).json(ocorrencias);
    } catch (error) {
        console.error("Erro ao carregar ocorrências:", error);
        res.status(500).json({ error: "Erro ao carregar ocorrências." });
    }
});

// Porta do servidor
const PORT = 5000;
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
