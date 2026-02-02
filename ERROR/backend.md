PostgresError: relation "credit_packages" does not exist
 severity_local: "ERROR",
   severity: "ERROR",
   position: "199",
       file: "parse_relation.c",
    routine: "parserOpenTable",
       code: "42P01"

      at ErrorResponse (/Users/rockywang/Documents/projects/funmagic-ai/node_modules/.bun/postgres@3.4.8/node_modules/postgres/src/connection.js:815:30)
      at handle (/Users/rockywang/Documents/projects/funmagic-ai/node_modules/.bun/postgres@3.4.8/node_modules/postgres/src/connection.js:765:5)
      at data (/Users/rockywang/Documents/projects/funmagic-ai/node_modules/.bun/postgres@3.4.8/node_modules/postgres/src/connection.js:457:5)
      at emit (node:events:95:22)
      at addChunk (internal:streams/readable:264:47)
      at readableAddChunkPushByteMode (internal:streams/readable:242:18)
      at data (node:net:280:52)

--> GET /api/credits/packages 200 32ms
36 |   async queryWithCache(queryString, params, query) {
37 |     if (this.cache === void 0 || is(this.cache, NoopCache) || this.queryMetadata === void 0) {
38 |       try {
39 |         return await query();
40 |       } catch (e) {
41 |         throw new DrizzleQueryError(queryString, params, e);
                   ^
error: Failed query: select "id", "title", "description", "thumbnail", "link", "link_text", "link_target", "type", "position", "badge", "badge_color", "is_active", "starts_at", "ends_at", "created_at", "updated_at" from "banners" "banners" where ("banners"."is_active" = $1 and (("banners"."starts_at" is null and "banners"."ends_at" is null) or (("banners"."starts_at" is null or "banners"."starts_at" <= $2) and ("banners"."ends_at" is null or "banners"."ends_at" >= $3))) and "banners"."type" = $4) order by CASE WHEN "banners"."type" = 'main' THEN 0 ELSE 1 END asc, "banners"."position" asc
params: true,2026-02-02T12:30:51.464Z,2026-02-02T12:30:51.464Z,main
  query: "select \"id\", \"title\", \"description\", \"thumbnail\", \"link\", \"link_text\", \"link_target\", \"type\", \"position\", \"badge\", \"badge_color\", \"is_active\", \"starts_at\", \"ends_at\", \"created_at\", \"updated_at\" from \"banners\" \"banners\" where (\"banners\".\"is_active\" = $1 and ((\"banners\".\"starts_at\" is null and \"banners\".\"ends_at\" is null) or ((\"banners\".\"starts_at\" is null or \"banners\".\"starts_at\" <= $2) and (\"banners\".\"ends_at\" is null or \"banners\".\"ends_at\" >= $3))) and \"banners\".\"type\" = $4) order by CASE WHEN \"banners\".\"type\" = 'main' THEN 0 ELSE 1 END asc, \"banners\".\"position\" asc",
 params: [
  true, "2026-02-02T12:30:51.464Z", "2026-02-02T12:30:51.464Z", "main"
],

      at queryWithCache (/Users/rockywang/Documents/projects/funmagic-ai/node_modules/.bun/drizzle-orm@0.45.1+da96a2ffab12d2ab/node_modules/drizzle-orm/pg-core/session.js:41:15)

810 |   }
811 | 
812 |   function ErrorResponse(x) {
813 |     if (query) {
814 |       (query.cursorFn || query.describeFirst) && write(Sync)
815 |       errorResponse = Errors.postgres(parseError(x))
                                   ^
PostgresError: relation "banners" does not exist
 severity_local: "ERROR",
   severity: "ERROR",
   position: "200",
       file: "parse_relation.c",
    routine: "parserOpenTable",
       code: "42P01"

      at ErrorResponse (/Users/rockywang/Documents/projects/funmagic-ai/node_modules/.bun/postgres@3.4.8/node_modules/postgres/src/connection.js:815:30)
      at handle (/Users/rockywang/Documents/projects/funmagic-ai/node_modules/.bun/postgres@3.4.8/node_modules/postgres/src/connection.js:765:5)
      at data (/Users/rockywang/Documents/projects/funmagic-ai/node_modules/.bun/postgres@3.4.8/node_modules/postgres/src/connection.js:457:5)
      at emit (node:events:95:22)
      at addChunk (internal:streams/readable:264:47)
      at readableAddChunkPushByteMode (internal:streams/readable:242:18)
      at data (node:net:280:52)

--> GET /api/banners?type=main 500 36ms
<-- GET /api/tools
<-- GET /api/banners?type=main
Failed to fetch tools: 36 |   async queryWithCache(queryString, params, query) {
37 |     if (this.cache === void 0 || is(this.cache, NoopCache) || this.queryMetadata === void 0) {
38 |       try {
39 |         return await query();
40 |       } catch (e) {
41 |         throw new DrizzleQueryError(queryString, params, e);
                   ^
error: Failed query: select "id", "name", "display_name", "description", "icon", "color", "is_active", "sort_order", "created_at", "updated_at" from "tool_types" "toolTypes"
params: 
  query: "select \"id\", \"name\", \"display_name\", \"description\", \"icon\", \"color\", \"is_active\", \"sort_order\", \"created_at\", \"updated_at\" from \"tool_types\" \"toolTypes\"",
 params: [],

      at queryWithCache (/Users/rockywang/Documents/projects/funmagic-ai/node_modules/.bun/drizzle-orm@0.45.1+da96a2ffab12d2ab/node_modules/drizzle-orm/pg-core/session.js:41:15)

810 |   }
811 | 
812 |   function ErrorResponse(x) {
813 |     if (query) {
814 |       (query.cursorFn || query.describeFirst) && write(Sync)
815 |       errorResponse = Errors.postgres(parseError(x))
                                   ^
PostgresError: relation "tool_types" does not exist
 severity_local: "ERROR",
   severity: "ERROR",
   position: "129",
       file: "parse_relation.c",
    routine: "parserOpenTable",
       code: "42P01"

      at ErrorResponse (/Users/rockywang/Documents/projects/funmagic-ai/node_modules/.bun/postgres@3.4.8/node_modules/postgres/src/connection.js:815:30)
      at handle (/Users/rockywang/Documents/projects/funmagic-ai/node_modules/.bun/postgres@3.4.8/node_modules/postgres/src/connection.js:765:5)
      at data (/Users/rockywang/Documents/projects/funmagic-ai/node_modules/.bun/postgres@3.4.8/node_modules/postgres/src/connection.js:457:5)
      at emit (node:events:95:22)
      at addChunk (internal:streams/readable:264:47)
      at readableAddChunkPushByteMode (internal:streams/readable:242:18)
      at data (node:net:280:52)

--> GET /api/tools 200 13ms
36 |   async queryWithCache(queryString, params, query) {
37 |     if (this.cache === void 0 || is(this.cache, NoopCache) || this.queryMetadata === void 0) {
38 |       try {
39 |         return await query();
40 |       } catch (e) {
41 |         throw new DrizzleQueryError(queryString, params, e);
                   ^
error: Failed query: select "id", "title", "description", "thumbnail", "link", "link_text", "link_target", "type", "position", "badge", "badge_color", "is_active", "starts_at", "ends_at", "created_at", "updated_at" from "banners" "banners" where ("banners"."is_active" = $1 and (("banners"."starts_at" is null and "banners"."ends_at" is null) or (("banners"."starts_at" is null or "banners"."starts_at" <= $2) and ("banners"."ends_at" is null or "banners"."ends_at" >= $3))) and "banners"."type" = $4) order by CASE WHEN "banners"."type" = 'main' THEN 0 ELSE 1 END asc, "banners"."position" asc
params: true,2026-02-02T12:33:46.199Z,2026-02-02T12:33:46.199Z,main
  query: "select \"id\", \"title\", \"description\", \"thumbnail\", \"link\", \"link_text\", \"link_target\", \"type\", \"position\", \"badge\", \"badge_color\", \"is_active\", \"starts_at\", \"ends_at\", \"created_at\", \"updated_at\" from \"banners\" \"banners\" where (\"banners\".\"is_active\" = $1 and ((\"banners\".\"starts_at\" is null and \"banners\".\"ends_at\" is null) or ((\"banners\".\"starts_at\" is null or \"banners\".\"starts_at\" <= $2) and (\"banners\".\"ends_at\" is null or \"banners\".\"ends_at\" >= $3))) and \"banners\".\"type\" = $4) order by CASE WHEN \"banners\".\"type\" = 'main' THEN 0 ELSE 1 END asc, \"banners\".\"position\" asc",
 params: [
  true, "2026-02-02T12:33:46.199Z", "2026-02-02T12:33:46.199Z", "main"
],

      at queryWithCache (/Users/rockywang/Documents/projects/funmagic-ai/node_modules/.bun/drizzle-orm@0.45.1+da96a2ffab12d2ab/node_modules/drizzle-orm/pg-core/session.js:41:15)

810 |   }
811 | 
812 |   function ErrorResponse(x) {
813 |     if (query) {
814 |       (query.cursorFn || query.describeFirst) && write(Sync)
815 |       errorResponse = Errors.postgres(parseError(x))
                                   ^
PostgresError: relation "banners" does not exist
 severity_local: "ERROR",
   severity: "ERROR",
   position: "200",
       file: "parse_relation.c",
    routine: "parserOpenTable",
       code: "42P01"

      at ErrorResponse (/Users/rockywang/Documents/projects/funmagic-ai/node_modules/.bun/postgres@3.4.8/node_modules/postgres/src/connection.js:815:30)
      at handle (/Users/rockywang/Documents/projects/funmagic-ai/node_modules/.bun/postgres@3.4.8/node_modules/postgres/src/connection.js:765:5)
      at data (/Users/rockywang/Documents/projects/funmagic-ai/node_modules/.bun/postgres@3.4.8/node_modules/postgres/src/connection.js:457:5)
      at emit (node:events:95:22)
      at addChunk (internal:streams/readable:264:47)
      at readableAddChunkPushByteMode (internal:streams/readable:242:18)
      at data (node:net:280:52)

--> GET /api/banners?type=main 500 9ms
<-- GET /api/tools
<-- GET /api/banners?type=main
Failed to fetch tools: 36 |   async queryWithCache(queryString, params, query) {
37 |     if (this.cache === void 0 || is(this.cache, NoopCache) || this.queryMetadata === void 0) {
38 |       try {
39 |         return await query();
40 |       } catch (e) {
41 |         throw new DrizzleQueryError(queryString, params, e);
                   ^
error: Failed query: select "id", "name", "display_name", "description", "icon", "color", "is_active", "sort_order", "created_at", "updated_at" from "tool_types" "toolTypes"
params: 
  query: "select \"id\", \"name\", \"display_name\", \"description\", \"icon\", \"color\", \"is_active\", \"sort_order\", \"created_at\", \"updated_at\" from \"tool_types\" \"toolTypes\"",
 params: [],

      at queryWithCache (/Users/rockywang/Documents/projects/funmagic-ai/node_modules/.bun/drizzle-orm@0.45.1+da96a2ffab12d2ab/node_modules/drizzle-orm/pg-core/session.js:41:15)

810 |   }
811 | 
812 |   function ErrorResponse(x) {
813 |     if (query) {
814 |       (query.cursorFn || query.describeFirst) && write(Sync)
815 |       errorResponse = Errors.postgres(parseError(x))
                                   ^
PostgresError: relation "tool_types" does not exist
 severity_local: "ERROR",
   severity: "ERROR",
   position: "129",
       file: "parse_relation.c",
    routine: "parserOpenTable",
       code: "42P01"

      at ErrorResponse (/Users/rockywang/Documents/projects/funmagic-ai/node_modules/.bun/postgres@3.4.8/node_modules/postgres/src/connection.js:815:30)
      at handle (/Users/rockywang/Documents/projects/funmagic-ai/node_modules/.bun/postgres@3.4.8/node_modules/postgres/src/connection.js:765:5)
      at data (/Users/rockywang/Documents/projects/funmagic-ai/node_modules/.bun/postgres@3.4.8/node_modules/postgres/src/connection.js:457:5)
      at emit (node:events:95:22)
      at addChunk (internal:streams/readable:264:47)
      at readableAddChunkPushByteMode (internal:streams/readable:242:18)
      at data (node:net:280:52)

--> GET /api/tools 200 4ms
36 |   async queryWithCache(queryString, params, query) {
37 |     if (this.cache === void 0 || is(this.cache, NoopCache) || this.queryMetadata === void 0) {
38 |       try {
39 |         return await query();
40 |       } catch (e) {
41 |         throw new DrizzleQueryError(queryString, params, e);
                   ^
error: Failed query: select "id", "title", "description", "thumbnail", "link", "link_text", "link_target", "type", "position", "badge", "badge_color", "is_active", "starts_at", "ends_at", "created_at", "updated_at" from "banners" "banners" where ("banners"."is_active" = $1 and (("banners"."starts_at" is null and "banners"."ends_at" is null) or (("banners"."starts_at" is null or "banners"."starts_at" <= $2) and ("banners"."ends_at" is null or "banners"."ends_at" >= $3))) and "banners"."type" = $4) order by CASE WHEN "banners"."type" = 'main' THEN 0 ELSE 1 END asc, "banners"."position" asc
params: true,2026-02-02T12:34:11.216Z,2026-02-02T12:34:11.216Z,main
  query: "select \"id\", \"title\", \"description\", \"thumbnail\", \"link\", \"link_text\", \"link_target\", \"type\", \"position\", \"badge\", \"badge_color\", \"is_active\", \"starts_at\", \"ends_at\", \"created_at\", \"updated_at\" from \"banners\" \"banners\" where (\"banners\".\"is_active\" = $1 and ((\"banners\".\"starts_at\" is null and \"banners\".\"ends_at\" is null) or ((\"banners\".\"starts_at\" is null or \"banners\".\"starts_at\" <= $2) and (\"banners\".\"ends_at\" is null or \"banners\".\"ends_at\" >= $3))) and \"banners\".\"type\" = $4) order by CASE WHEN \"banners\".\"type\" = 'main' THEN 0 ELSE 1 END asc, \"banners\".\"position\" asc",
 params: [
  true, "2026-02-02T12:34:11.216Z", "2026-02-02T12:34:11.216Z", "main"
],

      at queryWithCache (/Users/rockywang/Documents/projects/funmagic-ai/node_modules/.bun/drizzle-orm@0.45.1+da96a2ffab12d2ab/node_modules/drizzle-orm/pg-core/session.js:41:15)

810 |   }
811 | 
812 |   function ErrorResponse(x) {
813 |     if (query) {
814 |       (query.cursorFn || query.describeFirst) && write(Sync)
815 |       errorResponse = Errors.postgres(parseError(x))
                                   ^
PostgresError: relation "banners" does not exist
 severity_local: "ERROR",
   severity: "ERROR",
   position: "200",
       file: "parse_relation.c",
    routine: "parserOpenTable",
       code: "42P01"

      at ErrorResponse (/Users/rockywang/Documents/projects/funmagic-ai/node_modules/.bun/postgres@3.4.8/node_modules/postgres/src/connection.js:815:30)
      at handle (/Users/rockywang/Documents/projects/funmagic-ai/node_modules/.bun/postgres@3.4.8/node_modules/postgres/src/connection.js:765:5)
      at data (/Users/rockywang/Documents/projects/funmagic-ai/node_modules/.bun/postgres@3.4.8/node_modules/postgres/src/connection.js:457:5)
      at emit (node:events:95:22)
      at addChunk (internal:streams/readable:264:47)
      at readableAddChunkPushByteMode (internal:streams/readable:242:18)
      at data (node:net:280:52)

--> GET /api/banners?type=main 500 4ms
<-- GET /api/banners?type=main
36 |   async queryWithCache(queryString, params, query) {
37 |     if (this.cache === void 0 || is(this.cache, NoopCache) || this.queryMetadata === void 0) {
38 |       try {
39 |         return await query();
40 |       } catch (e) {
41 |         throw new DrizzleQueryError(queryString, params, e);
                   ^
error: Failed query: select "id", "title", "description", "thumbnail", "link", "link_text", "link_target", "type", "position", "badge", "badge_color", "is_active", "starts_at", "ends_at", "created_at", "updated_at" from "banners" "banners" where ("banners"."is_active" = $1 and (("banners"."starts_at" is null and "banners"."ends_at" is null) or (("banners"."starts_at" is null or "banners"."starts_at" <= $2) and ("banners"."ends_at" is null or "banners"."ends_at" >= $3))) and "banners"."type" = $4) order by CASE WHEN "banners"."type" = 'main' THEN 0 ELSE 1 END asc, "banners"."position" asc
params: true,2026-02-02T12:34:12.118Z,2026-02-02T12:34:12.118Z,main
  query: "select \"id\", \"title\", \"description\", \"thumbnail\", \"link\", \"link_text\", \"link_target\", \"type\", \"position\", \"badge\", \"badge_color\", \"is_active\", \"starts_at\", \"ends_at\", \"created_at\", \"updated_at\" from \"banners\" \"banners\" where (\"banners\".\"is_active\" = $1 and ((\"banners\".\"starts_at\" is null and \"banners\".\"ends_at\" is null) or ((\"banners\".\"starts_at\" is null or \"banners\".\"starts_at\" <= $2) and (\"banners\".\"ends_at\" is null or \"banners\".\"ends_at\" >= $3))) and \"banners\".\"type\" = $4) order by CASE WHEN \"banners\".\"type\" = 'main' THEN 0 ELSE 1 END asc, \"banners\".\"position\" asc",
 params: [
  true, "2026-02-02T12:34:12.118Z", "2026-02-02T12:34:12.118Z", "main"
],

      at queryWithCache (/Users/rockywang/Documents/projects/funmagic-ai/node_modules/.bun/drizzle-orm@0.45.1+da96a2ffab12d2ab/node_modules/drizzle-orm/pg-core/session.js:41:15)

810 |   }
811 | 
812 |   function ErrorResponse(x) {
813 |     if (query) {
814 |       (query.cursorFn || query.describeFirst) && write(Sync)
815 |       errorResponse = Errors.postgres(parseError(x))
                                   ^
PostgresError: relation "banners" does not exist
 severity_local: "ERROR",
   severity: "ERROR",
   position: "200",
       file: "parse_relation.c",
    routine: "parserOpenTable",
       code: "42P01"

      at ErrorResponse (/Users/rockywang/Documents/projects/funmagic-ai/node_modules/.bun/postgres@3.4.8/node_modules/postgres/src/connection.js:815:30)
      at handle (/Users/rockywang/Documents/projects/funmagic-ai/node_modules/.bun/postgres@3.4.8/node_modules/postgres/src/connection.js:765:5)
      at data (/Users/rockywang/Documents/projects/funmagic-ai/node_modules/.bun/postgres@3.4.8/node_modules/postgres/src/connection.js:457:5)
      at emit (node:events:95:22)
      at addChunk (internal:streams/readable:264:47)
      at readableAddChunkPushByteMode (internal:streams/readable:242:18)
      at data (node:net:280:52)

--> GET /api/banners?type=main 500 6ms
<-- GET /api/banners?type=main
36 |   async queryWithCache(queryString, params, query) {
37 |     if (this.cache === void 0 || is(this.cache, NoopCache) || this.queryMetadata === void 0) {
38 |       try {
39 |         return await query();
40 |       } catch (e) {
41 |         throw new DrizzleQueryError(queryString, params, e);
                   ^
error: Failed query: select "id", "title", "description", "thumbnail", "link", "link_text", "link_target", "type", "position", "badge", "badge_color", "is_active", "starts_at", "ends_at", "created_at", "updated_at" from "banners" "banners" where ("banners"."is_active" = $1 and (("banners"."starts_at" is null and "banners"."ends_at" is null) or (("banners"."starts_at" is null or "banners"."starts_at" <= $2) and ("banners"."ends_at" is null or "banners"."ends_at" >= $3))) and "banners"."type" = $4) order by CASE WHEN "banners"."type" = 'main' THEN 0 ELSE 1 END asc, "banners"."position" asc
params: true,2026-02-02T12:36:15.297Z,2026-02-02T12:36:15.297Z,main
  query: "select \"id\", \"title\", \"description\", \"thumbnail\", \"link\", \"link_text\", \"link_target\", \"type\", \"position\", \"badge\", \"badge_color\", \"is_active\", \"starts_at\", \"ends_at\", \"created_at\", \"updated_at\" from \"banners\" \"banners\" where (\"banners\".\"is_active\" = $1 and ((\"banners\".\"starts_at\" is null and \"banners\".\"ends_at\" is null) or ((\"banners\".\"starts_at\" is null or \"banners\".\"starts_at\" <= $2) and (\"banners\".\"ends_at\" is null or \"banners\".\"ends_at\" >= $3))) and \"banners\".\"type\" = $4) order by CASE WHEN \"banners\".\"type\" = 'main' THEN 0 ELSE 1 END asc, \"banners\".\"position\" asc",
 params: [
  true, "2026-02-02T12:36:15.297Z", "2026-02-02T12:36:15.297Z", "main"
],

      at queryWithCache (/Users/rockywang/Documents/projects/funmagic-ai/node_modules/.bun/drizzle-orm@0.45.1+da96a2ffab12d2ab/node_modules/drizzle-orm/pg-core/session.js:41:15)

810 |   }
811 | 
812 |   function ErrorResponse(x) {
813 |     if (query) {
814 |       (query.cursorFn || query.describeFirst) && write(Sync)
815 |       errorResponse = Errors.postgres(parseError(x))
                                   ^
PostgresError: relation "banners" does not exist
 severity_local: "ERROR",
   severity: "ERROR",
   position: "200",
       file: "parse_relation.c",
    routine: "parserOpenTable",
       code: "42P01"

      at ErrorResponse (/Users/rockywang/Documents/projects/funmagic-ai/node_modules/.bun/postgres@3.4.8/node_modules/postgres/src/connection.js:815:30)
      at handle (/Users/rockywang/Documents/projects/funmagic-ai/node_modules/.bun/postgres@3.4.8/node_modules/postgres/src/connection.js:765:5)
      at data (/Users/rockywang/Documents/projects/funmagic-ai/node_modules/.bun/postgres@3.4.8/node_modules/postgres/src/connection.js:457:5)
      at emit (node:events:95:22)
      at addChunk (internal:streams/readable:264:47)
      at readableAddChunkPushByteMode (internal:streams/readable:242:18)
      at data (node:net:280:52)

--> GET /api/banners?type=main 500 12ms
<-- GET /api/banners?type=main
36 |   async queryWithCache(queryString, params, query) {
37 |     if (this.cache === void 0 || is(this.cache, NoopCache) || this.queryMetadata === void 0) {
38 |       try {
39 |         return await query();
40 |       } catch (e) {
41 |         throw new DrizzleQueryError(queryString, params, e);
                   ^
error: Failed query: select "id", "title", "description", "thumbnail", "link", "link_text", "link_target", "type", "position", "badge", "badge_color", "is_active", "starts_at", "ends_at", "created_at", "updated_at" from "banners" "banners" where ("banners"."is_active" = $1 and (("banners"."starts_at" is null and "banners"."ends_at" is null) or (("banners"."starts_at" is null or "banners"."starts_at" <= $2) and ("banners"."ends_at" is null or "banners"."ends_at" >= $3))) and "banners"."type" = $4) order by CASE WHEN "banners"."type" = 'main' THEN 0 ELSE 1 END asc, "banners"."position" asc
params: true,2026-02-02T12:38:36.069Z,2026-02-02T12:38:36.069Z,main
  query: "select \"id\", \"title\", \"description\", \"thumbnail\", \"link\", \"link_text\", \"link_target\", \"type\", \"position\", \"badge\", \"badge_color\", \"is_active\", \"starts_at\", \"ends_at\", \"created_at\", \"updated_at\" from \"banners\" \"banners\" where (\"banners\".\"is_active\" = $1 and ((\"banners\".\"starts_at\" is null and \"banners\".\"ends_at\" is null) or ((\"banners\".\"starts_at\" is null or \"banners\".\"starts_at\" <= $2) and (\"banners\".\"ends_at\" is null or \"banners\".\"ends_at\" >= $3))) and \"banners\".\"type\" = $4) order by CASE WHEN \"banners\".\"type\" = 'main' THEN 0 ELSE 1 END asc, \"banners\".\"position\" asc",
 params: [
  true, "2026-02-02T12:38:36.069Z", "2026-02-02T12:38:36.069Z", "main"
],

      at queryWithCache (/Users/rockywang/Documents/projects/funmagic-ai/node_modules/.bun/drizzle-orm@0.45.1+da96a2ffab12d2ab/node_modules/drizzle-orm/pg-core/session.js:41:15)

810 |   }
811 | 
812 |   function ErrorResponse(x) {
813 |     if (query) {
814 |       (query.cursorFn || query.describeFirst) && write(Sync)
815 |       errorResponse = Errors.postgres(parseError(x))
                                   ^
PostgresError: relation "banners" does not exist
 severity_local: "ERROR",
   severity: "ERROR",
   position: "200",
       file: "parse_relation.c",
    routine: "parserOpenTable",
       code: "42P01"

      at ErrorResponse (/Users/rockywang/Documents/projects/funmagic-ai/node_modules/.bun/postgres@3.4.8/node_modules/postgres/src/connection.js:815:30)
      at handle (/Users/rockywang/Documents/projects/funmagic-ai/node_modules/.bun/postgres@3.4.8/node_modules/postgres/src/connection.js:765:5)
      at data (/Users/rockywang/Documents/projects/funmagic-ai/node_modules/.bun/postgres@3.4.8/node_modules/postgres/src/connection.js:457:5)
      at emit (node:events:95:22)
      at addChunk (internal:streams/readable:264:47)
      at readableAddChunkPushByteMode (internal:streams/readable:242:18)
      at data (node:net:280:52)

--> GET /api/banners?type=main 500 20ms
<-- GET /api/banners?type=main
36 |   async queryWithCache(queryString, params, query) {
37 |     if (this.cache === void 0 || is(this.cache, NoopCache) || this.queryMetadata === void 0) {
38 |       try {
39 |         return await query();
40 |       } catch (e) {
41 |         throw new DrizzleQueryError(queryString, params, e);
                   ^
error: Failed query: select "id", "title", "description", "thumbnail", "link", "link_text", "link_target", "type", "position", "badge", "badge_color", "is_active", "starts_at", "ends_at", "created_at", "updated_at" from "banners" "banners" where ("banners"."is_active" = $1 and (("banners"."starts_at" is null and "banners"."ends_at" is null) or (("banners"."starts_at" is null or "banners"."starts_at" <= $2) and ("banners"."ends_at" is null or "banners"."ends_at" >= $3))) and "banners"."type" = $4) order by CASE WHEN "banners"."type" = 'main' THEN 0 ELSE 1 END asc, "banners"."position" asc
params: true,2026-02-02T12:46:10.433Z,2026-02-02T12:46:10.433Z,main
  query: "select \"id\", \"title\", \"description\", \"thumbnail\", \"link\", \"link_text\", \"link_target\", \"type\", \"position\", \"badge\", \"badge_color\", \"is_active\", \"starts_at\", \"ends_at\", \"created_at\", \"updated_at\" from \"banners\" \"banners\" where (\"banners\".\"is_active\" = $1 and ((\"banners\".\"starts_at\" is null and \"banners\".\"ends_at\" is null) or ((\"banners\".\"starts_at\" is null or \"banners\".\"starts_at\" <= $2) and (\"banners\".\"ends_at\" is null or \"banners\".\"ends_at\" >= $3))) and \"banners\".\"type\" = $4) order by CASE WHEN \"banners\".\"type\" = 'main' THEN 0 ELSE 1 END asc, \"banners\".\"position\" asc",
 params: [
  true, "2026-02-02T12:46:10.433Z", "2026-02-02T12:46:10.433Z", "main"
],

      at queryWithCache (/Users/rockywang/Documents/projects/funmagic-ai/node_modules/.bun/drizzle-orm@0.45.1+da96a2ffab12d2ab/node_modules/drizzle-orm/pg-core/session.js:41:15)

810 |   }
811 | 
812 |   function ErrorResponse(x) {
813 |     if (query) {
814 |       (query.cursorFn || query.describeFirst) && write(Sync)
815 |       errorResponse = Errors.postgres(parseError(x))
                                   ^
PostgresError: relation "banners" does not exist
 severity_local: "ERROR",
   severity: "ERROR",
   position: "200",
       file: "parse_relation.c",
    routine: "parserOpenTable",
       code: "42P01"

      at ErrorResponse (/Users/rockywang/Documents/projects/funmagic-ai/node_modules/.bun/postgres@3.4.8/node_modules/postgres/src/connection.js:815:30)
      at handle (/Users/rockywang/Documents/projects/funmagic-ai/node_modules/.bun/postgres@3.4.8/node_modules/postgres/src/connection.js:765:5)
      at data (/Users/rockywang/Documents/projects/funmagic-ai/node_modules/.bun/postgres@3.4.8/node_modules/postgres/src/connection.js:457:5)
      at emit (node:events:95:22)
      at addChunk (internal:streams/readable:264:47)
      at readableAddChunkPushByteMode (internal:streams/readable:242:18)
      at data (node:net:280:52)

--> GET /api/banners?type=main 500 23ms
<-- GET /api/credits/packages
<-- GET /api/credits/packages
Failed to fetch credit packages: 36 |   async queryWithCache(queryString, params, query) {
37 |     if (this.cache === void 0 || is(this.cache, NoopCache) || this.queryMetadata === void 0) {
38 |       try {
39 |         return await query();
40 |       } catch (e) {
41 |         throw new DrizzleQueryError(queryString, params, e);
                   ^
error: Failed query: select "id", "name", "description", "credits", "bonus_credits", "price", "currency", "stripe_price_id", "stripe_product_id", "is_popular", "is_active", "sort_order", "created_at", "updated_at" from "credit_packages" "creditPackages" where "creditPackages"."is_active" = $1 order by "creditPackages"."sort_order" asc
params: true
  query: "select \"id\", \"name\", \"description\", \"credits\", \"bonus_credits\", \"price\", \"currency\", \"stripe_price_id\", \"stripe_product_id\", \"is_popular\", \"is_active\", \"sort_order\", \"created_at\", \"updated_at\" from \"credit_packages\" \"creditPackages\" where \"creditPackages\".\"is_active\" = $1 order by \"creditPackages\".\"sort_order\" asc",
 params: [
  true
],

      at queryWithCache (/Users/rockywang/Documents/projects/funmagic-ai/node_modules/.bun/drizzle-orm@0.45.1+da96a2ffab12d2ab/node_modules/drizzle-orm/pg-core/session.js:41:15)

810 |   }
811 | 
812 |   function ErrorResponse(x) {
813 |     if (query) {
814 |       (query.cursorFn || query.describeFirst) && write(Sync)
815 |       errorResponse = Errors.postgres(parseError(x))
                                   ^
PostgresError: relation "credit_packages" does not exist
 severity_local: "ERROR",
   severity: "ERROR",
   position: "199",
       file: "parse_relation.c",
    routine: "parserOpenTable",
       code: "42P01"

      at ErrorResponse (/Users/rockywang/Documents/projects/funmagic-ai/node_modules/.bun/postgres@3.4.8/node_modules/postgres/src/connection.js:815:30)
      at handle (/Users/rockywang/Documents/projects/funmagic-ai/node_modules/.bun/postgres@3.4.8/node_modules/postgres/src/connection.js:765:5)
      at data (/Users/rockywang/Documents/projects/funmagic-ai/node_modules/.bun/postgres@3.4.8/node_modules/postgres/src/connection.js:457:5)
      at emit (node:events:95:22)
      at addChunk (internal:streams/readable:264:47)
      at readableAddChunkPushByteMode (internal:streams/readable:242:18)
      at data (node:net:280:52)

--> GET /api/credits/packages 200 7ms
Failed to fetch credit packages: 36 |   async queryWithCache(queryString, params, query) {
37 |     if (this.cache === void 0 || is(this.cache, NoopCache) || this.queryMetadata === void 0) {
38 |       try {
39 |         return await query();
40 |       } catch (e) {
41 |         throw new DrizzleQueryError(queryString, params, e);
                   ^
error: Failed query: select "id", "name", "description", "credits", "bonus_credits", "price", "currency", "stripe_price_id", "stripe_product_id", "is_popular", "is_active", "sort_order", "created_at", "updated_at" from "credit_packages" "creditPackages" where "creditPackages"."is_active" = $1 order by "creditPackages"."sort_order" asc
params: true
  query: "select \"id\", \"name\", \"description\", \"credits\", \"bonus_credits\", \"price\", \"currency\", \"stripe_price_id\", \"stripe_product_id\", \"is_popular\", \"is_active\", \"sort_order\", \"created_at\", \"updated_at\" from \"credit_packages\" \"creditPackages\" where \"creditPackages\".\"is_active\" = $1 order by \"creditPackages\".\"sort_order\" asc",
 params: [
  true
],

      at queryWithCache (/Users/rockywang/Documents/projects/funmagic-ai/node_modules/.bun/drizzle-orm@0.45.1+da96a2ffab12d2ab/node_modules/drizzle-orm/pg-core/session.js:41:15)

810 |   }
811 | 
812 |   function ErrorResponse(x) {
813 |     if (query) {
814 |       (query.cursorFn || query.describeFirst) && write(Sync)
815 |       errorResponse = Errors.postgres(parseError(x))
                                   ^
PostgresError: relation "credit_packages" does not exist
 severity_local: "ERROR",
   severity: "ERROR",
   position: "199",
       file: "parse_relation.c",
    routine: "parserOpenTable",
       code: "42P01"

      at ErrorResponse (/Users/rockywang/Documents/projects/funmagic-ai/node_modules/.bun/postgres@3.4.8/node_modules/postgres/src/connection.js:815:30)
      at handle (/Users/rockywang/Documents/projects/funmagic-ai/node_modules/.bun/postgres@3.4.8/node_modules/postgres/src/connection.js:765:5)
      at data (/Users/rockywang/Documents/projects/funmagic-ai/node_modules/.bun/postgres@3.4.8/node_modules/postgres/src/connection.js:457:5)
      at emit (node:events:95:22)
      at addChunk (internal:streams/readable:264:47)
      at readableAddChunkPushByteMode (internal:streams/readable:242:18)
      at data (node:net:280:52)

--> GET /api/credits/packages 200 7ms