import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitDatabase1744927820537 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // создание таблицы users
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // создание таблицы articles
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS articles (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        publication_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        author_id INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT FK_articles_users FOREIGN KEY (author_id) 
        REFERENCES users(id) ON DELETE CASCADE
      );
    `);

    // индексация users
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS IDX_articles_author ON articles(author_id);
    `);

    // индексация articles
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS IDX_articles_publication_date 
      ON articles(publication_date);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'DROP INDEX IF EXISTS IDX_articles_publication_date',
    );
    await queryRunner.query('DROP INDEX IF EXISTS IDX_articles_author');
    await queryRunner.query('DROP TABLE IF EXISTS articles');
    await queryRunner.query('DROP TABLE IF EXISTS users');
  }
}
