import path from "node:path";
import { fileURLToPath } from "node:url";
import { existsSync } from "node:fs";
import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import multer from "multer";
import axios from "axios";
import { Pool } from "pg";
import { z } from "zod";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");
const distDir = path.join(projectRoot, "dist");

const env = {
  PORT: Number(process.env.PORT || 3000),
  DATABASE_URL: process.env.DATABASE_URL || "",
  EVOLUTION_API_URL: process.env.EVOLUTION_API_URL || "",
  EVOLUTION_API_KEY: process.env.EVOLUTION_API_KEY || "",
  EVOLUTION_INSTANCE_NAME: process.env.EVOLUTION_INSTANCE_NAME || "bot-boletos",
  N8N_URL: process.env.N8N_URL || "",
  PDF_STORAGE_PATH: process.env.PDF_STORAGE_PATH || "/pdfs"
};

if (!env.DATABASE_URL) {
  throw new Error("DATABASE_URL nao configurada");
}

const pool = new Pool({
  connectionString: env.DATABASE_URL
});

const app = express();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 12 * 1024 * 1024
  }
});

app.use(cors());
app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ extended: true }));

function normalizePhone(phone) {
  return String(phone || "").replace(/\D/g, "");
}

function sanitizeFileName(fileName) {
  return fileName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]/g, "-")
    .replace(/-+/g, "-")
    .toLowerCase();
}

function formatMesLabel(mesRef) {
  const [year, month] = String(mesRef || "").split("-");
  if (!year || !month) {
    return mesRef;
  }

  const meses = {
    "01": "Janeiro",
    "02": "Fevereiro",
    "03": "Marco",
    "04": "Abril",
    "05": "Maio",
    "06": "Junho",
    "07": "Julho",
    "08": "Agosto",
    "09": "Setembro",
    "10": "Outubro",
    "11": "Novembro",
    "12": "Dezembro"
  };

  return `${meses[month] || month}/${year}`;
}

async function sendText(number, text) {
  if (!env.EVOLUTION_API_URL || !env.EVOLUTION_API_KEY) {
    throw new Error("Evolution API nao configurada");
  }

  const url = `${env.EVOLUTION_API_URL}/message/sendText/${env.EVOLUTION_INSTANCE_NAME}`;
  const response = await axios.post(
    url,
    {
      number,
      text
    },
    {
      headers: {
        apikey: env.EVOLUTION_API_KEY,
        "Content-Type": "application/json"
      },
      timeout: 30000
    }
  );

  return response.data;
}

async function sendMedia({ number, base64, fileName, caption }) {
  if (!env.EVOLUTION_API_URL || !env.EVOLUTION_API_KEY) {
    throw new Error("Evolution API nao configurada");
  }

  const url = `${env.EVOLUTION_API_URL}/message/sendMedia/${env.EVOLUTION_INSTANCE_NAME}`;
  const response = await axios.post(
    url,
    {
      number,
      mediatype: "document",
      mimetype: "application/pdf",
      caption,
      media: base64,
      fileName
    },
    {
      headers: {
        apikey: env.EVOLUTION_API_KEY,
        "Content-Type": "application/json"
      },
      timeout: 60000
    }
  );

  return response.data;
}

async function logMessage({ contatoId, direcao, conteudo, tipo = "texto", arquivoPath = null }) {
  await pool.query(
    `
      INSERT INTO mensagens (contato_id, direcao, conteudo, tipo, arquivo_path)
      VALUES ($1, $2, $3, $4, $5)
    `,
    [contatoId, direcao, conteudo, tipo, arquivoPath]
  );
}

function handleError(res, error, defaultMessage) {
  const message = error?.message || defaultMessage;
  return res.status(500).json({ success: false, message });
}

app.get("/api/health", (_req, res) => {
  return res.json({ status: "ok", service: "painel-web-api" });
});

