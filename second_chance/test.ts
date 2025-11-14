// second_chance/test.ts

import { SecondChance, Context } from "./index";
const app = new SecondChance();

// Global error handler
app.error((err, ctx) => {
  console.error("Caught error:", err);
  return ctx.json({ error: "Something went wrong!", message: err.message }, 500);
});

// Middleware
app.use(async (ctx, next) => {
  console.log(`[${new Date().toISOString()}] ${ctx.req.method} ${ctx.req.url}`);
  return await next();
});

app.get("/", (ctx: Context) => {
  return ctx.json({ message: "Hello from SecondChance!" });
});

app.get("/users/:id", (ctx: Context) => {
  return ctx.json({ userId: ctx.params.id, ok: true });
});

app.get("/html", (ctx: Context) => {
    return ctx.html("<h1>Hello, World!</h1>");
});

app.get("/redirect", (ctx: Context) => {
    return ctx.redirect("https://www.google.com");
});

app.post("/json", async (ctx: Context) => {
    const body = await ctx.body('json');
    return ctx.json({ received: body });
});

app.get("/error", (ctx: Context) => {
  throw new Error("This is a test error!");
});

app.listen(3000);
