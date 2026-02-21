import { useMemo } from 'react';
import {
    Radar,
    RadarChart,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    ResponsiveContainer,
    Tooltip
} from 'recharts';
import { StatsData } from '@/hooks/use-stats-data';

interface DetailedStatsRadarProps {
    stats: StatsData;
}

export default function DetailedStatsRadar({ stats }: DetailedStatsRadarProps) {
    const chartData = useMemo(() => {
        // 1. Accuracy
        const accuracy = Math.round(stats.correctRate || 0);

        // 2. Consistency
        const consistency = Math.round(stats.consistencyScore || 0);

        // 3. Session Length (Normalized: 20 mins = 100%)
        const sessionLengthRaw = stats.avgSessionTime || 0;
        const sessionLength = Math.min(100, Math.round((sessionLengthRaw / 20) * 100));

        // 4. Review Volume (Normalized: 50 reviews/session = 100%)
        const totalReviews = stats.progressOverview?.total_reviews || 0;
        const totalSessions = stats.progressOverview?.total_sessions || 1;
        const reviewsPerSession = totalSessions > 0 ? totalReviews / totalSessions : 0;
        const reviewVolume = Math.min(100, Math.round((reviewsPerSession / 50) * 100));

        // 5. Overall Improvement 
        const improvementRaw = stats.progressOverview?.improvement_rate || 0;
        // Improvement rate is usually -100 to +100. Let's map it so 0% = 50, +50% = 100.
        const improvement = Math.min(100, Math.max(0, 50 + improvementRaw));

        return [
            { subject: 'Accuracy', A: accuracy, fullMark: 100 },
            { subject: 'Consistency', A: consistency, fullMark: 100 },
            { subject: 'Session Length', A: sessionLength, fullMark: 100 },
            { subject: 'Review Vol.', A: reviewVolume, fullMark: 100 },
            { subject: 'Improvement', A: improvement, fullMark: 100 },
        ];
    }, [stats]);

    return (
        <div style={{ width: '100%', height: '240px', marginTop: '16px' }}>
            <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="65%" data={chartData}>
                    <PolarGrid stroke="rgba(255,255,255,0.1)" />
                    <PolarAngleAxis
                        dataKey="subject"
                        tick={{ fill: '#93C5FD', fontSize: 11 }}
                    />
                    <PolarRadiusAxis
                        angle={90}
                        domain={[0, 100]}
                        tick={false}
                        axisLine={false}
                    />
                    <Radar
                        name="Score"
                        dataKey="A"
                        stroke="#3B82F6"
                        fill="#3B82F6"
                        fillOpacity={0.5}
                        activeDot={{ r: 4 }}
                    />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: '#1C1C1E',
                            borderColor: 'rgba(255,255,255,0.1)',
                            borderRadius: '8px',
                            color: '#fff',
                            fontSize: '12px'
                        }}
                        formatter={(value: any) => [`${value}/100`, 'Score']}
                        itemStyle={{ color: '#white' }}
                    />
                </RadarChart>
            </ResponsiveContainer>
        </div>
    );
}