app.get("/api/conversas", async (_req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT
        c.id,
        c.nome,
        c.numero_whatsapp,
        c.tipo,
        c.bot_ativo,
        c.atualizado_em,
        m.conteudo AS ultima_mensagem,
        m.tipo AS ultimo_tipo,
        m.direcao AS ultima_direcao,
        m.enviado_em AS ultima_data
      FROM contatos c
      LEFT JOIN LATERAL (
        SELECT conteudo, tipo, direcao, enviado_em
        FROM mensagens
        WHERE contato_id = c.id
        ORDER BY enviado_em DESC
        LIMIT 1
      ) m ON TRUE
      ORDER BY COALESCE(m.enviado_em, c.atualizado_em, c.criado_em) DESC
    `);

    return res.json(rows);
  } catch (error) {
    return handleError(res, error, "Falha ao listar conversas");
  }
});

app.get("/api/conversas/:id/mensagens", async (req, res) => {
  try {
    const schema = z.object({ id: z.string().uuid() });
    const { id } = schema.parse(req.params);

    const { rows } = await pool.query(
      `
        SELECT id, contato_id, direcao, conteudo, tipo, arquivo_path, enviado_em, lido
        FROM mensagens
        WHERE contato_id = $1
        ORDER BY enviado_em ASC
      `,
      [id]
    );

    return res.json(rows);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, message: "Contato invalido" });
    }
    return handleError(res, error, "Falha ao listar mensagens");
  }
});

app.post("/api/conversas/:id/mensagem", async (req, res) => {
  try {
    const paramsSchema = z.object({ id: z.string().uuid() });
    const bodySchema = z.object({
      mensagem: z.string().min(1, "Mensagem obrigatoria")
    });

    const { id } = paramsSchema.parse(req.params);
    const { mensagem } = bodySchema.parse(req.body);

    const contatoResult = await pool.query(
      `SELECT id, numero_whatsapp FROM contatos WHERE id = $1 LIMIT 1`,
      [id]
    );

    if (!contatoResult.rowCount) {
      return res.status(404).json({ success: false, message: "Contato nao encontrado" });
    }

    const contato = contatoResult.rows[0];
    await sendText(contato.numero_whatsapp, mensagem);
    await logMessage({
      contatoId: id,
      direcao: "saida",
      conteudo: mensagem,
      tipo: "texto"
    });

    return res.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, message: error.issues[0]?.message || "Dados invalidos" });
    }
    return handleError(res, error, "Falha ao enviar mensagem");
  }
});

app.get("/api/clientes", async (req, res) => {
  try {
    const tipo = req.query.tipo;
    const params = [];
    let sql = `
      SELECT id, nome, numero_whatsapp, tipo, bot_ativo, criado_em, atualizado_em
      FROM contatos
    `;

    if (tipo === "cliente" || tipo === "gerente") {
      params.push(tipo);
      sql += ` WHERE tipo = $1`;
    }

    sql += " ORDER BY nome ASC";
    const { rows } = await pool.query(sql, params);
    return res.json(rows);
  } catch (error) {
    return handleError(res, error, "Falha ao listar clientes");
  }
});

app.post("/api/clientes", async (req, res) => {
  try {
    const schema = z.object({
      nome: z.string().min(3),
      numero_whatsapp: z.string().min(10),
      tipo: z.enum(["cliente", "gerente"]),
      bot_ativo: z.boolean().optional().default(true)
    });

    const parsed = schema.parse(req.body);
    const numeroNormalizado = normalizePhone(parsed.numero_whatsapp);

    const { rows } = await pool.query(
      `
        INSERT INTO contatos (nome, numero_whatsapp, tipo, bot_ativo)
        VALUES ($1, $2, $3, $4)
        RETURNING id, nome, numero_whatsapp, tipo, bot_ativo, criado_em, atualizado_em
      `,
      [parsed.nome, numeroNormalizado, parsed.tipo, parsed.bot_ativo]
    );

    return res.status(201).json(rows[0]);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, message: error.issues[0]?.message || "Dados invalidos" });
    }
    return handleError(res, error, "Falha ao cadastrar cliente");
  }
});

app.put("/api/clientes/:id", async (req, res) => {
  try {
    const paramsSchema = z.object({ id: z.string().uuid() });
    const bodySchema = z.object({
      nome: z.string().min(3),
      numero_whatsapp: z.string().min(10),
      tipo: z.enum(["cliente", "gerente"]),
      bot_ativo: z.boolean()
    });

    const { id } = paramsSchema.parse(req.params);
    const parsed = bodySchema.parse(req.body);

    const { rows } = await pool.query(
      `
        UPDATE contatos
        SET nome = $1,
            numero_whatsapp = $2,
            tipo = $3,
            bot_ativo = $4,
            atualizado_em = NOW()
        WHERE id = $5
        RETURNING id, nome, numero_whatsapp, tipo, bot_ativo, criado_em, atualizado_em
      `,
      [parsed.nome, normalizePhone(parsed.numero_whatsapp), parsed.tipo, parsed.bot_ativo, id]
    );

    if (!rows.length) {
      return res.status(404).json({ success: false, message: "Cliente nao encontrado" });
    }

    return res.json(rows[0]);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, message: error.issues[0]?.message || "Dados invalidos" });
    }
    return handleError(res, error, "Falha ao atualizar cliente");
  }
});

app.delete("/api/clientes/:id", async (req, res) => {
  try {
    const schema = z.object({ id: z.string().uuid() });
    const { id } = schema.parse(req.params);

    const result = await pool.query("DELETE FROM contatos WHERE id = $1", [id]);
    if (!result.rowCount) {
      return res.status(404).json({ success: false, message: "Cliente nao encontrado" });
    }

    return res.status(204).send();
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, message: "ID invalido" });
    }
    return handleError(res, error, "Falha ao remover cliente");
  }
});

app.get("/api/boletos", async (req, res) => {
  try {
    const params = [];
    const filters = [];

    if (req.query.mes) {
      params.push(req.query.mes);
      filters.push(`b.mes_referencia = $${params.length}`);
    }
    if (req.query.status) {
      params.push(req.query.status);
      filters.push(`b.status = $${params.length}`);
    }

    const whereClause = filters.length ? `WHERE ${filters.join(" AND ")}` : "";
    const { rows } = await pool.query(
      `
        SELECT
          b.id,
          b.contato_id,
          c.nome AS cliente_nome,
          c.numero_whatsapp,
          b.mes_referencia,
          b.arquivo_path,
          b.arquivo_nome,
          b.status,
          b.enviado_em,
          b.criado_em
        FROM boletos b
        JOIN contatos c ON c.id = b.contato_id
        ${whereClause}
        ORDER BY b.criado_em DESC
      `,
      params
    );

    return res.json(rows);
  } catch (error) {
    return handleError(res, error, "Falha ao listar boletos");
  }
});

app.post("/api/boletos", upload.single("arquivo"), async (req, res) => {
  try {
    const schema = z.object({
      contato_id: z.string().uuid(),
      mes_referencia: z.string().regex(/^\d{4}-\d{2}$/)
    });
    const parsed = schema.parse(req.body);

    if (!req.file) {
      return res.status(400).json({ success: false, message: "Arquivo PDF obrigatorio" });
    }

    const original = req.file.originalname || "boleto.pdf";
    const baseName = sanitizeFileName(original.replace(/\.pdf$/i, ""));
    const finalName = `${Date.now()}-${baseName || "boleto"}.pdf`;
    const folderPath = path.join(env.PDF_STORAGE_PATH, parsed.contato_id, parsed.mes_referencia);
    const finalPath = path.join(folderPath, finalName);

    await mkdir(folderPath, { recursive: true });
    await writeFile(finalPath, req.file.buffer);

    const { rows } = await pool.query(
      `
        INSERT INTO boletos (contato_id, mes_referencia, arquivo_path, arquivo_nome, status)
        VALUES ($1, $2, $3, $4, 'pendente')
        RETURNING id, contato_id, mes_referencia, arquivo_path, arquivo_nome, status, criado_em
      `,
      [parsed.contato_id, parsed.mes_referencia, finalPath, finalName]
    );

    return res.status(201).json(rows[0]);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, message: "Dados invalidos" });
    }
    return handleError(res, error, "Falha ao cadastrar boleto");
  }
});

app.post("/api/boletos/:id/enviar", async (req, res) => {
  try {
    const schema = z.object({ id: z.string().uuid() });
    const { id } = schema.parse(req.params);

    const boletoResult = await pool.query(
      `
        SELECT b.*, c.nome AS contato_nome, c.numero_whatsapp
        FROM boletos b
        JOIN contatos c ON c.id = b.contato_id
        WHERE b.id = $1
        LIMIT 1
      `,
      [id]
    );

    if (!boletoResult.rowCount) {
      return res.status(404).json({ success: false, message: "Boleto nao encontrado" });
    }

    const boleto = boletoResult.rows[0];
    const configResult = await pool.query(
      `
        SELECT mensagem_boleto_template
        FROM configuracao_bot
        WHERE ativo = true
        ORDER BY atualizado_em DESC
        LIMIT 1
      `
    );

    const template =
      configResult.rows[0]?.mensagem_boleto_template ||
      "Ola, {{nome}}. Segue seu boleto de {{mes}}.";

    const caption = template
      .replace(/\{\{nome\}\}/g, boleto.contato_nome)
      .replace(/\{\{mes\}\}/g, formatMesLabel(boleto.mes_referencia));

    const binary = await readFile(boleto.arquivo_path);
    const base64 = binary.toString("base64");

    await sendMedia({
      number: boleto.numero_whatsapp,
      base64,
      fileName: boleto.arquivo_nome,
      caption
    });

    await pool.query(
      `
        UPDATE boletos
        SET status = 'enviado',
            enviado_em = NOW()
        WHERE id = $1
      `,
      [id]
    );

    await logMessage({
      contatoId: boleto.contato_id,
      direcao: "saida",
      conteudo: caption,
      tipo: "documento",
      arquivoPath: boleto.arquivo_path
    });

    if (env.N8N_URL) {
      try {
        await axios.post(
          `${env.N8N_URL}/webhook/boleto-enviado`,
          {
            boleto_id: boleto.id,
            contato_id: boleto.contato_id
          },
          { timeout: 10000 }
        );
      } catch (error) {
        console.warn("Falha ao notificar N8N sobre envio de boleto", error.message);
      }
    }

    return res.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, message: "ID invalido" });
    }
    await pool.query(
      `
        UPDATE boletos
        SET status = 'erro'
        WHERE id = $1
      `,
      [req.params.id]
    );
    return handleError(res, error, "Falha ao enviar boleto");
  }
});

app.delete("/api/boletos/:id", async (req, res) => {
  try {
    const schema = z.object({ id: z.string().uuid() });
    const { id } = schema.parse(req.params);

    const boletoResult = await pool.query(
      `SELECT arquivo_path FROM boletos WHERE id = $1 LIMIT 1`,
      [id]
    );

    if (!boletoResult.rowCount) {
      return res.status(404).json({ success: false, message: "Boleto nao encontrado" });
    }

    const arquivoPath = boletoResult.rows[0].arquivo_path;
    await pool.query(`DELETE FROM boletos WHERE id = $1`, [id]);

    if (arquivoPath && existsSync(arquivoPath)) {
      await unlink(arquivoPath);
    }

    return res.status(204).send();
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, message: "ID invalido" });
    }
    return handleError(res, error, "Falha ao remover boleto");
  }
});

app.get("/api/configuracao", async (_req, res) => {
  try {
    const { rows } = await pool.query(
      `
        SELECT
          id,
          nome_persona,
          system_prompt,
          instrucoes_restricao,
          mensagem_boleto_template,
          mensagem_lembrete_template,
          ativo,
          atualizado_em
        FROM configuracao_bot
        WHERE ativo = true
        ORDER BY atualizado_em DESC
        LIMIT 1
      `
    );

    if (!rows.length) {
      return res.json(null);
    }

    return res.json(rows[0]);
  } catch (error) {
    return handleError(res, error, "Falha ao buscar configuracao");
  }
});

app.put("/api/configuracao", async (req, res) => {
  const client = await pool.connect();
  try {
    const schema = z.object({
      nome_persona: z.string().min(2),
      system_prompt: z.string().min(10),
      instrucoes_restricao: z.string().optional().default(""),
      mensagem_boleto_template: z.string().optional().default("Ola, {{nome}}. Segue seu boleto de {{mes}}."),
      mensagem_lembrete_template: z.string().optional().default("Ola, {{nome}}. Seu boleto de {{mes}} segue pendente.")
    });
    const parsed = schema.parse(req.body);

    await client.query("BEGIN");
    await client.query("UPDATE configuracao_bot SET ativo = false");
    const inserted = await client.query(
      `
        INSERT INTO configuracao_bot (
          nome_persona,
          system_prompt,
          instrucoes_restricao,
          mensagem_boleto_template,
          mensagem_lembrete_template,
          ativo,
          atualizado_em
        )
        VALUES ($1, $2, $3, $4, $5, true, NOW())
        RETURNING *
      `,
      [
        parsed.nome_persona,
        parsed.system_prompt,
        parsed.instrucoes_restricao,
        parsed.mensagem_boleto_template,
        parsed.mensagem_lembrete_template
      ]
    );
    await client.query("COMMIT");

    return res.json(inserted.rows[0]);
  } catch (error) {
    await client.query("ROLLBACK");
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, message: "Dados invalidos" });
    }
    return handleError(res, error, "Falha ao salvar configuracao");
  } finally {
    client.release();
  }
});

app.get("/api/gerentes", async (_req, res) => {
  try {
    const { rows } = await pool.query(
      `
        SELECT id, nome, numero_whatsapp, bot_ativo, criado_em, atualizado_em
        FROM contatos
        WHERE tipo = 'gerente'
        ORDER BY nome ASC
      `
    );

    return res.json(rows);
  } catch (error) {
    return handleError(res, error, "Falha ao listar gerentes");
  }
});

app.post("/api/bot-control", async (req, res) => {
  try {
    const schema = z.object({
      contato_id: z.string().uuid(),
      bot_ativo: z.boolean()
    });
    const parsed = schema.parse(req.body);

    const updateResult = await pool.query(
      `
        UPDATE contatos
        SET bot_ativo = $1,
            atualizado_em = NOW()
        WHERE id = $2
      `,
      [parsed.bot_ativo, parsed.contato_id]
    );

    if (!updateResult.rowCount) {
      return res.status(404).json({ success: false, message: "Contato nao encontrado" });
    }

    if (env.N8N_URL) {
      try {
        await axios.post(
          `${env.N8N_URL}/webhook/bot-control`,
          {
            contato_id: parsed.contato_id,
            bot_ativo: parsed.bot_ativo
          },
          {
            timeout: 10000
          }
        );
      } catch (error) {
        console.warn("Falha ao chamar webhook bot-control no N8N", error.message);
      }
    }

    return res.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, message: "Dados invalidos" });
    }
    return handleError(res, error, "Falha ao alterar status do bot");
  }
});

app.get("/api/alertas", async (_req, res) => {
  try {
    const { rows } = await pool.query(
      `
        SELECT
          a.id,
          a.gerente_id,
          c.nome AS gerente_nome,
          c.numero_whatsapp,
          a.tipo_alerta,
          a.conteudo,
          a.enviado_em
        FROM alertas_gerentes a
        LEFT JOIN contatos c ON c.id = a.gerente_id
        ORDER BY a.enviado_em DESC
        LIMIT 500
      `
    );

    return res.json(rows);
  } catch (error) {
    return handleError(res, error, "Falha ao listar alertas");
  }
});

if (existsSync(distDir)) {
  app.use(express.static(distDir));
  app.get(/^\/(?!api).*/, (_req, res) => {
    return res.sendFile(path.join(distDir, "index.html"));
  });
}

async function start() {
  await mkdir(env.PDF_STORAGE_PATH, { recursive: true });
  await pool.query("SELECT 1");

  app.listen(env.PORT, () => {
    console.log(`API do painel iniciada na porta ${env.PORT}`);
  });
}

start().catch((error) => {
  console.error("Erro fatal ao iniciar API", error);
  process.exit(1);
});
