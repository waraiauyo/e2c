/**
 * Script to import CLAS data from JSON file to Supabase
 *
 * Usage: npx tsx scripts/import-clas-data.ts
 *
 * This script imports CLAS data from /Users/valentinrnld/Downloads/clas.json
 * into the Supabase database tables: clas, clas_team_members, clas_raw_contacts
 */

import { readFileSync } from 'fs';
import { createClient } from '@supabase/supabase-js';

// Read environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing environment variables. Please set:');
    console.error('   - NEXT_PUBLIC_SUPABASE_URL');
    console.error('   - SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
}

// Create Supabase client with service role (bypasses RLS)
const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface JsonContact {
    nom: string | null;
    email: string | null;
    contact?: string | null;
    telephone?: string | null;
}

interface JsonBenevoles {
    liste: JsonContact[];
    description: string | null;
}

interface JsonEquipe {
    directeur: JsonContact | null;
    coordinateur: JsonContact | null;
    animateur: JsonContact | null;
    benevoles: JsonBenevoles;
}

interface JsonClas {
    id: number;
    nom: string;
    location: string;
    public_description: string;
    niveaux: string;
    capacite: string;
    allophones: string;
    horaires: string;
    equipe: JsonEquipe;
    contacts_bruts: JsonContact[];
}

interface JsonData {
    clas_mayenne: JsonClas[];
}

async function importClasData() {
    console.log('🚀 Starting CLAS data import...\n');

    // Read JSON file
    const jsonPath = '/Users/valentinrnld/Downloads/clas.json';
    let data: JsonData;

    try {
        const fileContent = readFileSync(jsonPath, 'utf-8');
        data = JSON.parse(fileContent);
        console.log(`✅ Loaded ${data.clas_mayenne.length} CLAS from JSON file\n`);
    } catch (error) {
        console.error('❌ Error reading JSON file:', error);
        process.exit(1);
    }

    let successCount = 0;
    let errorCount = 0;

    // Import each CLAS
    for (const clasSrc of data.clas_mayenne) {
        try {
            console.log(`📍 Importing: ${clasSrc.nom}...`);

            // 1. Insert CLAS
            const { data: clas, error: clasError } = await supabase
                .from('clas')
                .insert({
                    name: clasSrc.nom,
                    location: clasSrc.location || null,
                    public_description: clasSrc.public_description || null,
                    grade_levels: clasSrc.niveaux || null,
                    capacity: clasSrc.capacite || null,
                    allophone_count: clasSrc.allophones || null,
                    schedule: clasSrc.horaires || null,
                })
                .select()
                .single();

            if (clasError) throw clasError;
            if (!clas) throw new Error('No CLAS returned after insert');

            console.log(`   ✓ Created CLAS (ID: ${clas.id})`);

            // 2. Insert team members
            const teamMembers = [];

            // Coordinateur
            if (clasSrc.equipe.coordinateur?.nom) {
                teamMembers.push({
                    clas_id: clas.id,
                    role: 'coordinator',
                    name: clasSrc.equipe.coordinateur.nom,
                    contact_phone: clasSrc.equipe.coordinateur.contact || clasSrc.equipe.coordinateur.telephone || null,
                    contact_email: clasSrc.equipe.coordinateur.email || null,
                });
            }

            // Animateur
            if (clasSrc.equipe.animateur?.nom) {
                teamMembers.push({
                    clas_id: clas.id,
                    role: 'animator',
                    name: clasSrc.equipe.animateur.nom,
                    contact_phone: clasSrc.equipe.animateur.contact || clasSrc.equipe.animateur.telephone || null,
                    contact_email: clasSrc.equipe.animateur.email || null,
                });
            }

            // Bénévoles are skipped - only coordinators and animators are imported

            if (teamMembers.length > 0) {
                const { error: teamError } = await supabase
                    .from('clas_team_members')
                    .insert(teamMembers);

                if (teamError) throw teamError;
                console.log(`   ✓ Added ${teamMembers.length} team member(s)`);
            }

            // 3. Insert raw contacts
            if (clasSrc.contacts_bruts.length > 0) {
                const rawContacts = clasSrc.contacts_bruts.map(contact => ({
                    clas_id: clas.id,
                    name: contact.nom || null,
                    email: contact.email || null,
                    phone: contact.contact || contact.telephone || null,
                }));

                const { error: contactsError } = await supabase
                    .from('clas_raw_contacts')
                    .insert(rawContacts);

                if (contactsError) throw contactsError;
                console.log(`   ✓ Added ${rawContacts.length} raw contact(s)`);
            }

            successCount++;
            console.log(`   ✅ Successfully imported "${clasSrc.nom}"\n`);

        } catch (error) {
            errorCount++;
            console.error(`   ❌ Error importing "${clasSrc.nom}":`, error);
            console.error('');
        }
    }

    // Summary
    console.log('═══════════════════════════════════════');
    console.log('📊 Import Summary:');
    console.log(`   ✅ Success: ${successCount}`);
    console.log(`   ❌ Errors: ${errorCount}`);
    console.log(`   📝 Total: ${data.clas_mayenne.length}`);
    console.log('═══════════════════════════════════════\n');

    if (errorCount === 0) {
        console.log('🎉 All CLAS data imported successfully!');
    } else {
        console.log('⚠️  Some CLAS failed to import. Check errors above.');
        process.exit(1);
    }
}

// Run the import
importClasData().catch((error) => {
    console.error('💥 Fatal error:', error);
    process.exit(1);
});
