"use server";

import { revalidatePath } from "next/cache";
import { createProject, updateProject, deleteProject } from "@/lib/supabase/query/projects";
import type { ClasProjectInsert, ClasProjectUpdate } from "@/types/database";

export async function createClasProjectAction(data: ClasProjectInsert) {
    const result = await createProject(data);
    if (result.error) {
        return { success: false, error: result.error };
    }
    revalidatePath("/admin/clas");
    return { success: true, data: result.data };
}

export async function updateClasProjectAction(data: ClasProjectUpdate) {
    const result = await updateProject(data);
    if (result.error) {
        return { success: false, error: result.error };
    }
    revalidatePath("/admin/clas");
    return { success: true, data: result.data };
}

export async function deleteClasProjectAction(id: string) {
    const result = await deleteProject(id);
    if (result.error) {
        return { success: false, error: result.error };
    }
    revalidatePath("/admin/clas");
    return { success: true };
}