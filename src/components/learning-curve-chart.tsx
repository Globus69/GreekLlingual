import { useMemo } from 'react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend
} from 'recharts';
import { LearningTrendPoint } from '@/hooks/use-stats-data';

interface LearningCurveChartProps {
    data: LearningTrendPoint[];
}

export default function LearningCurveChart({ data }: LearningCurveChartProps) {
    // Format data for chart
    const chartData = useMemo(() => {
        if (!data || data.length === 0) return [];

        return [...data]
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
            .map(point => {
                const date = new Date(point.date);
                return {
                    ...point,
                    // Format date as "Mon 14" or "14.02" depending on locale preferences
                    displayDate: date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
                };
            });
    }, [data]);

    if (!chartData || chartData.length === 0) {
        return (
            <div style={{ textAlign: 'center', color: '#BFDBFE', padding: '32px 0' }}>
                Not enough data for a learning curve yet. Keep studying!
            </div>
        );
    }

    return (
        <div style={{ width: '100%', height: '250px', marginTop: '16px' }}>
            <ResponsiveContainer width="100%" height="100%">
                <LineChart
                    data={chartData}
                    margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
                >
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                    <XAxis
                        dataKey="displayDate"
                        stroke="#93C5FD"
                        fontSize={12}
                        tickMargin={10}
                        axisLine={false}
                        tickLine={false}
                    />
                    <YAxis
                        yAxisId="left"
                        stroke="#93C5FD"
                        fontSize={12}
                        tickMargin={10}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(value) => `${value}`}
                    />
                    <YAxis
                        yAxisId="right"
                        orientation="right"
                        stroke="#34D399"
                        fontSize={12}
                        tickMargin={10}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(value) => `${value}%`}
                        domain={[0, 100]}
                    />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: '#1C1C1E',
                            borderColor: 'rgba(255,255,255,0.1)',
                            borderRadius: '8px',
                            color: '#fff'
                        }}
                        itemStyle={{ color: '#fff' }}
                    />
                    <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                    <Line
                        yAxisId="left"
                        type="monotone"
                        dataKey="reviews_count"
                        name="Reviews"
                        stroke="#3B82F6"
                        strokeWidth={3}
                        dot={{ r: 4, fill: '#3B82F6', strokeWidth: 0 }}
                        activeDot={{ r: 6 }}
                    />
                    <Line
                        yAxisId="right"
                        type="monotone"
                        dataKey="accuracy_percentage"
                        name="Accuracy (%)"
                        stroke="#34D399"
                        strokeWidth={3}
                        dot={{ r: 4, fill: '#34D399', strokeWidth: 0 }}
                        activeDot={{ r: 6 }}
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
}
