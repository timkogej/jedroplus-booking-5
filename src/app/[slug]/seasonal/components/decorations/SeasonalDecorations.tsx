'use client';

import { SeasonalTheme } from './SeasonDetector';
import FallingSnowflakes from './FallingSnowflakes';
import ChristmasOrnaments from './ChristmasOrnaments';
import FloatingHearts from './FloatingHearts';
import SpringFlowers from './SpringFlowers';
import EasterElements from './EasterElements';
import SummerElements from './SummerElements';
import FallingLeaves from './FallingLeaves';
import HalloweenElements from './HalloweenElements';
import NewYearElements from './NewYearElements';

interface Props {
  seasonalTheme: SeasonalTheme;
  primaryColor: string;
  reducedCount?: boolean;
}

export default function SeasonalDecorations({ seasonalTheme, primaryColor, reducedCount }: Props) {
  const { config } = seasonalTheme;
  const count = reducedCount ? 10 : 20;

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {config.snowflakes && <FallingSnowflakes primaryColor={primaryColor} count={count} />}
      {config.ornaments && <ChristmasOrnaments primaryColor={primaryColor} />}
      {config.fireworks && <NewYearElements primaryColor={primaryColor} />}
      {config.hearts && <FloatingHearts primaryColor={primaryColor} count={count} />}
      {config.flowers && <SpringFlowers primaryColor={primaryColor} />}
      {config.eggs && <EasterElements primaryColor={primaryColor} />}
      {config.sunRays && <SummerElements primaryColor={primaryColor} />}
      {config.leaves && <FallingLeaves primaryColor={primaryColor} count={count} />}
      {config.pumpkins && <HalloweenElements showPumpkins />}
      {config.ghosts && <HalloweenElements showGhosts />}
      {config.bats && <HalloweenElements showBats />}
    </div>
  );
}
