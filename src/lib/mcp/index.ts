import { defineMcp } from "@lovable.dev/mcp-js";
import pingTool from "./tools/ping";
import listCoursesTool from "./tools/list-courses";

export default defineMcp({
  name: "unigates-mcp",
  title: "UNIGATES MCP",
  version: "0.1.0",
  instructions:
    "Tools for the UNIGATES education platform (courses, bookstore, schools). Use `ping` to verify connectivity and `list_courses` to browse or search the public course catalog.",
  tools: [pingTool, listCoursesTool],
});
