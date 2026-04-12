export const up = (pgm) => {
  pgm.createTable('valor_hora_base', {
    vh_id: 'id',
    vh_cli_id: { 
      type: 'integer', 
      notNull: true, 
      references: 'cliente',
      onDelete: 'CASCADE'
    },
    vh_valor: { type: 'numeric(10, 2)', notNull: true },
    vh_mes_inicio: { type: 'date', notNull: true },
    vh_ativo: { type: 'boolean', default: true },
  });

  // Create unique index for active value per client
  pgm.createIndex('valor_hora_base', 'vh_cli_id', {
    name: 'idx_vh_ativo_cli',
    unique: true,
    where: 'vh_ativo = TRUE'
  });
};

export const down = (pgm) => {
  pgm.dropIndex('valor_hora_base', 'vh_cli_id', { name: 'idx_vh_ativo_cli' });
  pgm.dropTable('valor_hora_base');
};
