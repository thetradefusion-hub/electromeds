import { api } from "./client";

export type RepertoryChapter = {
  id: string;
  name: string;
  rubricCount: number;
  icon: "mind" | "vertigo" | "head" | "eyes" | "ears" | "nose" | "face" | "mouth" | "generic";
};

export type RepertoryRubric = {
  id: string;
  chapterId: string;
  path: string;
  text: string;
};

// Backend API response types
type BackendChapter = {
  name: string;
  rubricCount: number;
};

type BackendRubric = {
  _id: string;
  chapter: string;
  rubricText: string;
  repertoryType: string;
};

// Map chapter names to icons
function getChapterIcon(chapterName: string): RepertoryChapter["icon"] {
  const name = chapterName.toLowerCase();
  if (name.includes("mind")) return "mind";
  if (name.includes("vertigo")) return "vertigo";
  if (name.includes("head")) return "head";
  if (name.includes("eye")) return "eyes";
  if (name.includes("ear")) return "ears";
  if (name.includes("nose")) return "nose";
  if (name.includes("face")) return "face";
  if (name.includes("mouth") || name.includes("teeth")) return "mouth";
  return "generic";
}

// Generate a stable ID from chapter name
function chapterNameToId(name: string): string {
  return name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

/**
 * Get all repertory chapters from backend
 */
export async function getRepertoryChapters(): Promise<RepertoryChapter[]> {
  try {
    const res = await api.get<{ success: boolean; data: BackendChapter[] }>("/repertory/chapters");
    
    if (!res.data.success || !res.data.data) {
      throw new Error("Invalid response from backend");
    }

    // Transform backend chapters to mobile app format
    return res.data.data.map((chapter) => ({
      id: chapterNameToId(chapter.name),
      name: chapter.name,
      rubricCount: chapter.rubricCount,
      icon: getChapterIcon(chapter.name),
    }));
  } catch (error) {
    console.error("Failed to fetch chapters from backend:", error);
    // Fallback to empty array if backend fails
    return [];
  }
}

/**
 * Get rubrics by chapter name or ID
 * @param chapterIdOrName - Chapter ID (for backward compatibility) or chapter name (preferred)
 * @param chapterName - Optional chapter name (if provided, this will be used directly)
 */
export async function getRubricsByChapter(
  chapterIdOrName: string,
  chapterName?: string
): Promise<RepertoryRubric[]> {
  try {
    // Use provided chapter name, or try to derive from chapterId
    const chapterNameToUse = chapterName || chapterIdOrName;

    const res = await api.get<{ success: boolean; data: BackendRubric[] }>("/repertory/rubrics", {
      params: {
        chapter: chapterNameToUse,
        limit: 1000, // Get all rubrics for the chapter
      },
    });

    if (!res.data.success || !res.data.data) {
      throw new Error("Invalid response from backend");
    }

    // Transform backend rubrics to mobile app format
    return res.data.data.map((rubric) => ({
      id: rubric._id,
      chapterId: chapterIdOrName, // Keep original chapterId for navigation
      path: `${rubric.chapter} / ${rubric.rubricText.split(" - ")[0] || rubric.rubricText}`,
      text: rubric.rubricText,
    }));
  } catch (error) {
    console.error(`Failed to fetch rubrics for chapter ${chapterIdOrName}:`, error);
    // Fallback to empty array if backend fails
    return [];
  }
}

/**
 * Search rubrics across all chapters
 */
export async function searchRubrics(query: string): Promise<RepertoryRubric[]> {
  const q = query.trim();
  if (!q) return [];

  try {
    const res = await api.get<{ success: boolean; data: BackendRubric[] }>("/repertory/rubrics", {
      params: {
        search: q,
        limit: 100, // Limit search results
      },
    });

    if (!res.data.success || !res.data.data) {
      throw new Error("Invalid response from backend");
    }

    // Transform backend rubrics to mobile app format
    return res.data.data.map((rubric) => {
      const chapterId = chapterNameToId(rubric.chapter);
      return {
        id: rubric._id,
        chapterId: chapterId,
        path: `${rubric.chapter} / ${rubric.rubricText.split(" - ")[0] || rubric.rubricText}`,
        text: rubric.rubricText,
      };
    });
  } catch (error) {
    console.error(`Failed to search rubrics:`, error);
    // Fallback to empty array if backend fails
    return [];
  }
}

