/**
 * Repertory Engine Service
 * 
 * Purpose: Fetch remedies + grades from selected rubrics and build Remedy Pool
 * 
 * This service builds a pool of remedies from repertory rubric mappings
 */

import mongoose from 'mongoose';
import RubricRemedy from '../models/RubricRemedy.model.js';
import Remedy from '../models/Remedy.model.js';

export interface RemedyScore {
  remedyId: mongoose.Types.ObjectId;
  remedyName: string;
  rubricGrades: Array<{
    rubricId: mongoose.Types.ObjectId;
    grade: number;
    repertoryType: string;
  }>;
  totalBaseScore: number;
}

export class RepertoryEngine {
  /**
   * Build remedy pool from selected rubrics
   */
  async buildRemedyPool(
    selectedRubricIds: mongoose.Types.ObjectId[]
  ): Promise<Map<string, RemedyScore>> {
    // Step 4.1: Fetch all rubric-remedy mappings
    const rubricRemedies = await RubricRemedy.find({
      rubricId: { $in: selectedRubricIds },
    })
      .populate('remedyId')
      .lean();

    // Step 4.2: Build remedy pool with grades
    const remedyPool = new Map<string, RemedyScore>();

    rubricRemedies.forEach((rr: any) => {
      const remedyId = rr.remedyId._id.toString();
      const remedy = rr.remedyId;

      if (!remedyPool.has(remedyId)) {
        remedyPool.set(remedyId, {
          remedyId: remedy._id,
          remedyName: remedy.name,
          rubricGrades: [],
          totalBaseScore: 0,
        });
      }

      const remedyScore = remedyPool.get(remedyId)!;
      remedyScore.rubricGrades.push({
        rubricId: rr.rubricId,
        grade: rr.grade,
        repertoryType: rr.repertoryType,
      });
      remedyScore.totalBaseScore += rr.grade;
    });

    return remedyPool;
  }

  /**
   * Get remedy details
   */
  async getRemedyDetails(remedyId: mongoose.Types.ObjectId) {
    return Remedy.findById(remedyId).lean();
  }
}

export default RepertoryEngine;
