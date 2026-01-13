/**
 * Main Classical Homeopathy Rule Engine Service
 * 
 * Purpose: Integrate all services to process complete case
 * 
 * This is the main entry point that orchestrates all 9 steps of the rule engine
 */

import mongoose from 'mongoose';
import CaseEngine, { type StructuredCase } from './caseEngine.service.js';
import RubricMappingEngine from './rubricMapping.service.js';
import RepertoryEngine from './repertoryEngine.service.js';
import ScoringEngine from './scoringEngine.service.js';
import ClinicalIntelligenceLayer from './clinicalIntelligence.service.js';
import ContradictionEngine from './contradictionEngine.service.js';
import SuggestionEngine, { type SuggestionResult } from './suggestionEngine.service.js';
import OutcomeLearningHook from './outcomeLearning.service.js';

export interface ProcessCaseResult {
  suggestions: SuggestionResult;
  caseRecordId: mongoose.Types.ObjectId;
}

export class ClassicalHomeopathyRuleEngine {
  private caseEngine: CaseEngine;
  private rubricMapping: RubricMappingEngine;
  private repertoryEngine: RepertoryEngine;
  private scoringEngine: ScoringEngine;
  private clinicalIntelligence: ClinicalIntelligenceLayer;
  private contradictionEngine: ContradictionEngine;
  private suggestionEngine: SuggestionEngine;
  private outcomeHook: OutcomeLearningHook;

  constructor() {
    this.caseEngine = new CaseEngine();
    this.rubricMapping = new RubricMappingEngine();
    this.repertoryEngine = new RepertoryEngine();
    this.scoringEngine = new ScoringEngine();
    this.clinicalIntelligence = new ClinicalIntelligenceLayer();
    this.contradictionEngine = new ContradictionEngine();
    this.suggestionEngine = new SuggestionEngine();
    this.outcomeHook = new OutcomeLearningHook();
  }

  /**
   * Main entry point - Process complete case
   * 
   * @param doctorId - Doctor ID
   * @param patientId - Patient ID
   * @param structuredCase - Structured case input
   * @param patientHistory - Previous remedy history (optional)
   * @returns Suggestions and case record ID
   */
  async processCase(
    doctorId: mongoose.Types.ObjectId,
    patientId: mongoose.Types.ObjectId,
    structuredCase: StructuredCase,
    patientHistory?: Array<{ remedyId: string; date: Date }>
  ): Promise<ProcessCaseResult> {
    // Step 1: Case Intake
    const normalizedCase = await this.caseEngine.normalizeCase(structuredCase);

    // Step 2: Symptom Normalization (if needed - already done in Step 1, but can re-normalize if needed)

    // Step 3: Rubric Mapping
    const rubricMappings = await this.rubricMapping.mapSymptomsToRubrics(normalizedCase);
    const selectedRubrics = rubricMappings.filter((r) => r.autoSelected);

    // Step 4: Repertory Engine
    const remedyPool = await this.repertoryEngine.buildRemedyPool(
      selectedRubrics.map((r) => r.rubricId)
    );

    // Step 5: Smart Scoring
    const scoredRemedies = await this.scoringEngine.calculateRemedyScores(
      remedyPool,
      normalizedCase,
      selectedRubrics.map((r) => ({
        rubricId: r.rubricId,
        matchedSymptoms: r.matchedSymptoms,
      }))
    );

    // Step 6: Clinical Intelligence
    const filteredRemedies = await this.clinicalIntelligence.applyClinicalFilters(
      scoredRemedies,
      normalizedCase
    );

    // Step 7: Contradiction Detection
    const safetyChecked = await this.contradictionEngine.detectContradictions(
      filteredRemedies,
      patientHistory
    );

    // Step 8: Generate Suggestions
    const suggestions = await this.suggestionEngine.generateSuggestions(
      safetyChecked,
      normalizedCase
    );

    // Step 9: Save Case Record
    const caseRecord = await this.outcomeHook.saveCaseRecord(doctorId, patientId, {
      structuredCase: normalizedCase, // Use normalized case (has symptomCode and symptomName)
      selectedRubrics: selectedRubrics.map((r) => ({
        rubricId: r.rubricId,
        rubricText: r.rubricText,
        repertoryType: r.repertoryType,
        autoSelected: r.autoSelected,
      })),
      engineOutput: {
        remedyScores: safetyChecked.map((sc) => sc.remedy),
        clinicalReasoning: suggestions.summary.totalRemedies.toString(),
        warnings: safetyChecked.flatMap((sc) => sc.warnings),
      },
    });

    return {
      suggestions,
      caseRecordId: caseRecord._id,
    };
  }
}

export default ClassicalHomeopathyRuleEngine;
