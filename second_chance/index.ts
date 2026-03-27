// second_chance/index.ts

export class Context {
    constructor(public req: Request, public params: Record<string,string>) {}

    json(data: any, status = 200) {
      return new Response(JSON.stringify(data), {
        status,
        headers: { "Content-Type": "application/json" }
      });
    }

    text(data: string, status = 200) {
      return new Response(data, {
        status,
        headers: { "Content-Type": "text/plain" }
      });
    }

    html(data: string, status = 200) {
        return new Response(data, {
            status,
            headers: { "Content-Type": "text/html" }
        });
    }

    redirect(url: string, status = 302) {
        return new Response(null, {
            status,
            headers: { "Location": url }
        });
    }

    async body(type: 'json' | 'text') {
        if (type === 'json') return await this.req.json();
        return await this.req.text();
    }
}

type Next = () => Promise<Response | undefined>;
type Middleware = (ctx: Context, next: Next) => Promise<Response | undefined> | Response | undefined;
type HandlerResult = Response | Record<string, any> | string | Uint8Array;
type RouteHandler = (ctx: Context) => Promise<HandlerResult> | HandlerResult;
type ErrorHandler = (err: any, ctx: Context) => Response;

type RouteEntry = {
  method: string;
  path: string;
  parts: string[];
  handler: RouteHandler;
};

class TrieNode {
  children: Record<string, TrieNode> = Object.create(null);
  paramChild?: { name: string; node: TrieNode };
  wildcardChild?: TrieNode;
  catchAllChild?: { name?: string; node: TrieNode };
  handlers: Record<string, RouteHandler> | null = null;
}

export class SecondChance {
  private rawRoutes: RouteEntry[] = [];
  private middlewares: Middleware[] = [];
  private errorHandler?: ErrorHandler;

  use(mw: Middleware) {
    this.middlewares.push(mw);
    return this;
  }

  error(handler: ErrorHandler) {
    this.errorHandler = handler;
    return this;
  }

  get(path: string, handler: RouteHandler) { return this.add("GET", path, handler); }
  post(path: string, handler: RouteHandler) { return this.add("POST", path, handler); }
  put(path: string, handler: RouteHandler) { return this.add("PUT", path, handler); }
  delete(path: string, handler: RouteHandler) { return this.add("DELETE", path, handler); }

  private add(method: string, path: string, handler: RouteHandler) {
    if (path.length > 1 && path.endsWith("/")) path = path.slice(0, -1);
    const parts = path === "/" ? [""] : path.split("/").slice(1);
    this.rawRoutes.push({ method: method.toUpperCase(), path, parts, handler });
    return this;
  }

  private fastPathname(url: string) {
    const protoIndex = url.indexOf("://");
    const pathIndex = url.indexOf("/", protoIndex > -1 ? protoIndex + 3 : 0);
    if (pathIndex === -1) return "/";
    const queryIndex = url.indexOf("?", pathIndex);
    return queryIndex === -1 ? url.substring(pathIndex) : url.substring(pathIndex, queryIndex);
  }

  private buildRouter() {
    const root = new TrieNode();
    for (const route of this.rawRoutes) {
      let node = root;
      const parts = route.parts;

      if (parts.length === 1 && parts[0] === "") {
        if (!node.handlers) node.handlers = Object.create(null);
        node.handlers[route.method] = route.handler;
        continue;
      }

      for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        if (part === "**") {
          node.catchAllChild ??= { node: new TrieNode() };
          node = node.catchAllChild.node;
          break;
        } else if (part === "*") {
          if (!node.wildcardChild) node.wildcardChild = new TrieNode();
          node = node.wildcardChild;
        } else if (part.startsWith(":")) {
          const name = part.slice(1);
          if (!node.paramChild) node.paramChild = { name, node: new TrieNode() };
          node = node.paramChild.node;
        } else {
          if (!node.children[part]) node.children[part] = new TrieNode();
          node = node.children[part];
        }
      }
      if (!node.handlers) node.handlers = Object.create(null);
      node.handlers[route.method] = route.handler;
    }
    return root;
  }

  private compilePipeline(handler: RouteHandler, params: Record<string,string>) {
    const mws = this.middlewares.slice();
    const finalHandler = async (ctx: Context) => {
        const res = await handler(ctx);
        if (res instanceof Response) return res;
        if (typeof res === "string") return new Response(res);
        return ctx.json(res);
    };

    const pipeline = mws.reduceRight(
      (next, mw) => (ctx: Context) => mw(ctx, () => next(ctx)),
      finalHandler
    );

    return async (ctx: Context) => {
      const result = await pipeline(ctx);
      return result || new Response(null, { status: 204 });
    }
  }

  listen(port = 3000) {
    const root = this.buildRouter();
    const handlerMap = new Map<TrieNode, Record<string, (req: Request)=>Promise<Response>>>();

    Bun.serve({
      port,
      fetch: async (req: Request) => {
        const ctx = new Context(req, {});
        try {
          const pathname = this.fastPathname(req.url);
          const segments = pathname === "/" ? [] : pathname.slice(1).split("/");
          let node: TrieNode | undefined = root;

          if (segments.length === 0) {
            // handled below
          } else {
              for (let i = 0; i < segments.length; i++) {
                const seg = segments[i];
                if (!node) break;
                if (node.children[seg]) { node = node.children[seg]; continue; }
                if (node.paramChild) { ctx.params[node.paramChild.name] = seg; node = node.paramChild.node; continue; }
                if (node.wildcardChild) { node = node.wildcardChild; continue; }
                if (node.catchAllChild) {
                  ctx.params['*'] = segments.slice(i).join("/");
                  node = node.catchAllChild.node;
                  break;
                }
                node = undefined;
                break;
              }
          }

          if (!node || !node.handlers) return new Response(JSON.stringify({ error: "Route not found" }), { status: 404 });
          const handler = node.handlers[req.method];
          if (!handler) return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405 });

          let methodMap = handlerMap.get(node);
          if (!methodMap) {
              methodMap = Object.create(null);
              handlerMap.set(node, methodMap);
          }

          if (!methodMap[req.method]) {
              methodMap[req.method] = this.compilePipeline(handler, ctx.params);
          }

          return await (methodMap[req.method] as any)(ctx);
        } catch (err) {
          if (this.errorHandler) {
            return this.errorHandler(err, ctx);
          }
          return new Response(JSON.stringify({ error: "An unexpected error occurred" }), { status: 500 });
        }
      }
    });
    console.log(`SecondChance running at http://localhost:${port}`);
  }
}
