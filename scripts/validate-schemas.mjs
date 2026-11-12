import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';

const roots = [
  'execution',
  'simulation',
  'intent',
  'exporters',
  'diligence',
  'roi',
  'governance',
  'lifecycle',
  'data-plane',
];

async function schemasUnder(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(entries.map(async (entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? schemasUnder(path) : path.endsWith('.schema.json') ? [path] : [];
  }));
  return files.flat();
}

// Preserve the repository's existing draft-07 compatibility posture: these
// schemas predate Ajv's strictRequired rules, but formats are now validated.
const ajv = new Ajv({ allErrors: true, strict: false });
addFormats(ajv);
const files = (await Promise.all(roots.map(schemasUnder))).flat().sort();
const schemas = await Promise.all(files.map(async (file) => ({
  file,
  schema: JSON.parse(await readFile(file, 'utf8')),
})));

// Register every authority contract before compilation so versioned schemas can
// reuse definitions by absolute $id without weakening validation or duplicating
// the canonical result packet shape.
for (const { schema } of schemas) ajv.addSchema(schema);

for (const { file, schema } of schemas) {
  if (!ajv.getSchema(schema.$id)) throw new Error(`schema ${file} did not register`);
  console.log(`schema ${file} is valid`);
}

console.log(`validated ${files.length} authoritative schemas`);
