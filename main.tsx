import React from 'react'
import { createRoot } from "react-dom/client"
import App from "./app.tsx"
import parquet from "./userdata1.parquet?base64"
// https://www.jsdelivr.com/package/npm/@duckdb/duckdb-wasm
const root = createRoot(document.getElementById("root"))

import * as duckdb from '@duckdb/duckdb-wasm';
const JSDELIVR_BUNDLES = duckdb.getJsDelivrBundles();

// Select a bundle based on browser checks
const bundle = await duckdb.selectBundle(JSDELIVR_BUNDLES);

const worker_url = URL.createObjectURL(
    new Blob([`importScripts("${bundle.mainWorker!}");`], { type: 'text/javascript' })
);

// Instantiate the asynchronus version of DuckDB-wasm
const worker = new Worker(worker_url);
const logger = new duckdb.ConsoleLogger();
const db = new duckdb.AsyncDuckDB(logger, worker);
await db.instantiate(bundle.mainModule, bundle.pthreadWorker);
URL.revokeObjectURL(worker_url);

await db.registerFileBuffer('users.parquet', Uint8Array.from(atob(parquet), c => c.charCodeAt(0)));
const conn = await db.connect();

console.log(conn);
root.render(<App conn={conn} />)

// await c.close();
