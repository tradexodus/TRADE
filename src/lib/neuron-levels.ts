export interface NeuronLevel {
  name: string;
  minAmount: number;
  maxAmount: number | null;
  percentage: number;
  progressPercentage?: number; // For UI display
  color: string; // Hex color code for the level
  bgColor: string; // Background color for the level
  icon: string; // Icon name from lucide-react
}

export const NEURON_LEVELS: NeuronLevel[] = [
  {
    name: "Beginner",
    minAmount: 0,
    maxAmount: 200,
    percentage: 2.5,
    color: "#3B82F6", // Blue
    bgColor: "#1E3A8A",
    icon: "Brain",
  },
  {
    name: "Intermediate",
    minAmount: 201,
    maxAmount: 1000,
    percentage: 3,
    color: "#10B981", // Green
    bgColor: "#064E3B",
    icon: "Zap",
  },
  {
    name: "Advanced",
    minAmount: 1001,
    maxAmount: 5000,
    percentage: 4,
    color: "#6366F1", // Indigo
    bgColor: "#312E81",
    icon: "Rocket",
  },
  {
    name: "Pro",
    minAmount: 5001,
    maxAmount: 10000,
    percentage: 5,
    color: "#EC4899", // Pink
    bgColor: "#831843",
    icon: "Star",
  },
  {
    name: "VIP",
    minAmount: 10001,
    maxAmount: 50000,
    percentage: 7,
    color: "#F59E0B", // Amber
    bgColor: "#78350F",
    icon: "Crown",
  },
  {
    name: "Elite",
    minAmount: 50001,
    maxAmount: null, // No upper limit
    percentage: 13.4,
    color: "#EF4444", // Red
    bgColor: "#7F1D1D",
    icon: "Diamond",
  },
];

/**
 * Determines the neuron level based on the total deposit amount
 * @param totalDepositAmount The total amount deposited by the user
 * @returns The neuron level object with name, percentage and progress
 */
export function getNeuronLevel(totalDepositAmount: number): NeuronLevel {
  let currentLevel: NeuronLevel | null = null;
  let nextLevel: NeuronLevel | null = null;

  for (let i = 0; i < NEURON_LEVELS.length; i++) {
    const level = NEURON_LEVELS[i];

    if (
      totalDepositAmount >= level.minAmount &&
      (level.maxAmount === null || totalDepositAmount <= level.maxAmount)
    ) {
      currentLevel = { ...level };
      nextLevel = i < NEURON_LEVELS.length - 1 ? NEURON_LEVELS[i + 1] : null;
      break;
    }
  }

  // Default to beginner if no level found (shouldn't happen with proper ranges)
  if (!currentLevel) {
    currentLevel = { ...NEURON_LEVELS[0] };
    nextLevel = NEURON_LEVELS[1];
  }

  // Calculate progress percentage to next level
  if (nextLevel && currentLevel.maxAmount !== null) {
    const rangeSize = currentLevel.maxAmount - currentLevel.minAmount;
    const progress = totalDepositAmount - currentLevel.minAmount;
    currentLevel.progressPercentage = Math.min(
      Math.round((progress / rangeSize) * 100),
      100,
    );
  } else {
    // At max level
    currentLevel.progressPercentage = 100;
  }

  return currentLevel;
}
