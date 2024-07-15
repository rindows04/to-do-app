import fs from "node:fs";
import express from "express";
import { PrismaClient } from "@prisma/client";
import escapeHTML from "escape-html";
import dayjs from "dayjs"; // For date formatting

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.static("static"));
const prisma = new PrismaClient();

const template = fs.readFileSync("./template.html", "utf-8");

app.get("/", async (request, response) => {
  const todos = await prisma.todo.findMany();
  const html = template.replace(
    "<!-- todos -->",
    todos
      .map(
        (todo) => `
          <li>
            <span>${escapeHTML(todo.title)} (締切: ${dayjs(todo.deadline).format('YYYY-MM-DD')})</span>
            <form method="post" action="/delete" class="delete-form">
              <input type="hidden" name="id" value="${todo.id}" />
              <button type="submit">削除</button>
            </form>
          </li>
        `,
      )
      .join(""),
  );
  response.send(html);
});

app.post("/create", async (request, response) => {
  const { title, deadline } = request.body;
  await prisma.todo.create({
    data: { 
      title,
      deadline: new Date(deadline),
    },
  });
  response.redirect("/");
});

app.post("/delete", async (request, response) => {
  await prisma.todo.delete({
    where: { id: parseInt(request.body.id) },
  });
  response.redirect("/");
});

app.listen(3000);
