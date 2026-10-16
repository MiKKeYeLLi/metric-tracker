import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

// Import `z` from here (not "zod") so schemas get the `.openapi()` method.
extendZodWithOpenApi(z);

export { z };
