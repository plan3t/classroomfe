export type GoalScoringConfig = {
  maxAverageSaltG: number;
  maxSugaredRatio: number;
  minFiberRatio: number;
  maxProcessedRatio: number;
};

export const defaultGoalScoringConfig: GoalScoringConfig = {
  maxAverageSaltG: Number(process.env.GOAL_MAX_AVG_SALT_G ?? 0.8),
  maxSugaredRatio: Number(process.env.GOAL_MAX_SUGARED_RATIO ?? 0.34),
  minFiberRatio: Number(process.env.GOAL_MIN_FIBER_RATIO ?? 0.34),
  maxProcessedRatio: Number(process.env.GOAL_MAX_PROCESSED_RATIO ?? 0.25),
};
