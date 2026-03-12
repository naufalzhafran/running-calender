exports.up = (pgm) => {
  pgm.execute(`
    CREATE EXTENSION IF NOT EXISTS "pgcrypto";
  `);

  pgm.createTable('events', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: 'gen_random_uuid()',
    },
    title: {
      type: 'varchar(255)',
      notNull: true,
    },
    slug: {
      type: 'varchar(255)',
      notNull: true,
      unique: true,
    },
    event_date: {
      type: 'timestamp',
      notNull: true,
    },
    location: {
      type: 'varchar(255)',
      notNull: true,
    },
    distance: {
      type: 'varchar(50)',
      notNull: true,
    },
    description: {
      type: 'text',
    },
    created_at: {
      type: 'timestamp',
      default: 'NOW()',
    },
  });

  pgm.createTable('participants', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: 'gen_random_uuid()',
    },
    event_id: {
      type: 'uuid',
      notNull: true,
      references: '"events"(id)',
      onDelete: 'CASCADE',
    },
    name: {
      type: 'varchar(255)',
      notNull: true,
    },
    bib_number: {
      type: 'varchar(50)',
    },
    distance: {
      type: 'varchar(50)',
    },
    created_at: {
      type: 'timestamp',
      default: 'NOW()',
    },
  });
};

exports.down = (pgm) => {
  pgm.dropTable('participants');
  pgm.dropTable('events');
  pgm.execute('DROP EXTENSION IF EXISTS "pgcrypto"');
};
