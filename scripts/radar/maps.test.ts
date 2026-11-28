import { expect, test } from "vitest";
import { classificarSite, desembrulhar, lerCsv, paraCandidato } from "./maps.ts";

test("lerCsv lida com BOM, aspas e vírgula dentro do campo", () => {
  const [l] = lerCsv('﻿title,address,review_rating\r\n"Nexo","Av. X, 473 - Fortaleza",5\r\n');
  expect(l).toEqual({ title: "Nexo", address: "Av. X, 473 - Fortaleza", review_rating: "5" });
});

test("desembrulha o link do Instagram e classifica o site", () => {
  expect(desembrulhar("https://l.instagram.com/?u=https://schedweb.com.br/exemplo&e=x")).toBe("https://schedweb.com.br/exemplo");
  expect(classificarSite("").sinal).toBe("sem site");
  expect(classificarSite("http://wa.me/5585999990000").plataforma).toBe("WhatsApp");
  expect(classificarSite("https://exemplo.ueniweb.com/").sinal).toBe("link sem site próprio");
  expect(classificarSite("https://clinicaexemplo.com.br").sinal).toBe("site próprio");
});

test("@ vem da ficha quando ela aponta pro Instagram e ignora @ de plataforma", () => {
  const base = { title: "T", phone: "", website: "", review_rating: "5", review_count: "30", instagram: "" };
  expect(paraCandidato({ ...base, website: "https://www.instagram.com/barbeariaexemplo?igshid=1" }).instagram).toBe("@barbeariaexemplo");
  expect(paraCandidato({ ...base, website: "http://x.booksy.com/", instagram: "https://instagram.com/booksybiz" }).instagram).toBe("");
  expect(paraCandidato({ ...base, instagram: "https://instagram.com/whatsapp" }).instagram).toBe("");
});
