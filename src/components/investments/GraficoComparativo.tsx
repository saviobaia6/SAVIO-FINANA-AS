import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { formatBRL } from '../../utils/investmentFormatters';

export interface ChartPoint {
  date: string;
  label?: string;
  cdi: number;
  cdb: number;
  invested?: number;
}

interface GraficoComparativoProps {
  data: ChartPoint[];
  cdbLabel?: string;
  title?: string;
  showInvested?: boolean;
  theme?: 'light' | 'dark';
}

export default function GraficoComparativo({
  data,
  cdbLabel = 'CDB',
  title = 'Evolução CDI × CDB',
  showInvested = false,
  theme = 'light',
}: GraficoComparativoProps) {
  const isDark = theme === 'dark';
  const gridStroke = isDark ? '#334155' : '#e2e8f0';
  const tickColor = isDark ? '#94a3b8' : '#64748b';
  const tooltipBg = isDark ? '#0f172a' : '#ffffff';
  const tooltipBorder = isDark ? '#334155' : '#cbd5e1';
  const tooltipText = isDark ? '#f8fafc' : '#0f172a';

  return (
    <div className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <h3 className="text-base font-bold text-[#14263d] dark:text-white">{title}</h3>
        <span className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
          {data.length} ponto{data.length === 1 ? '' : 's'} calculado{data.length === 1 ? '' : 's'}
        </span>
      </div>

      {data.length === 0 ? (
        <div className="h-[300px] w-full flex items-center justify-center rounded-xl border border-dashed border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-500 dark:text-slate-400 px-4 text-center">
          Aguardando dados reais do CDI ou parâmetros de simulação para gerar o gráfico comparativo.
        </div>
      ) : (
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 8, right: 12, left: 4, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
              <XAxis
                dataKey="date"
                tick={{ fill: tickColor, fontSize: 11 }}
                tickLine={false}
                minTickGap={24}
              />
              <YAxis
                tick={{ fill: tickColor, fontSize: 11 }}
                tickLine={false}
                width={86}
                tickFormatter={(value: number) =>
                  `R$ ${Number(value).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`
                }
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: tooltipBg,
                  borderColor: tooltipBorder,
                  borderRadius: '0.75rem',
                  color: tooltipText,
                  fontSize: '12px',
                }}
                formatter={(value: unknown, name: unknown) => [
                  formatBRL(Number(value) || 0),
                  String(name || ''),
                ]}
              />
              <Legend wrapperStyle={{ fontSize: '12px' }} />

              {showInvested && (
                <Line
                  type="monotone"
                  dataKey="invested"
                  name="Total aportado"
                  stroke={isDark ? '#94a3b8' : '#64748b'}
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  dot={false}
                />
              )}

              <Line
                type="monotone"
                dataKey="cdi"
                name="CDI 100%"
                stroke="#2563eb"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />

              <Line
                type="monotone"
                dataKey="cdb"
                name={cdbLabel}
                stroke="#059669"
                strokeWidth={3}
                dot={false}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
