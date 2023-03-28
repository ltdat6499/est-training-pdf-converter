const VERSION = "v1";
const fs = require("fs");
const path = require("path");
const Router = require("koa-router");
const puppeteer = require("puppeteer");
const pdf = require("pdf-creator-node");
const faker = require("faker");
const router = new Router();

const pdfOptions = {
  format: "A3",
  orientation: "portrait",
  border: "10mm",
  header: {
    height: "45mm",
    contents: '<div style="text-align: center;">Author: Ly Thanh Dat</div>',
  },
  footer: {
    height: "28mm",
    contents: {
      first: "Cover page",
      2: "Second page",
      default:
        '<span style="color: #444;">{{page}}</span>/<span>{{pages}}</span>', // fallback value
      last: "Last Page",
    },
  },
};

router.post(`/${VERSION}/savelink`, async (ctx) => {
  const linkRegex = new RegExp(
    /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()!@:%_\+.~#?&\/\/=]*)/g
  );
  const link = ctx.request.body.link;
  if (!linkRegex.test(link)) {
    ctx.status = 400;
    ctx.body = {
      error: "invalid link",
    };
    return;
  }
  const name = faker.internet.password(12);
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  const pathResult = path.join(__dirname, "/../resources", name + ".pdf");
  try {
    await page.goto(link, {
      waitUntil: "networkidle2",
    });
    await page.pdf({
      path: pathResult,
      format: "A4",
      printBackground: true,
    });
    await page.setViewport({ width: 1680, height: 1050 });
    ctx.attachment(pathResult);
    const stream = fs.createReadStream(pathResult);
    ctx.ok(stream);
  } catch (error) {
    ctx.status = 400;
    ctx.body = { error };
  } finally {
    await browser.close();
  }
});

router.post(`/${VERSION}/savejson`, async (ctx) => {
  const name = faker.internet.password(12);
  const pathResult = path.join(__dirname, "/../resources", name + ".pdf");
  const html = await fs.readFileSync(
    path.join(__dirname, "/../views", "template.html"),
    "utf8"
  );
  const users = [].concat(ctx.request.body.users).map((user) => ({
    name: user.name || "Unknown",
    age: user.age || "Unknown",
  }));
  const document = {
    html,
    data: {
      users,
    },
    path: pathResult,
    type: "",
  };
  try {
    await pdf.create(document, pdfOptions);
    ctx.attachment(pathResult);
    const stream = fs.createReadStream(pathResult);
    ctx.ok(stream);
  } catch (error) {
    ctx.status = 400;
    ctx.body = { error };
  }
});

module.exports = router;
