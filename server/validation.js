"use strict";

const MAX_MESSAGE_SIZE = 16384;
const MAX_NAME_LENGTH = 14;
const MAX_ROOM_CODE_LENGTH = 6;
const WORLD_SIZE = 2400;

const MESSAGE_SCHEMAS = {
  join: {
    required: ["type", "roomCode", "name"],
    optional: ["classId", "skinId", "skillIds", "token"],
    validate(msg) {
      if (typeof msg.roomCode !== "string" || msg.roomCode.length !== MAX_ROOM_CODE_LENGTH) return "Código de sala inválido.";
      if (!/^[A-Z0-9]{6}$/.test(msg.roomCode)) return "Código de sala deve conter apenas letras maiúsculas e números.";
      if (typeof msg.name !== "string" || msg.name.length < 1 || msg.name.length > MAX_NAME_LENGTH) return "Nome inválido.";
      if (msg.classId && typeof msg.classId !== "string") return "Classe inválida.";
      if (msg.skinId && typeof msg.skinId !== "string") return "Skin inválida.";
      if (msg.skillIds && !Array.isArray(msg.skillIds)) return "Habilidades inválidas.";
      if (msg.token && typeof msg.token !== "string") return "Token inválido.";
      return null;
    }
  },
  input: {
    required: ["type", "sequence"],
    optional: ["targetX", "targetY", "moteRevision"],
    validate(msg) {
      const seq = Number(msg.sequence);
      if (!Number.isInteger(seq) || seq < 0 || seq > 9999999) return "Sequência inválida.";
      if (msg.targetX != null && (typeof msg.targetX !== "number" || msg.targetX < 0 || msg.targetX > WORLD_SIZE)) return "Posição X inválida.";
      if (msg.targetY != null && (typeof msg.targetY !== "number" || msg.targetY < 0 || msg.targetY > WORLD_SIZE)) return "Posição Y inválida.";
      if (msg.moteRevision != null && (!Number.isInteger(msg.moteRevision) || msg.moteRevision < 0)) return "Revisão inválida.";
      return null;
    }
  },
  phase_begin: { required: ["type"], optional: [], validate: () => null },
  phase_end: { required: ["type"], optional: [], validate: () => null },
  primary_begin: { required: ["type"], optional: [], validate: () => null },
  primary_end: { required: ["type"], optional: [], validate: () => null },
  class_special: { required: ["type"], optional: [], validate: () => null },
  ping: {
    required: ["type"],
    optional: ["clientTime"],
    validate(msg) {
      if (msg.clientTime != null && typeof msg.clientTime !== "number") return "Timestamp inválido.";
      return null;
    }
  },
  reconnect: {
    required: ["type", "matchId", "playerId"],
    optional: ["token"],
    validate(msg) {
      if (typeof msg.matchId !== "string" || msg.matchId.length < 1) return "matchId inválido.";
      if (typeof msg.playerId !== "string" || msg.playerId.length < 1) return "playerId inválido.";
      if (msg.token && typeof msg.token !== "string") return "Token inválido.";
      return null;
    }
  }
};

const ALLOWED_TYPES = new Set(Object.keys(MESSAGE_SCHEMAS));

function validateMessage(raw) {
  if (!raw || typeof raw !== "object") return { error: "Mensagem inválida." };
  const rawSize = JSON.stringify(raw).length;
  if (rawSize > MAX_MESSAGE_SIZE) return { error: "Mensagem excede tamanho máximo." };

  const type = raw.type;
  if (!type || typeof type !== "string") return { error: "Tipo de mensagem ausente." };
  if (!ALLOWED_TYPES.has(type)) return { error: `Tipo de mensagem desconhecido: ${type}` };

  const schema = MESSAGE_SCHEMAS[type];
  for (const field of schema.required) {
    if (raw[field] === undefined || raw[field] === null) return { error: `Campo obrigatório ausente: ${field}` };
  }

  const error = schema.validate(raw);
  if (error) return { error };

  return { valid: true, type };
}

function validateSequence(expected, received) {
  const seq = Number(received);
  if (!Number.isInteger(seq)) return false;
  if (seq < expected - 10) return false;
  if (seq <= expected) return false;
  return true;
}

module.exports = {
  validateMessage,
  validateSequence,
  MAX_MESSAGE_SIZE,
  ALLOWED_TYPES,
  WORLD_SIZE
};
