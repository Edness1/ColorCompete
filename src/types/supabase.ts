/**
 * Supabase-specific types have been removed. All data interactions now use the REST API
 * exposed under `/api`. If you still depend on Supabase typings, migrate those features to
 * the Express/Mongo models and delete the corresponding imports.
 */

export type SupabaseTypesRemoved = never;

export const SUPABASE_TYPES_REMOVED_MESSAGE =
  "Supabase has been removed from this project. Replace usage with REST/Mongo types.";
