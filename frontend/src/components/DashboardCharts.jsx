import {
    ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid,
} from 'recharts';
import { PROJECTS } from '../constants/projects';

// SVG fills accept CSS variables, so both charts follow light/dark mode for free.
const STATUSES = [
    { key: 'Pass', color: 'var(--status-pass)' },
    { key: 'Failed', color: 'var(--status-fail)' },
    { key: 'Pending', color: 'var(--status-pending)' },
    { key: 'N/A', color: 'var(--border-strong)' },
];

// Recharts sorts legend/tooltip items alphabetically by default; keep status order.
const statusOrder = (key) => STATUSES.findIndex((s) => s.key === key);

const UNASSIGNED = 'Unassigned';

const tooltipStyle = {
    contentStyle: {
        background: 'var(--bg-surface)',
        border: '1px solid var(--border)',
        borderRadius: 6,
        fontSize: 12,
    },
    labelStyle: { color: 'var(--text-primary)', fontWeight: 600 },
    itemStyle: { color: 'var(--text-secondary)' },
    itemSorter: (item) => statusOrder(item.name),
};

const axisTick = { fill: 'var(--text-tertiary)', fontSize: 11 };

const statusOf = (tc) => tc.executionStatus || 'Pending';

const DashboardCharts = ({ testCases }) => {
    const statusData = STATUSES
        .map((s) => ({ ...s, value: testCases.filter((tc) => statusOf(tc) === s.key).length }))
        .filter((s) => s.value > 0);

    // Only projects that actually have test cases, in the canonical order.
    const byProject = {};
    testCases.forEach((tc) => {
        const name = tc.project || UNASSIGNED;
        byProject[name] ??= { project: name };
        byProject[name][statusOf(tc)] = (byProject[name][statusOf(tc)] || 0) + 1;
    });
    const projectData = [...PROJECTS, UNASSIGNED].filter((p) => byProject[p]).map((p) => byProject[p]);

    if (testCases.length === 0) return null;

    return (
        <div className="dashboard-charts-grid">
            <div className="panel">
                <div className="panel-header">
                    <span style={{ fontSize: 'var(--text-md)', fontWeight: 600 }}>Execution Status</span>
                </div>
                <div className="panel-body" style={{ position: 'relative', height: 260 }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={statusData}
                                dataKey="value"
                                nameKey="key"
                                innerRadius="58%"
                                outerRadius="82%"
                                paddingAngle={statusData.length > 1 ? 2 : 0}
                                stroke="var(--bg-surface)"
                            >
                                {statusData.map((s) => <Cell key={s.key} fill={s.color} />)}
                            </Pie>
                            <Tooltip {...tooltipStyle} />
                            <Legend iconType="circle" iconSize={8} itemSorter={(item) => statusOrder(item.value)} wrapperStyle={{ fontSize: 12 }} />
                        </PieChart>
                    </ResponsiveContainer>
                    {/* Total in the donut hole; offset upward to clear the legend. */}
                    <div className="dashboard-donut-center">
                        <div style={{ fontSize: 'var(--text-xl)', fontWeight: 700 }}>{testCases.length}</div>
                        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>test cases</div>
                    </div>
                </div>
            </div>

            <div className="panel">
                <div className="panel-header">
                    <span style={{ fontSize: 'var(--text-md)', fontWeight: 600 }}>Status by Project</span>
                </div>
                <div className="panel-body" style={{ height: 260 }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={projectData} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                            <CartesianGrid vertical={false} stroke="var(--border-subtle)" />
                            <XAxis dataKey="project" tick={axisTick} tickLine={false} axisLine={{ stroke: 'var(--border)' }} />
                            <YAxis allowDecimals={false} tick={axisTick} tickLine={false} axisLine={false} />
                            <Tooltip {...tooltipStyle} cursor={{ fill: 'var(--border-subtle)' }} />
                            <Legend iconType="circle" iconSize={8} itemSorter={(item) => statusOrder(item.value)} wrapperStyle={{ fontSize: 12 }} />
                            {STATUSES.map((s) => (
                                <Bar key={s.key} dataKey={s.key} stackId="status" fill={s.color} maxBarSize={48} />
                            ))}
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};

export default DashboardCharts;
