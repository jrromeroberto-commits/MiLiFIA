import "dotenv/config";

import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import JSZip from "jszip";
import { requireCurrentUser } from "@/lib/auth/current-user";
import { db } from "@/lib/db/client";
import { ProjectFileError } from "@/lib/files/extractor";
import { MAX_PROJECT_FILE_BYTES } from "@/lib/validation/project-file";
import { processChatMessage } from "@/services/chat-service";
import { EntityNotFoundError } from "@/services/errors";
import { searchProjectFiles } from "@/services/file-search-service";
import {
  getProjectFileDownload,
  uploadProjectFile,
} from "@/services/project-file-service";
import { createProject, deleteProject } from "@/services/project-service";

const suffix = randomUUID().slice(0, 8);
let projectId: string | undefined;
let otherUserId: string | undefined;

function makePdf(text: string) {
  const stream = `BT /F1 12 Tf 72 720 Td (${text}) Tj ET`;
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    `<< /Length ${Buffer.byteLength(stream)} >>\nstream\n${stream}\nendstream`,
  ];
  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  objects.forEach((object, index) => {
    offsets.push(Buffer.byteLength(pdf));
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });
  const xref = Buffer.byteLength(pdf);
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  pdf += offsets.slice(1).map((offset) => `${String(offset).padStart(10, "0")} 00000 n \n`).join("");
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return Uint8Array.from(Buffer.from(pdf, "ascii"));
}

async function makeDocx(text: string) {
  const zip = new JSZip();
  zip.file(
    "[Content_Types].xml",
    '<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>',
  );
  zip.file(
    "_rels/.rels",
    '<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>',
  );
  zip.file(
    "word/document.xml",
    `<?xml version="1.0" encoding="UTF-8"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:p><w:r><w:t>${text}</w:t></w:r></w:p></w:body></w:document>`,
  );
  return zip.generateAsync({ type: "uint8array" });
}

async function main() {
  const user = await requireCurrentUser();
  const project = await createProject(user.id, {
    name: `Archivos verificación ${suffix}`,
    description: "Proyecto temporal para verificar archivos.",
  });
  projectId = project.id;

  const content = "GLPI Cloud centraliza los tickets del equipo de soporte. Responsable: Ana.";
  const first = await uploadProjectFile(user.id, {
    projectId: project.id,
    originalName: "guia-glpi-cloud.txt",
    mimeType: "text/plain",
    data: new TextEncoder().encode(content),
  });
  assert.equal(first.duplicate, false);
  assert(!first.duplicate);
  assert.equal(first.file.processingStatus, "READY");
  assert.equal(first.file._count.chunks, 1);

  const duplicate = await uploadProjectFile(user.id, {
    projectId: project.id,
    originalName: "copia.txt",
    mimeType: "text/plain",
    data: new TextEncoder().encode(content),
  });
  assert.equal(duplicate.duplicate, true);
  assert.equal(
    await db.projectFile.count({ where: { projectId: project.id } }),
    1,
  );

  const image = await uploadProjectFile(user.id, {
    projectId: project.id,
    originalName: "captura.png",
    mimeType: "image/png",
    data: Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00]),
  });
  assert(!image.duplicate);
  assert.equal(image.file.processingStatus, "NO_TEXT");
  assert.equal(image.file._count.chunks, 0);

  const pdf = await uploadProjectFile(user.id, {
    projectId: project.id,
    originalName: "manual.pdf",
    mimeType: "application/pdf",
    data: makePdf("Manual PDF verificable"),
  });
  assert(!pdf.duplicate);
  assert.equal(pdf.file.processingStatus, "READY");
  assert.equal(pdf.file.pageCount, 1);

  const docx = await uploadProjectFile(user.id, {
    projectId: project.id,
    originalName: "acuerdo.docx",
    mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    data: Uint8Array.from(await makeDocx("Acuerdo Word verificable")),
  });
  assert(!docx.duplicate);
  assert.equal(docx.file.processingStatus, "READY");
  assert(
    (await searchProjectFiles(user.id, { query: "Acuerdo Word", projectId: project.id }))
      .some((item) => item.id === docx.file.id),
  );

  const matches = await searchProjectFiles(user.id, {
    query: "¿Dónde está el documento relacionado con GLPI Cloud?",
    projectId: project.id,
  });
  assert.equal(matches[0]?.id, first.file.id);
  assert.match(matches[0]?.excerpt ?? "", /tickets del equipo/i);
  assert.deepEqual(
    await searchProjectFiles(user.id, { query: "contenido inexistente", projectId: project.id }),
    [],
  );

  const chatResult = await processChatMessage(user.id, "buscar archivo", {
    interpret: async () => ({
      intent: "search_files",
      fileQuery: "GLPI Cloud",
      projectName: project.name,
      clarificationQuestion: null,
    }),
  });
  assert.equal(chatResult.outcome, "answer");
  assert.equal(chatResult.mutated, false);
  assert.equal(chatResult.items[0]?.label, "guia-glpi-cloud.txt");
  assert.match(chatResult.items[0]?.detail ?? "", /GLPI Cloud/i);

  const otherUser = await db.user.create({
    data: { name: "Verificador aislado", email: `files-${suffix}@lifeos.local` },
  });
  otherUserId = otherUser.id;
  await assert.rejects(
    () => getProjectFileDownload(otherUser.id, first.file.id),
    EntityNotFoundError,
  );

  await assert.rejects(
    () => uploadProjectFile(user.id, {
      projectId: project.id,
      originalName: "falso.pdf",
      mimeType: "application/pdf",
      data: new TextEncoder().encode("esto no es un PDF"),
    }),
    ProjectFileError,
  );
  await assert.rejects(
    () => uploadProjectFile(user.id, {
      projectId: project.id,
      originalName: "grande.txt",
      mimeType: "text/plain",
      data: new Uint8Array(MAX_PROJECT_FILE_BYTES + 1),
    }),
  );

  console.log(
    "Archivos verificados: carga, deduplicación, fragmentos, búsqueda con citas y aislamiento por usuario.",
  );
}

async function cleanup() {
  const user = await requireCurrentUser();
  if (projectId) await deleteProject(user.id, projectId);
  if (otherUserId) await db.user.deleteMany({ where: { id: otherUserId } });
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await cleanup();
    await db.$disconnect();
  });
