CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS contatos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome VARCHAR(255) NOT NULL,
  numero_whatsapp VARCHAR(20) NOT NULL UNIQUE,
  tipo VARCHAR(10) NOT NULL CHECK (tipo IN ('cliente', 'gerente')),
  bot_ativo BOOLEAN DEFAULT true,
  criado_em TIMESTAMP DEFAULT NOW(),
  atualizado_em TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS boletos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contato_id UUID REFERENCES contatos(id) ON DELETE CASCADE,
  mes_referencia VARCHAR(7) NOT NULL,
  arquivo_path VARCHAR(500) NOT NULL,
  arquivo_nome VARCHAR(255) NOT NULL,
  status VARCHAR(20) DEFAULT 'pendente' CHECK (status IN ('pendente', 'enviado', 'erro')),
  enviado_em TIMESTAMP,
  criado_em TIMESTAMP DEFAULT NOW(),
  UNIQUE (contato_id, mes_referencia, arquivo_nome)
);

CREATE TABLE IF NOT EXISTS configuracao_bot (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome_persona VARCHAR(100) NOT NULL,
  system_prompt TEXT NOT NULL,
  instrucoes_restricao TEXT,
  mensagem_boleto_template TEXT,
  mensagem_lembrete_template TEXT,
  ativo BOOLEAN DEFAULT true,
  atualizado_em TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS mensagens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contato_id UUID REFERENCES contatos(id) ON DELETE CASCADE,
  direcao VARCHAR(10) NOT NULL CHECK (direcao IN ('entrada', 'saida')),
  conteudo TEXT,
  tipo VARCHAR(20) DEFAULT 'texto' CHECK (tipo IN ('texto', 'documento', 'imagem')),
  arquivo_path VARCHAR(500),
  enviado_em TIMESTAMP DEFAULT NOW(),
  lido BOOLEAN DEFAULT false
);

CREATE TABLE IF NOT EXISTS alertas_gerentes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gerente_id UUID REFERENCES contatos(id) ON DELETE SET NULL,
  tipo_alerta VARCHAR(50),
  conteudo TEXT,
  enviado_em TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_contatos_numero ON contatos(numero_whatsapp);
CREATE INDEX IF NOT EXISTS idx_contatos_tipo ON contatos(tipo);
CREATE INDEX IF NOT EXISTS idx_boletos_contato_mes ON boletos(contato_id, mes_referencia);
CREATE INDEX IF NOT EXISTS idx_boletos_status ON boletos(status);
CREATE INDEX IF NOT EXISTS idx_mensagens_contato_data ON mensagens(contato_id, enviado_em DESC);
CREATE INDEX IF NOT EXISTS idx_alertas_data ON alertas_gerentes(enviado_em DESC);

CREATE OR REPLACE FUNCTION atualizar_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.atualizado_em = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_contatos_atualizado_em ON contatos;
CREATE TRIGGER trg_contatos_atualizado_em
BEFORE UPDATE ON contatos
FOR EACH ROW
EXECUTE FUNCTION atualizar_timestamp();

DROP TRIGGER IF EXISTS trg_config_bot_atualizado_em ON configuracao_bot;
CREATE TRIGGER trg_config_bot_atualizado_em
BEFORE UPDATE ON configuracao_bot
FOR EACH ROW
EXECUTE FUNCTION atualizar_timestamp();
