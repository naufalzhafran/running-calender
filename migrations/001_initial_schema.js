exports.up = (pgm) => {
  pgm.createExtension('pgcrypto', { ifNotExists: true });

  pgm.createTable('events', {
    id: {
      type: 'uuid',
      primaryKey: true,
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

  pgm.sql(`ALTER TABLE "events" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()`);

  pgm.createTable('participants', {
    id: {
      type: 'uuid',
      primaryKey: true,
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

  pgm.sql(`ALTER TABLE "participants" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()`);
};

exports.down = (pgm) => {
  pgm.dropTable('participants');
  pgm.dropTable('events');
  pgm.dropExtension('pgcrypto', { ifExists: true });
};
