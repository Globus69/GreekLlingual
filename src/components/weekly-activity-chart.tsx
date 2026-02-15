/**
 * WeeklyActivityChart Component
 *
 * Displays a heatmap of weekly learning activity
 * Uses data from get_weekly_activity RPC function
 */

import { WeeklyActivityPoint } from '@/hooks/use-stats-data';

interface WeeklyActivityChartProps {
  data: WeeklyActivityPoint[];
}

export default function WeeklyActivityChart({ data }: WeeklyActivityChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="text-center text-blue-200 py-8">
        No activity data yet. Start learning to see your progress!
      </div>
    );
  }

  // Group by week
  const weeks = new Map<string, WeeklyActivityPoint[]>();
  data.forEach((point) => {
    const weekKey = point.week_start;
    if (!weeks.has(weekKey)) {
      weeks.set(weekKey, []);
    }
    weeks.get(weekKey)!.push(point);
  });

  // Sort weeks chronologically
  const sortedWeeks = Array.from(weeks.entries()).sort((a, b) =>
    new Date(a[0]).getTime() - new Date(b[0]).getTime()
  );

  // Day names (short)
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Get activity color based on score
  const getActivityColor = (score: number): string => {
    if (score === 0) return 'bg-white/5';
    if (score < 25) return 'bg-green-500/30';
    if (score < 50) return 'bg-green-500/50';
    if (score < 75) return 'bg-green-500/70';
    return 'bg-green-500/90';
  };

  return (
    <div className="space-y-4">
      {/* Day labels */}
      <div className="grid grid-cols-8 gap-1 text-xs text-blue-200">
        <div></div> {/* Empty cell for week label */}
        {dayNames.map((day) => (
          <div key={day} className="text-center font-medium">
            {day}
          </div>
        ))}
      </div>

      {/* Heatmap rows */}
      {sortedWeeks.map(([weekStart, days]) => {
        // Sort days by day_of_week
        const sortedDays = days.sort((a, b) => a.day_of_week - b.day_of_week);

        // Format week label
        const weekDate = new Date(weekStart);
        const weekLabel = `W${sortedDays[0]?.week_number || ''}`;

        return (
          <div key={weekStart} className="grid grid-cols-8 gap-1">
            {/* Week label */}
            <div className="text-xs text-blue-300 flex items-center">
              {weekLabel}
            </div>

            {/* Day cells */}
            {sortedDays.map((day) => (
              <div
                key={`${weekStart}-${day.day_of_week}`}
                className={`
                  ${getActivityColor(day.activity_score)}
                  rounded-md
                  aspect-square
                  flex items-center justify-center
                  relative
                  group
                  cursor-pointer
                  transition-all duration-200
                  hover:scale-110
                  ${day.is_today ? 'ring-2 ring-blue-400' : ''}
                `}
                title={`${day.day_name}: ${day.reviews_count} reviews, ${Math.round(day.study_minutes)}min`}
              >
                {/* Tooltip on hover */}
                <div className="opacity-0 group-hover:opacity-100 absolute bottom-full mb-2 bg-black/90 text-white text-xs rounded px-2 py-1 whitespace-nowrap pointer-events-none z-10 transition-opacity">
                  <div className="font-semibold">{day.day_name}</div>
                  <div>{day.reviews_count} reviews</div>
                  <div>{Math.round(day.study_minutes)} min</div>
                </div>

                {/* Activity indicator */}
                {day.reviews_count > 0 && (
                  <span className="text-white text-xs font-semibold">
                    {day.reviews_count > 99 ? '99+' : day.reviews_count}
                  </span>
                )}
              </div>
            ))}
          </div>
        );
      })}

      {/* Legend */}
      <div className="flex items-center justify-between pt-4 border-t border-white/10">
        <div className="text-xs text-blue-200">Activity Level:</div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-blue-300">Less</span>
          <div className="flex gap-1">
            <div className="w-4 h-4 rounded bg-white/5"></div>
            <div className="w-4 h-4 rounded bg-green-500/30"></div>
            <div className="w-4 h-4 rounded bg-green-500/50"></div>
            <div className="w-4 h-4 rounded bg-green-500/70"></div>
            <div className="w-4 h-4 rounded bg-green-500/90"></div>
          </div>
          <span className="text-xs text-blue-300">More</span>
        </div>
      </div>
    </div>
  );
}
