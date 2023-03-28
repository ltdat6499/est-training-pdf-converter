const Koa = require("koa");
const bodyParser = require("koa-body");
const respond = require("koa-respond");
const morgan = require("koa-morgan");
const router = require("./routes");
const app = new Koa();

app.use(morgan("dev"));
app.use(bodyParser());
app.use(respond());

app.use(router.routes());
app.use(router.allowedMethods());

app.listen(3000, async () => {
  console.log("Server up on http://localhost:3000");
});
