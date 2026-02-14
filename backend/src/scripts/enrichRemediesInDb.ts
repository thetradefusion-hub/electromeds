/**
 * Enrich Remedies in MongoDB
 *
 * Updates remedies that have category "Unknown" or empty materia medica
 * using static mapping + name heuristics (no internet access needed).
 * Run from backend: npm run enrich:remedies
 */

import 'dotenv/config';
import mongoose from 'mongoose';
import config from '../config/env.js';
import Remedy from '../models/Remedy.model.js';
import { getEnrichmentForRemedy } from './data/remedyEnrichmentData.js';

async function enrichRemedies() {
  if (!config.mongodbUri) {
    console.error('❌ MONGODB_URI not set. Set it in .env');
    process.exit(1);
  }

  await mongoose.connect(config.mongodbUri);
  console.log('✅ Connected to MongoDB\n');

  // Find remedies that need enrichment: category Unknown OR empty materia medica
  const needCategory = await Remedy.find({
    $or: [{ category: 'Unknown' }, { category: { $exists: false } }, { category: '' }],
  }).lean();

  const needDescription = await Remedy.find({
    $and: [
      { $or: [{ 'materiaMedica.pathogenesis': '' }, { 'materiaMedica.pathogenesis': { $exists: false } }] },
      { $or: [{ 'materiaMedica.keynotes': { $size: 0 } }, { 'materiaMedica.keynotes': { $exists: false } }] },
    ],
  }).lean();

  const needEither = await Remedy.find({
    $or: [
      { category: 'Unknown' },
      { category: '' },
      { category: { $exists: false } },
      {
        $and: [
          { $or: [{ 'materiaMedica.pathogenesis': '' }, { 'materiaMedica.pathogenesis': { $exists: false } }] },
          { $or: [{ 'materiaMedica.keynotes': { $size: 0 } }, { 'materiaMedica.keynotes': { $exists: false } }] },
        ],
      },
    ],
  }).lean();

  const totalToProcess = needEither.length;
  console.log(`📊 Remedies with Unknown category or empty description: ${totalToProcess}`);
  console.log(`   (Unknown/empty category: ${needCategory.length}, empty description: ${needDescription.length})\n`);

  let updated = 0;
  let noMatch = 0;
  let errors = 0;

  const batchSize = 100;
  for (let i = 0; i < needEither.length; i += batchSize) {
    const batch = needEither.slice(i, i + batchSize);
    for (const doc of batch) {
      const name = (doc as any).name;
      if (!name) continue;

      try {
        const enrichment = getEnrichmentForRemedy(name);
        if (!enrichment) {
          noMatch++;
          continue;
        }

        const update: any = {};
        const current = doc as any;

        if (!current.category || current.category === 'Unknown' || current.category === '') {
          update.category = enrichment.category;
        }
        if (
          !current.materiaMedica?.pathogenesis &&
          (enrichment.materiaMedica.pathogenesis || enrichment.materiaMedica.keynotes?.length)
        ) {
          update['materiaMedica.pathogenesis'] = enrichment.materiaMedica.pathogenesis || '';
          update['materiaMedica.clinicalNotes'] = enrichment.materiaMedica.clinicalNotes || '';
          if (enrichment.materiaMedica.keynotes?.length) {
            update['materiaMedica.keynotes'] = enrichment.materiaMedica.keynotes;
          }
        }

        if (Object.keys(update).length > 0) {
          await Remedy.updateOne({ _id: doc._id }, { $set: update });
          updated++;
        }
      } catch (e: any) {
        console.error(`Error updating ${name}:`, e.message);
        errors++;
      }
    }
    if ((i + batchSize) % 500 === 0 || i + batchSize >= needEither.length) {
      console.log(`   Processed ${Math.min(i + batchSize, needEither.length)} / ${needEither.length}...`);
    }
  }

  console.log('\n✅ Enrichment complete');
  console.log(`   Updated: ${updated}`);
  console.log(`   No match (unchanged): ${noMatch}`);
  if (errors) console.log(`   Errors: ${errors}`);

  await mongoose.disconnect();
  console.log('\n🔌 Disconnected from MongoDB');
}

const isMain =
  process.argv[1]?.includes('enrichRemediesInDb') ||
  process.argv[1]?.includes('enrich-remedies');

if (isMain) {
  enrichRemedies()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}

export default enrichRemedies;
