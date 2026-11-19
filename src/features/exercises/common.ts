import type { Step } from '../../content/schema';

export interface ExerciseProps<S extends Step = Step> {
  step: S;
  mode: 'story' | 'explorer' | 'pro';
  onResult: (result: { correct: boolean; revealed: boolean }) => void;
  /** Set once the learner has revealed the answer for this step. */
  revealed: boolean;
  onReveal: () => void;
  /** Where to keep the learner's code between visits (code steps only). */
  draftKey?: string;
}

export interface RunState {
  running: boolean;
  logs: string[];
  outcome: import('../../runner').GradeOutcome | null;
  unavailable: boolean;
}
