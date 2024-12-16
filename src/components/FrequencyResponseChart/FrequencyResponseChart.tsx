import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Label,
} from 'recharts';

type FrequencyResponseChartProps = {
  data: { frequency: number; gain: number }[];
};

const FrequencyResponseChart: React.FC<FrequencyResponseChartProps> = ({
  data,
}) => {
  // format the tick labels to show frequencies in Hz or kHz
  const formatFrequency = (value: number) => {
    return value >= 1000 ? `${(value / 1000).toFixed(1)}k` : `${value}`;
  };

  return (
    <div className="w-full h-64">
      <ResponsiveContainer>
        <LineChart
          data={data}
          margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
        >
          <XAxis
            dataKey="frequency"
            scale="log"
            domain={['dataMin', 'dataMax']}
            type="number"
            tickFormatter={formatFrequency}
          >
            <Label
              value="Frequency (Hz)"
              offset={-10}
              position="insideBottom"
            />
          </XAxis>
          <YAxis
            domain={[-60, 0]}
            ticks={[-60, -50, -40, -30, -20, -10, 0]}
            label={{ value: 'Gain (dB)', angle: -90, position: 'insideLeft' }}
          />
          <Tooltip
            formatter={(value: number) => value.toFixed(1) + ' dB'}
            labelFormatter={(label: number) => formatFrequency(label) + ' Hz'}
          />
          <Line
            type="monotone"
            dataKey="gain"
            stroke="#3F4DA8"
            dot={false}
            strokeWidth={3}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default FrequencyResponseChart;
