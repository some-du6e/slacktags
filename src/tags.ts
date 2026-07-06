const DEVELOPMENT = process.env.DEVELOPMENT === "1";
import { Database } from "bun:sqlite";
import type { Tag } from "./types";



let option = ":memory:"
if (!DEVELOPMENT) {
    option = "tags.db";
}

const db = new Database(option);

db.query(`
  CREATE TABLE IF NOT EXISTS tags (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tag TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TEXT NOT NULL,
    creator TEXT NOT NULL,
    personal BOOLEAN NOT NULL,
    formatting TEXT
  );
`).run();

const insertTag = db.query(`
  INSERT INTO tags (tag, content, created_at, creator, personal, formatting)
  VALUES ($tag, $content, $created_at, $creator, $personal, $formatting);
`);

function addTag(tag: Tag) {
    insertTag.run({
        $tag: tag.tag,
        $content: tag.content,
        $created_at: tag.created_at,
        $creator: tag.creator,
        $personal: tag.personal ? 1 : 0,
        $formatting: tag.formatting ?? null
    });
}

function getTag(tagName: string): Tag | null {
    const row = db.query("SELECT * FROM tags WHERE tag = $tag;").get({ $tag: tagName }) as Tag | null;
    if (!row) return null;
    return {
        tag: row.tag,
        content: row.content,
        created_at: row.created_at,
        creator: row.creator,
        personal: !!row.personal,
        formatting: row.formatting
    };
}

export { addTag, getTag };
