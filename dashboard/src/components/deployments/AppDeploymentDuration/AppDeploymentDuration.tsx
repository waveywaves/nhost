import { differenceInSeconds, parseISO } from 'date-fns';
import { useEffect, useState } from 'react';

export interface AppDeploymentDurationProps {
  /**
   * Start date of the deployment.
   */
  startedAt: string;
  /**
   * End date of the deployment.
   */
  endedAt?: string;
}

export default function AppDeploymentDuration({
  startedAt,
  endedAt,
}: AppDeploymentDurationProps) {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (!endedAt) {
      interval = setInterval(() => {
        setCurrentTime(new Date());
      }, 1000);
    }
    return () => {
      clearInterval(interval);
    };
  }, [endedAt]);

  const totalDurationInSeconds = differenceInSeconds(
    endedAt ? parseISO(endedAt) : currentTime,
    parseISO(startedAt),
  );

  if (totalDurationInSeconds > 1200) {
    return <div>20+m</div>;
  }

  const durationMins = Math.floor(totalDurationInSeconds / 60);
  const durationSecs = totalDurationInSeconds % 60;

  return (
    <div
      style={{ fontVariantNumeric: 'tabular-nums' }}
      className="self-center font-display text-sm+ text-greyscaleDark"
    >
      {Number.isNaN(durationMins) || Number.isNaN(durationSecs) ? (
        <span>0m 0s</span>
      ) : (
        <span>
          {durationMins}m {durationSecs}s
        </span>
      )}
    </div>
  );
}
