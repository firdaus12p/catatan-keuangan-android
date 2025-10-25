export const ALLOCATION_TARGET = 100;
export const ALLOCATION_TOLERANCE = 0.1;

export const isAllocationComplete = (totalPercentage: number): boolean => {
  return totalPercentage + ALLOCATION_TOLERANCE >= ALLOCATION_TARGET;
};

export const getAllocationDeficit = (totalPercentage: number): number => {
  const deficit = ALLOCATION_TARGET - totalPercentage;
  return deficit > 0 ? Math.max(0, parseFloat(deficit.toFixed(2))) : 0;
};
