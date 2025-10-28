/**
 * TypeScript type definitions for AAD Framework
 */

export interface Question {
  id: string;
  text: string;
  course: 'NLP' | 'Software Engineering I';
  type: 'multiple-choice' | 'short-answer' | 'essay' | 'coding' | 'project';
  bloomLevel: number;
  contextDependency: number;
  novelty: number;
  exploitabilityScore?: number;
  aiTestResults?: AITestResult[];
  createdAt: string;
  updatedAt: string;
  tags?: string[];
  expectedAnswer?: string;
  rubric?: any;
  options?: string[];
  correctAnswer?: number | string;
}

export interface AITestResult {
  model: string;
  accuracy: number;
  coherence: number;
  response: string;
  timestamp: string;
  selectedOption?: number | string;
  isCorrect?: boolean;
  confidence?: number;
}

export interface Statistics {
  totalQuestions: number;
  averageES: number;
  aiResistantPercentage: number;
  testsRun: number;
  questionsByType: Record<string, number>;
  questionsByCourse: Record<string, number>;
  esDistribution: Record<string, number>;
}

export interface ESCalculation {
  exploitabilityScore: number;
  interpretation: string;
  breakdown: {
    bloomContribution: number;
    contextContribution: number;
    noveltyContribution: number;
    aiAccuracyContribution?: number;
    criteriaTotal: number;
    totalES: number;
    recommendations?: string[];
    colorCode?: string;
  };
}
