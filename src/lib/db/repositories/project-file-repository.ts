import "server-only";

import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db/client";

type CreateProjectFileData = {
  projectId: string;
  originalName: string;
  mimeType: string;
  size: number;
  sha256: string;
  data: Uint8Array;
  extractedText: string | null;
  processingStatus: "READY" | "NO_TEXT";
  textTruncated: boolean;
  pageCount: number | null;
  chunks: Array<{ chunkIndex: number; content: string; contentHash: string }>;
};

export const projectFileRepository = {
  findDuplicate(projectId: string, sha256: string) {
    return db.projectFile.findUnique({
      where: { projectId_sha256: { projectId, sha256 } },
      select: { id: true, originalName: true },
    });
  },

  create(userId: string, input: CreateProjectFileData) {
    const { chunks, data, ...file } = input;
    return db.projectFile.create({
      data: {
        ...file,
        data: Uint8Array.from(data),
        userId,
        chunks: {
          create: chunks.map((chunk) => ({ ...chunk, userId })),
        },
      },
      include: { _count: { select: { chunks: true } } },
    });
  },

  findDownload(userId: string, id: string) {
    return db.projectFile.findFirst({
      where: { id, userId },
      select: {
        id: true,
        originalName: true,
        mimeType: true,
        size: true,
        data: true,
      },
    });
  },

  async delete(userId: string, id: string) {
    const result = await db.projectFile.deleteMany({ where: { id, userId } });
    return result.count > 0;
  },

  search(userId: string, terms: string[], projectId?: string) {
    const textFilters: Prisma.ProjectFileWhereInput[] = terms.flatMap((term) => [
      { originalName: { contains: term, mode: "insensitive" as const } },
      { chunks: { some: { content: { contains: term, mode: "insensitive" as const } } } },
    ]);

    return db.projectFile.findMany({
      where: {
        userId,
        projectId,
        OR: textFilters,
      },
      select: {
        id: true,
        originalName: true,
        mimeType: true,
        processingStatus: true,
        project: { select: { id: true, name: true } },
        chunks: {
          where: {
            OR: terms.map((term) => ({
              content: { contains: term, mode: "insensitive" as const },
            })),
          },
          orderBy: { chunkIndex: "asc" },
          take: 3,
          select: { content: true, chunkIndex: true },
        },
      },
      take: 100,
      orderBy: { createdAt: "desc" },
    });
  },
};
