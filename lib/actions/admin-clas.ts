"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClas, updateClas, deleteClas } from "@/lib/supabase/query/clas";
import { ClasInsert, ClasUpdate, GradeLevel } from "@/types/database";
import { getCoordinatesFromAddress } from "@/lib/geocoding";

// Schéma de validation
const clasSchema = z.object({
  name: z.string().min(2, "Le nom est requis"),
  location: z.string().min(5, "L'adresse est requise"),
  grade_level: z.enum(["primary", "middle_school"]),
  capacity: z.coerce.string().optional(),
  public_description: z.string().optional(),
  schedule: z.string().optional(),
});

export async function createClasAction(data: z.infer<typeof clasSchema>) {
  // 1. Validation
  const validation = clasSchema.safeParse(data);
  if (!validation.success) {
    return { success: false, error: validation.error.issues[0].message };
  }

  const { location, ...rest } = validation.data;

  // 2. Géocoding automatique
  let latitude = null;
  let longitude = null;
  
  if (location) {
    const coords = await getCoordinatesFromAddress(location);
    if (coords) {
      latitude = coords.latitude;
      longitude = coords.longitude;
    }
  }

  // 3. Préparation des données pour Supabase
  const insertData: ClasInsert = {
    name: rest.name,
    grade_level: rest.grade_level,
    location,
    latitude,
    longitude,
    // Convertir undefined en null pour les champs optionnels
    capacity: rest.capacity ?? null,
    public_description: rest.public_description ?? null,
    schedule: rest.schedule ?? null,
    // Champs par défaut
    allophone_count: null,
    volunteer_count: 0,
    website_url: null,
    logo_url: null
  };

  // 4. Enregistrement
  const result = await createClas(insertData);
  
  if (result.error) {
    return { success: false, error: result.error };
  }

  revalidatePath("/admin/clas");
  return { success: true, message: "CLAS créé avec succès" };
}

export async function updateClasAction(id: string, data: z.infer<typeof clasSchema>) {
  const validation = clasSchema.safeParse(data);
  if (!validation.success) {
    return { success: false, error: validation.error.issues[0].message };
  }

  const { location, ...rest } = validation.data;

  // Géocoding (seulement si l'adresse a changé, mais ici on le refait par simplicité
  // Idéalement, on pourrait comparer avec l'ancienne valeur si on l'avait sous la main)
  let latitude = null;
  let longitude = null;
  
  if (location) {
    const coords = await getCoordinatesFromAddress(location);
    if (coords) {
      latitude = coords.latitude;
      longitude = coords.longitude;
    }
  }

  const updateData: ClasUpdate = {
    id,
    name: rest.name,
    grade_level: rest.grade_level,
    location,
    // Convertir undefined en null pour les champs optionnels
    capacity: rest.capacity ?? null,
    public_description: rest.public_description ?? null,
    schedule: rest.schedule ?? null,
    // On ne met à jour les coordonnées que si on les a trouvées
    ...(latitude && longitude ? { latitude, longitude } : {})
  };

  const result = await updateClas(updateData);

  if (result.error) {
    return { success: false, error: result.error };
  }

  revalidatePath("/admin/clas");
  return { success: true, message: "CLAS mis à jour" };
}

export async function deleteClasAction(clasId: string) {
  const result = await deleteClas(clasId);
  if (result.success) {
    revalidatePath("/admin/clas");
  }
  return result;
}   