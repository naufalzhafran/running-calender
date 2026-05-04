exports.up = (pgm) => {
  pgm.createExtension("pgcrypto", { ifNotExists: true });

  pgm.createTable("events", {
    id: {
      type: "uuid",
      primaryKey: true,
      default: pgm.func("gen_random_uuid()"),
    },
    title: {
      type: "varchar(255)",
      notNull: true,
    },
    slug: {
      type: "varchar(255)",
      notNull: true,
      unique: true,
    },
    event_date: {
      type: "timestamp",
      notNull: true,
    },
    end_date: {
      type: "timestamp",
    },
    location: {
      type: "varchar(255)",
      notNull: true,
    },
    distance: {
      type: "jsonb",
      notNull: true,
      default: "[]",
    },
    description: {
      type: "text",
    },
    created_at: {
      type: "timestamp",
      default: pgm.func("CURRENT_TIMESTAMP"),
    },
  });

  pgm.createTable("participants", {
    id: {
      type: "uuid",
      primaryKey: true,
      default: pgm.func("gen_random_uuid()"),
    },
    event_id: {
      type: "uuid",
      notNull: true,
      references: '"events"(id)',
      onDelete: "CASCADE",
    },
    name: {
      type: "varchar(255)",
      notNull: true,
    },
    bib_number: {
      type: "varchar(50)",
    },
    distance: {
      type: "varchar(50)",
    },
    created_at: {
      type: "timestamp",
      default: pgm.func("CURRENT_TIMESTAMP"),
    },
  });
};

exports.down = (pgm) => {
  pgm.dropTable("participants");
  pgm.dropTable("events");
  pgm.dropExtension("pgcrypto", { ifExists: true });
};
