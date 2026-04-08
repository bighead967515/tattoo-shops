/**
 * Production entry point.
 * The fully-configured server (middleware, tRPC, static files, graceful shutdown)
 * is initialised by _core/index.ts when it is imported.
 * This file simply triggers that import so the module executes.
 */
import "./_core/index";
